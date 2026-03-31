-- period_credits_granted: 이번 주기에 부여된 크레딧 추적 (업그레이드 시 사용량 차감용)
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS period_credits_granted integer NOT NULL DEFAULT 0;

-- 기존 구독자 초기화
UPDATE public.user_credits uc SET period_credits_granted = COALESCE(
  (SELECT sp.monthly_credits FROM user_subscriptions us
   JOIN subscription_plans sp ON sp.id = us.plan_id
   WHERE us.user_id = uc.user_id),
  0
);

-- 이전 버전 함수 정리 + 새 버전 (period_credits_granted 반영)
DROP FUNCTION IF EXISTS public.process_subscription_activation(
  uuid, text, text, text, timestamptz, timestamptz, integer, text, integer, text
);
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

  UPDATE public.user_credits SET
    subscription_balance = v_new_sub_balance,
    balance = v_onetime_balance + v_new_sub_balance,
    period_credits_granted = v_new_sub_balance,
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
       'old_plan_credits', p_old_plan_credits, 'used_credits', v_used, 'period_credits_granted', v_new_sub_balance));

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
