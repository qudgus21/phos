-- Replicate prediction ID ↔ generation_history 매핑 테이블
-- webhook 방식 전환을 위해 prediction 상태를 추적한다.
-- image-edit은 1개 history에 N개 prediction (최대 4장), generation + upscale 2단계 체이닝 지원.

CREATE TABLE replicate_predictions (
  id              TEXT PRIMARY KEY,                -- Replicate prediction ID
  history_id      UUID NOT NULL REFERENCES generation_history(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('generation', 'upscale')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  output_urls     TEXT[] DEFAULT '{}',
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',              -- { upscale_scale, batch_index, total_batches, retry_of }
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- history별 prediction 조회 (webhook 핸들러에서 batch 완료 체크)
CREATE INDEX idx_rp_history ON replicate_predictions(history_id, prediction_type);

-- stale prediction 정리용
CREATE INDEX idx_rp_pending ON replicate_predictions(status) WHERE status = 'pending';

-- RLS: service_role만 접근 (webhook 엔드포인트 + API route에서만 사용)
ALTER TABLE replicate_predictions ENABLE ROW LEVEL SECURITY;
