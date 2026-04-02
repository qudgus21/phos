-- 문의 유형 enum
CREATE TYPE inquiry_category AS ENUM (
  'payment_refund',
  'bug_report',
  'feature_request',
  'account_issue',
  'other'
);

-- 문의 테이블
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  category inquiry_category NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  user_email TEXT,
  user_name TEXT,
  user_plan TEXT,
  user_credits INTEGER,
  ip_address INET,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (service_role 전용)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- inquiry-images 스토리지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('inquiry-images', 'inquiry-images', true)
ON CONFLICT (id) DO NOTHING;

-- 누구나 업로드 가능 (API Route에서 제어)
CREATE POLICY "inquiry_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inquiry-images');

-- 공개 읽기
CREATE POLICY "inquiry_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inquiry-images');
