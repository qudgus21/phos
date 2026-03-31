-- 다운그레이드 예약 플랜 (null이면 예약 없음)
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS scheduled_plan_id text DEFAULT NULL;
