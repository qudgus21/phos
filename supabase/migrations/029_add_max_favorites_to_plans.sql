-- 플랜별 즐겨찾기 최대 개수 컬럼 추가
ALTER TABLE public.subscription_plans
  ADD COLUMN max_favorites integer NOT NULL DEFAULT 3;

-- 플랜별 값 설정
UPDATE public.subscription_plans SET max_favorites = 3    WHERE id = 'free';
UPDATE public.subscription_plans SET max_favorites = 10   WHERE id = 'basic';
UPDATE public.subscription_plans SET max_favorites = 20   WHERE id = 'pro';
UPDATE public.subscription_plans SET max_favorites = 9999 WHERE id = 'premium';
