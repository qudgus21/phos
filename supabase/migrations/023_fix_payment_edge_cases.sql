-- ============================================================
-- 023: 결제 시스템 엣지케이스 수정
--   C3: RPC 함수 order_id 멱등성 체크
--   H3: deduct_credits에 만료 구독 크레딧 체크
--   H5: process_subscription_revoke 필드 정리
--   H6: period_credits_granted 계산 수정
-- ============================================================

-- ── (A) process_credit_purchase: order_id 멱등성 ─────────
CREATE OR REPLACE FUNCTION public.process_credit_purchase(
  p_user_id uuid,
  p_credits integer,
  p_order_id text,
  p_amount_cents integer,
  p_polar_product_id text,
  p_polar_customer_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_onetime integer;
  v_sub_balance integer;
BEGIN
  -- 멱등성: 이미 처리된 주문이면 즉시 반환
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    SELECT onetime_balance, subscription_balance
      INTO v_new_onetime, v_sub_balance
      FROM public.user_credits WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'already_processed', true,
      'onetime_balance', v_new_onetime, 'total_balance', v_new_onetime + COALESCE(v_sub_balance, 0));
  END IF;

  -- 1. user_credits lock
  SELECT onetime_balance, subscription_balance
    INTO v_new_onetime, v_sub_balance
    FROM public.user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_credits not found');
  END IF;

  v_new_onetime := v_new_onetime + p_credits;

  -- 2. 잔액 갱신
  UPDATE public.user_credits SET
    onetime_balance = v_new_onetime,
    balance = v_new_onetime + v_sub_balance,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 3. credit_transactions 기록
  INSERT INTO public.credit_transactions
    (user_id, type, onetime_delta, subscription_delta, balance_after_onetime, balance_after_subscription, description, metadata)
  VALUES
    (p_user_id, 'onetime_purchase', p_credits, 0, v_new_onetime, v_sub_balance,
     'Credit pack purchase: ' || p_credits || ' credits',
     jsonb_build_object('order_id', p_order_id, 'amount_cents', p_amount_cents, 'polar_product_id', p_polar_product_id));

  -- 4. polar_customer_id 설정
  IF p_polar_customer_id IS NOT NULL THEN
    UPDATE public.users
       SET polar_customer_id = p_polar_customer_id
     WHERE id = p_user_id
       AND (polar_customer_id IS NULL OR polar_customer_id != p_polar_customer_id);
  END IF;

  -- 5. orders 기록
  INSERT INTO public.orders
    (id, user_id, polar_product_id, product_type, amount_cents, credits_granted, status)
  VALUES
    (p_order_id, p_user_id, p_polar_product_id, 'credit_pack', p_amount_cents, p_credits, 'paid')
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'onetime_balance', v_new_onetime, 'total_balance', v_new_onetime + v_sub_balance);
END;
$$;

-- ── (B) process_subscription_activation: order_id 멱등성 + period_credits_granted 수정 ──
DROP FUNCTION IF EXISTS public.process_subscription_activation(
  uuid, text, text, text, timestamptz, timestamptz, integer, text, integer, text, integer
);

CREATE OR REPLACE FUNCTION public.process_subscription_activation(
  p_user_id uuid,
  p_plan_id text,
  p_polar_subscription_id text,
  p_polar_customer_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_credits integer,
  p_order_id text DEFAULT NULL,
  p_amount_cents integer DEFAULT 0,
  p_polar_product_id text DEFAULT '',
  p_old_plan_credits integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_sub_balance integer;
  v_onetime_balance integer;
  v_period_granted integer;
  v_used integer;
  v_new_sub_balance integer;
BEGIN
  -- 멱등성: order_id가 있고 이미 처리된 주문이면 즉시 반환
  IF p_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    SELECT subscription_balance INTO v_old_sub_balance
      FROM public.user_credits WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'already_processed', true,
      'subscription_balance', COALESCE(v_old_sub_balance, 0));
  END IF;

  SELECT subscription_balance, onetime_balance, period_credits_granted
    INTO v_old_sub_balance, v_onetime_balance, v_period_granted
    FROM public.user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_credits not found');
  END IF;

  IF p_old_plan_credits IS NOT NULL THEN
    -- 업그레이드: period_credits_granted 기반 사용량 차감
    v_used := GREATEST(v_period_granted - v_old_sub_balance, 0);
    v_new_sub_balance := GREATEST(p_credits - v_used, 0);
  ELSE
    -- 신규/갱신: 전액 부여
    v_new_sub_balance := p_credits;
  END IF;

  INSERT INTO public.user_subscriptions
    (user_id, plan_id, status, external_subscription_id, external_customer_id, current_period_start, current_period_end)
  VALUES
    (p_user_id, p_plan_id, 'active', p_polar_subscription_id, p_polar_customer_id, p_period_start, p_period_end)
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id, status = 'active',
    external_subscription_id = EXCLUDED.external_subscription_id,
    external_customer_id = EXCLUDED.external_customer_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();

  UPDATE public.users SET polar_customer_id = p_polar_customer_id
   WHERE id = p_user_id AND (polar_customer_id IS NULL OR polar_customer_id != p_polar_customer_id);

  -- H6 수정: period_credits_granted = p_credits (플랜 정가), v_new_sub_balance 아님
  UPDATE public.user_credits SET
    subscription_balance = v_new_sub_balance,
    balance = v_onetime_balance + v_new_sub_balance,
    period_credits_granted = p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions
    (user_id, type, subscription_delta, onetime_delta, balance_after_subscription, balance_after_onetime, description, metadata)
  VALUES
    (p_user_id, 'subscription_grant',
     v_new_sub_balance - v_old_sub_balance, 0,
     v_new_sub_balance, v_onetime_balance,
     'Subscription activated: ' || p_plan_id,
     jsonb_build_object('plan_id', p_plan_id, 'order_id', p_order_id, 'polar_subscription_id', p_polar_subscription_id,
       'old_plan_credits', p_old_plan_credits, 'used_credits', v_used, 'period_credits_granted', p_credits));

  IF p_order_id IS NOT NULL THEN
    INSERT INTO public.orders
      (id, user_id, polar_product_id, product_type, amount_cents, credits_granted, polar_subscription_id, status)
    VALUES
      (p_order_id, p_user_id, p_polar_product_id, 'subscription', p_amount_cents, v_new_sub_balance, p_polar_subscription_id, 'paid')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'subscription_balance', v_new_sub_balance, 'used_credits', COALESCE(v_used, 0));
