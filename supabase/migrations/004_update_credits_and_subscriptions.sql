-- 1) user_credits에 이중 잔액 컬럼 추가
ALTER TABLE public.user_credits
  ADD COLUMN subscription_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN onetime_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN last_generation_at timestamptz;

-- 기존 balance 값 → onetime_balance로 이관
UPDATE public.user_credits
  SET onetime_balance = balance;

-- 2) user_subscriptions 테이블
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.subscription_plans(id) DEFAULT 'free',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  external_subscription_id text,
  external_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_select_own"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3) credit_transactions 테이블
CREATE TYPE public.credit_transaction_type AS ENUM (
  'signup_bonus',
  'subscription_grant',
  'onetime_purchase',
  'generation_deduct',
  'refund',
  'admin_adjust'
);

CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.credit_transaction_type NOT NULL,
  onetime_delta integer NOT NULL DEFAULT 0,
  subscription_delta integer NOT NULL DEFAULT 0,
  balance_after_onetime integer NOT NULL DEFAULT 0,
  balance_after_subscription integer NOT NULL DEFAULT 0,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions_select_own"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- 4) 기존 유저에 Free 구독 레코드 자동 INSERT
INSERT INTO public.user_subscriptions (user_id, plan_id, status)
SELECT id, 'free', 'active' FROM public.users
ON CONFLICT (user_id) DO NOTHING;
