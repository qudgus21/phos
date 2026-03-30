-- UI 기준으로 구독 플랜 가격·크레딧 정합성 맞춤
UPDATE public.subscription_plans SET monthly_credits = 120   WHERE id = 'free';
UPDATE public.subscription_plans SET price_usd = 9,  monthly_credits = 2000  WHERE id = 'basic';
UPDATE public.subscription_plans SET price_usd = 19, monthly_credits = 4400  WHERE id = 'deluxe';
UPDATE public.subscription_plans SET price_usd = 29, monthly_credits = 7100  WHERE id = 'premium';
