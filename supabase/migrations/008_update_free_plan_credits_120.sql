-- Free 플랜 가입 보너스 200 → 120으로 변경
UPDATE subscription_plans SET monthly_credits = 120 WHERE id = 'free';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email')
  );

  INSERT INTO public.user_credits (user_id, balance, subscription_balance, onetime_balance)
  VALUES (NEW.id, 120, 120, 0);

  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active');

  INSERT INTO public.credit_transactions (
    user_id, type, subscription_delta, onetime_delta,
    balance_after_subscription, balance_after_onetime,
    description
  ) VALUES (
    NEW.id, 'signup_bonus', 120, 0, 120, 0,
    '가입 보너스 120 크레딧'
  );

  RETURN NEW;
END;
$$;
