-- ============================================================
-- 025: 구독 크레딧 누적 정책
--   갱신 시 이전 잔액 + 새 크레딧 (리셋 아님)
--   업그레이드 시 누적분 보존 + 이번 달 크레딧만 교체
-- ============================================================

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
    -- 업그레이드: 이전 누적분 보존 + 이번 달 부여분만 새 플랜으로 교체
    -- 공식: 기존잔액 - 이번달부여분 + 새플랜크레딧
    -- 예: 누적1000 + 이번달잔액1500(부여2000) → 2500 - 2000 + 4400 = 4900
    v_new_sub_balance := GREATEST(v_old_sub_balance - v_period_granted + p_credits, 0);
  ELSE
    -- 신규/갱신: 기존 잔액에 새 크레딧 누적
    v_new_sub_balance := v_old_sub_balance + p_credits;
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
       'old_plan_credits', p_old_plan_credits, 'old_balance', v_old_sub_balance,
       'period_credits_granted', p_credits));

  IF p_order_id IS NOT NULL THEN
    INSERT INTO public.orders
      (id, user_id, polar_product_id, product_type, amount_cents, credits_granted, polar_subscription_id, status)
    VALUES
      (p_order_id, p_user_id, p_polar_product_id, 'subscription', p_amount_cents, p_credits, p_polar_subscription_id, 'paid')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'subscription_balance', v_new_sub_balance);
END;
$$;
