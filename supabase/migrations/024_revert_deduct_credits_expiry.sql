-- ============================================================
-- 024: deduct_credits에서 만료 체크 로직 제거
--   정책 변경: 구독 크레딧은 취소 후에도 영구 유지
-- ============================================================

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
