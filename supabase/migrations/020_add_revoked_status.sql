-- user_subscriptions.status CHECK에 'revoked' 추가
-- process_subscription_revoke RPC에서 사용
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'past_due', 'paused', 'revoked'));
