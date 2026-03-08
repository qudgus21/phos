CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL DEFAULT 'image-edit',
  model_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  input_urls TEXT[] NOT NULL DEFAULT '{}',
  output_urls TEXT[] NOT NULL DEFAULT '{}',
  credits_used INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: 사용자별 + 기능별 최신순 조회
CREATE INDEX idx_generation_history_user_feature
  ON generation_history (user_id, feature_type, created_at DESC);

-- RLS 활성화
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회 가능
CREATE POLICY "Users can view own history"
  ON generation_history FOR SELECT
  USING (auth.uid() = user_id);

-- 서비스 롤만 INSERT 가능 (API route에서 admin client 사용)
CREATE POLICY "Service role can insert history"
  ON generation_history FOR INSERT
  WITH CHECK (true);
