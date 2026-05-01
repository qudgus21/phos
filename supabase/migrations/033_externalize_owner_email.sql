-- Externalize the owner email used for auto-admin assignment in handle_new_user.
-- Reads the value from a Postgres custom GUC instead of hardcoding the email.
--
-- Prerequisite (run once in SQL Editor before applying this migration):
--   ALTER DATABASE postgres SET app.owner_email = 'hbh4231@gmail.com';
--
-- Body below is identical to migration 009 except the email comparison
-- now reads from current_setting('app.owner_email').

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := 'user';
  v_owner_email text := current_setting('app.owner_email', true);
BEGIN
  IF v_owner_email IS NOT NULL AND NEW.email = v_owner_email THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.users (id, email, name, avatar_url, auth_provider, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email'),
    v_role
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
