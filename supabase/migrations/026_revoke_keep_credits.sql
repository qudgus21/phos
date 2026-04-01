-- ============================================================
-- 026: process_subscription_revoke 크레딧 회수 제거
--   정책: 결제한 크레딧은 어떤 상황에서도 뺏지 않음
--   해지(revoked) = Free 전환 + 다음 충전 안 됨. 기존 크레딧은 유지
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
  v_sub_balance integer;
  v_onetime integer;
BEGIN
  -- 1. user_credits 조회 (lock)
  SELECT subscription_balance, onetime_balance
    INTO v_sub_balance, v_onetime
    FROM public.user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_credits not found');
  END IF;

  -- 2. 구독 상태 변경 + stale 필드 정리 (크레딧은 건드리지 않음)
  UPDATE public.user_subscriptions SET
    plan_id = 'free',
    status = 'revoked',
    scheduled_plan_id = NULL,
    external_subscription_id = NULL,
    current_period_start = NULL,
    current_period_end = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 3. period_credits_granted만 리셋 (크레딧 잔액은 유지)
  UPDATE public.user_credits SET
    period_credits_granted = 0,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'subscription_balance_kept', v_sub_balance);
END;
$$;
