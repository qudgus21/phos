-- 생성 상태 관리 + Supabase Realtime 활성화
-- pending → completed/failed 전환으로 비동기 생성 흐름 지원

-- status 컬럼 (기존 row는 completed로 간주)
ALTER TABLE generation_history
  ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';

-- 실패 시 에러 메시지
ALTER TABLE generation_history
  ADD COLUMN error_message TEXT;

-- 환불용 차감 내역 저장
ALTER TABLE generation_history
  ADD COLUMN onetime_deducted INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN subscription_deducted INTEGER NOT NULL DEFAULT 0;

-- pending 조회 최적화 인덱스
CREATE INDEX idx_generation_history_pending
  ON generation_history (user_id, status) WHERE status = 'pending';

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE generation_history;

-- UPDATE 이벤트에 전체 row 포함
ALTER TABLE generation_history REPLICA IDENTITY FULL;
