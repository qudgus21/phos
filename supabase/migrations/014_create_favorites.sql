-- =============================================
-- 즐겨찾기 테이블
-- =============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL DEFAULT 'image-edit',
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  reference_image_urls TEXT[] NOT NULL DEFAULT '{}',
  model_id TEXT NOT NULL,
  ratio TEXT NOT NULL DEFAULT 'AUTO',
  image_size TEXT NOT NULL DEFAULT '1K',
  scale NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  image_count INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_favorites_user_feature ON favorites (user_id, feature_type);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON favorites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Storage 버킷: favorite-images (public)
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('favorite-images', 'favorite-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload favorite images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'favorite-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view favorite images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'favorite-images');

CREATE POLICY "Users can delete own favorite images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'favorite-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
