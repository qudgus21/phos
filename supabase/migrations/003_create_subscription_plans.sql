-- 구독 플랜 참조 테이블
CREATE TABLE public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  monthly_credits integer NOT NULL DEFAULT 0,
  max_batch_size integer NOT NULL DEFAULT 1,
  cooldown_seconds integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: 모든 사용자 읽기 허용
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_all"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- 시드 데이터
INSERT INTO public.subscription_plans (id, name, price_usd, monthly_credits, max_batch_size, cooldown_seconds, features, sort_order) VALUES
  ('free',    'Free',    0,     200,   1, 300, '{"watermark": true}', 0),
  ('basic',   'Basic',   9.99,  4500,  4, 0,   '{"watermark": false, "priority_queue": false}', 1),
  ('deluxe',  'Deluxe',  19.99, 9500,  4, 0,   '{"watermark": false, "priority_queue": true}', 2),
  ('premium', 'Premium', 39.99, 14500, 4, 0,   '{"watermark": false, "priority_queue": true, "api_access": true}', 3);
