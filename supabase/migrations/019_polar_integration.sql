-- ============================================================
-- 019: Polar 결제 연동 — 테이블, 컬럼, RPC
-- ============================================================

-- (A) users 테이블에 polar_customer_id 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS polar_customer_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_polar_customer_id
  ON public.users(polar_customer_id) WHERE polar_customer_id IS NOT NULL;

-- (B) credit_transaction_type enum 확장
ALTER TYPE public.credit_transaction_type ADD VALUE IF NOT EXISTS 'subscription_renewal';

-- (C) webhook_events 테이블 — 멱등성 보장
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- service_role 전용 — 사용자 직접 접근 불가 (RLS policy 없음)

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.webhook_events(created_at DESC);

-- (D) orders 테이블 — Polar 주문 로컬 추적
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  polar_product_id text NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('subscription', 'credit_pack')),
  amount_cents integer NOT NULL DEFAULT 0,
  credits_granted integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'partially_refunded')),
  polar_subscription_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_polar_subscription_id
  ON public.orders(polar_subscription_id) WHERE polar_subscription_id IS NOT NULL;

-- ============================================================
-- (E) RPC: process_subscription_activation
--     구독 활성화 / 갱신 / 플랜 변경 모두 처리 (원자적)
-- ============================================================
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
  p_polar_product_id text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_sub_balance integer;
  v_onetime_balance integer;
BEGIN
  -- 1. user_credits row lock
  SELECT subscription_balance, onetime_balance
    INTO v_old_sub_balance, v_onetime_balance
    FROM public.user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_credits not found');
  END IF;

  -- 2. user_subscriptions UPSERT
  INSERT INTO public.user_subscriptions
    (user_id, plan_id, status, external_subscription_id, external_customer_id, current_period_start, current_period_end)
  VALUES
    (p_user_id, p_plan_id, 'active', p_polar_subscription_id, p_polar_customer_id, p_period_start, p_period_end)
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    external_subscription_id = EXCLUDED.external_subscription_id,
    external_customer_id = EXCLUDED.external_customer_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();

  -- 3. polar_customer_id 설정
  UPDATE public.users
     SET polar_customer_id = p_polar_customer_id
   WHERE id = p_user_id
     AND (polar_customer_id IS NULL OR polar_customer_id != p_polar_customer_id);

  -- 4. subscription_balance 리셋
  UPDATE public.user_credits SET
    subscription_balance = p_credits,
    balance = v_onetime_balance + p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 5. credit_transactions 기록
  INSERT INTO public.credit_transactions
    (user_id, type, subscription_delta, onetime_delta, balance_after_subscription, balance_after_onetime, description, metadata)
  VALUES
    (p_user_id, 'subscription_grant',
     p_credits - v_old_sub_balance, 0,
     p_credits, v_onetime_balance,
     'Subscription activated: ' || p_plan_id,
     jsonb_build_object(
       'plan_id', p_plan_id,
       'order_id', p_order_id,
       'polar_subscription_id', p_polar_subscription_id
     ));

  -- 6. orders 기록 (멱등 — ON CONFLICT DO NOTHING)
  IF p_order_id IS NOT NULL THEN
    INSERT INTO public.orders
      (id, user_id, polar_product_id, product_type, amount_cents, credits_granted, polar_subscription_id, status)
    VALUES
      (p_order_id, p_user_id, p_polar_product_id, 'subscription', p_amount_cents, p_credits, p_polar_subscription_id, 'paid')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'subscription_balance', p_credits);
END;
$$;

-- ============================================================
-- (F) RPC: process_credit_purchase
--     크레딧 팩 구매 처리 (원자적)
-- ============================================================
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

-- ============================================================
-- (G) RPC: process_refund
--     환불 처리 — 잔액 부족 시 0으로 설정 (음수 방지)
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_refund(
  p_user_id uuid,
  p_order_id text,
  p_credits_to_revoke integer,
  p_refund_type text DEFAULT 'full'  -- 'full' | 'partial'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_current_balance integer;
  v_actual_deducted integer;
  v_shortfall integer;
  v_new_balance integer;
  v_onetime integer;
  v_subscription integer;
BEGIN
  -- 1. 주문 조회 + lock
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'order not found');
  END IF;

  -- 2. user_credits lock
  SELECT onetime_balance, subscription_balance
    INTO v_onetime, v_subscription
    FROM public.user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  -- 3. product_type에 따라 차감
  IF v_order.product_type = 'credit_pack' THEN
    v_current_balance := v_onetime;
    v_actual_deducted := LEAST(p_credits_to_revoke, v_current_balance);
    v_shortfall := p_credits_to_revoke - v_actual_deducted;
    v_onetime := v_onetime - v_actual_deducted;

    UPDATE public.user_credits SET
      onetime_balance = v_onetime,
      balance = v_onetime + v_subscription,
      updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_transactions
      (user_id, type, onetime_delta, subscription_delta, balance_after_onetime, balance_after_subscription, description, metadata)
    VALUES
      (p_user_id, 'refund', -v_actual_deducted, 0, v_onetime, v_subscription,
       'Refund: order ' || p_order_id,
       jsonb_build_object('order_id', p_order_id, 'requested', p_credits_to_revoke, 'actual', v_actual_deducted, 'shortfall', v_shortfall));

  ELSE -- subscription
    v_current_balance := v_subscription;
    v_actual_deducted := LEAST(p_credits_to_revoke, v_current_balance);
    v_shortfall := p_credits_to_revoke - v_actual_deducted;
    v_subscription := v_subscription - v_actual_deducted;

    UPDATE public.user_credits SET
      subscription_balance = v_subscription,
      balance = v_onetime + v_subscription,
      updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_transactions
      (user_id, type, subscription_delta, onetime_delta, balance_after_subscription, balance_after_onetime, description, metadata)
    VALUES
      (p_user_id, 'refund', -v_actual_deducted, 0, v_subscription, v_onetime,
       'Refund: order ' || p_order_id,
       jsonb_build_object('order_id', p_order_id, 'requested', p_credits_to_revoke, 'actual', v_actual_deducted, 'shortfall', v_shortfall));

    -- 구독 전액 환불 시 구독 취소
    IF p_refund_type = 'full' THEN
      UPDATE public.user_subscriptions SET status = 'canceled', updated_at = now() WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- 4. orders 상태 갱신
  UPDATE public.orders SET
    status = CASE WHEN p_refund_type = 'full' THEN 'refunded' ELSE 'partially_refunded' END,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'actual_deducted', v_actual_deducted, 'shortfall', v_shortfall);
END;
$$;

-- ============================================================
-- (H) RPC: process_subscription_revoke
--     구독 해지 (결제 실패 등) → free 다운그레이드
-- ============================================================
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

  -- 2. 구독 다운그레이드
  UPDATE public.user_subscriptions SET
    plan_id = 'free',
    status = 'revoked',
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 3. subscription_balance 0으로 리셋
  UPDATE public.user_credits SET
    subscription_balance = 0,
    balance = v_onetime,
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