END;
$$;

-- ── (C) process_subscription_revoke: 필드 정리 ──────────
CREATE OR REPLACE FUNCTION public.process_subscription_revoke(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_sub_balance integer;
  v_onetime integer;
BEGIN
  -- 1. user_credits lock
  SELECT subscription_balance, onetime_balance
    INTO v_old_sub_balance, v_onetime
    FROM public.user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_credits not found');
  END IF;

  -- 2. 구독 다운그레이드 + stale 필드 정리
  UPDATE public.user_subscriptions SET
    plan_id = 'free',
    status = 'revoked',
    scheduled_plan_id = NULL,
    external_subscription_id = NULL,
    current_period_start = NULL,
    current_period_end = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 3. subscription_balance + period_credits_granted 리셋
  UPDATE public.user_credits SET
    subscription_balance = 0,
    balance = v_onetime,
    period_credits_granted = 0,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 4. 트랜잭션 기록
  IF v_old_sub_balance > 0 THEN
    INSERT INTO public.credit_transactions
      (user_id, type, subscription_delta, onetime_delta, balance_after_subscription, balance_after_onetime, description, metadata)
    VALUES
      (p_user_id, 'admin_adjust', -v_old_sub_balance, 0, 0, v_onetime,
       '구독 해지로 인한 크레딧 회수',
       jsonb_build_object('reason', 'subscription_revoked', 'revoked_credits', v_old_sub_balance));
  END IF;

  RETURN jsonb_build_object('success', true, 'revoked_credits', v_old_sub_balance);
END;
$$;

-- ── (D) deduct_credits: 만료된 구독 크레딧 체크 ─────────
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_credits%ROWTYPE;
  v_sub_status text;
  v_period_end timestamptz;
  v_effective_sub integer;
  v_onetime_deduct integer;
  v_sub_deduct integer;
  v_new_onetime integer;
  v_new_sub integer;
BEGIN
  -- FOR UPDATE 잠금
  SELECT * INTO v_row
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_credits not found for user %', p_user_id;
  END IF;

  -- 만료된 구독 크레딧 체크 (canceled/revoked + period_end 경과)
  SELECT status, current_period_end
    INTO v_sub_status, v_period_end
    FROM public.user_subscriptions
   WHERE user_id = p_user_id;

  v_effective_sub := v_row.subscription_balance;

  IF v_sub_status IN ('canceled', 'revoked')
     AND v_period_end IS NOT NULL
     AND v_period_end < now() THEN
    -- 만료된 구독 크레딧은 사용 불가
    v_effective_sub := 0;

    -- DB lazy 업데이트
    IF v_row.subscription_balance > 0 THEN
      UPDATE public.user_credits SET
        subscription_balance = 0,
        balance = v_row.onetime_balance,
        updated_at = now()
      WHERE user_id = p_user_id;

      v_row.subscription_balance := 0;
      v_row.balance := v_row.onetime_balance;
    END IF;
  END IF;

  -- 잔액 부족 체크
  IF (v_row.onetime_balance + v_effective_sub) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'available', v_row.onetime_balance + v_effective_sub,
      'required', p_amount
    );
  END IF;

  -- onetime 먼저 차감
  v_onetime_deduct := LEAST(p_amount, v_row.onetime_balance);
  v_sub_deduct := p_amount - v_onetime_deduct;

  v_new_onetime := v_row.onetime_balance - v_onetime_deduct;
  v_new_sub := v_effective_sub - v_sub_deduct;

  -- user_credits 업데이트
  UPDATE public.user_credits
  SET
    onetime_balance = v_new_onetime,
    subscription_balance = v_new_sub,
    balance = v_new_onetime + v_new_sub,
    last_generation_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 트랜잭션 기록
  INSERT INTO public.credit_transactions (
    user_id, type, onetime_delta, subscription_delta,
    balance_after_onetime, balance_after_subscription,
    description, metadata
  ) VALUES (
    p_user_id, 'generation_deduct',
    -v_onetime_deduct, -v_sub_deduct,
    v_new_onetime, v_new_sub,
    p_description, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'onetime_balance', v_new_onetime,
    'subscription_balance', v_new_sub,
    'total_balance', v_new_onetime + v_new_sub,
    'onetime_deducted', v_onetime_deduct,
    'subscription_deducted', v_sub_deduct
  );
END;
$$;
