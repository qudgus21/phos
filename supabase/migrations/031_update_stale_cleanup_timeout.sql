-- webhook 방식 전환에 따라 stale pending 타임아웃을 5분 → 10분으로 연장.
-- Replicate webhook은 실패 시 exponential backoff 재시도(최종 ~1분 후)하므로 여유가 필요하다.

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
      AND created_at < now() - interval '10 minutes'
    FOR UPDATE SKIP LOCKED
  LOOP
    -- pending → failed
    UPDATE generation_history
    SET status = 'failed',
        error_message = '생성 시간이 초과되었습니다'
    WHERE id = r.id;

    -- 연관된 replicate_predictions도 failed 처리
    UPDATE replicate_predictions
    SET status = 'failed',
        error_message = 'timeout',
        completed_at = now()
    WHERE history_id = r.id
      AND status = 'pending';

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
