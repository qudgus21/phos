-- search_path를 고정하여 보안 경고 해결
ALTER FUNCTION public.deduct_credits(uuid, integer, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.add_credits(uuid, integer, text, public.credit_transaction_type, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public;

ALTER FUNCTION public.handle_user_updated()
  SET search_path = public;
