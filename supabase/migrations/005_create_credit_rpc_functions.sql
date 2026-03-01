-- 1) deduct_credits: 원자적 크레딧 차감 (onetime 우선 → subscription)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.user_credits%ROWTYPE;
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

  -- 잔액 부족 체크
  IF (v_row.onetime_balance + v_row.subscription_balance) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'available', v_row.onetime_balance + v_row.subscription_balance,
      'required', p_amount
    );
  END IF;

  -- onetime 먼저 차감
  v_onetime_deduct := LEAST(p_amount, v_row.onetime_balance);
  v_sub_deduct := p_amount - v_onetime_deduct;

  v_new_onetime := v_row.onetime_balance - v_onetime_deduct;
  v_new_sub := v_row.subscription_balance - v_sub_deduct;

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

-- 2) add_credits: 크레딧 추가 (구매/지급/환불)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_credit_type text,  -- 'onetime' or 'subscription'
  p_transaction_type public.credit_transaction_type,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.user_credits%ROWTYPE;
  v_new_onetime integer;
  v_new_sub integer;
  v_onetime_delta integer := 0;
  v_sub_delta integer := 0;
BEGIN
  SELECT * INTO v_row
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_credits not found for user %', p_user_id;
  END IF;

  IF p_credit_type = 'onetime' THEN
    v_onetime_delta := p_amount;
    v_new_onetime := v_row.onetime_balance + p_amount;
    v_new_sub := v_row.subscription_balance;
  ELSIF p_credit_type = 'subscription' THEN
    v_sub_delta := p_amount;
    v_new_onetime := v_row.onetime_balance;
    v_new_sub := v_row.subscription_balance + p_amount;
  ELSE
    RAISE EXCEPTION 'Invalid credit_type: %. Must be onetime or subscription', p_credit_type;
  END IF;

  UPDATE public.user_credits
  SET
    onetime_balance = v_new_onetime,
    subscription_balance = v_new_sub,
    balance = v_new_onetime + v_new_sub,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, type, onetime_delta, subscription_delta,
    balance_after_onetime, balance_after_subscription,
    description, metadata
  ) VALUES (
    p_user_id, p_transaction_type,
    v_onetime_delta, v_sub_delta,
    v_new_onetime, v_new_sub,
    p_description, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'onetime_balance', v_new_onetime,
    'subscription_balance', v_new_sub,
    'total_balance', v_new_onetime + v_new_sub
  );
END;
$$;

-- 3) handle_new_user 트리거 업데이트: 이중 잔액 + Free 구독 + 가입보너스 트랜잭션
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- users 테이블
  INSERT INTO public.users (id, email, name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email')
  );

  -- user_credits (balance=200, subscription_balance=200, onetime=0)
  INSERT INTO public.user_credits (user_id, balance, subscription_balance, onetime_balance)
  VALUES (NEW.id, 200, 200, 0);

  -- Free 구독 레코드
  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active');

  -- 가입 보너스 트랜잭션 기록
  INSERT INTO public.credit_transactions (
    user_id, type, subscription_delta, onetime_delta,
    balance_after_subscription, balance_after_onetime,
    description
  ) VALUES (
    NEW.id, 'signup_bonus', 200, 0, 200, 0,
    '가입 보너스 200 크레딧'
  );

  RETURN NEW;
END;
$$;
