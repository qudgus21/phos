-- pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 5분 이상 pending 상태인 generation_history를 failed로 전환하고 크레딧을 환불하는 함수
CREATE OR REPLACE FUNCTION cleanup_stale_pending_generations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, user_id, onetime_deducted, subscription_deducted, model_id, credits_used
    FROM generation_history
    WHERE status = 'pending'
      AND created_at < now() - interval '5 minutes'
    FOR UPDATE SKIP LOCKED
  LOOP
    -- pending → failed
    UPDATE generation_history
    SET status = 'failed',
        error_message = '생성 시간이 초과되었습니다'
    WHERE id = r.id;

    -- 크레딧 환불
    IF r.onetime_deducted > 0 THEN
      PERFORM add_credits(
        r.user_id,
        r.onetime_deducted,
        'onetime',
        'refund',
        '생성 타임아웃 환불 (onetime)',
        jsonb_build_object('history_id', r.id, 'reason', 'timeout')
      );
    END IF;

    IF r.subscription_deducted > 0 THEN
      PERFORM add_credits(
        r.user_id,
        r.subscription_deducted,
        'subscription',
        'refund',
        '생성 타임아웃 환불 (subscription)',
        jsonb_build_object('history_id', r.id, 'reason', 'timeout')
      );
    END IF;
  END LOOP;
END;
$$;

-- 5분마다 실행하는 cron job
SELECT cron.schedule(
  'cleanup-stale-pending',
  '*/5 * * * *',
  $$SELECT cleanup_stale_pending_generations()$$
);
