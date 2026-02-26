-- 소셜 로그인 연결 시 public.users에 프로필 정보 동기화
CREATE OR REPLACE FUNCTION handle_user_updated()
RETURNS trigger AS $$
DECLARE
  _new_name text;
  _new_avatar text;
  _new_provider text;
BEGIN
  _new_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name');
  _new_avatar := NEW.raw_user_meta_data ->> 'avatar_url';
  _new_provider := NEW.raw_app_meta_data ->> 'provider';

  UPDATE public.users SET
    name = COALESCE(_new_name, name),
    avatar_url = COALESCE(_new_avatar, avatar_url),
    auth_provider = COALESCE(_new_provider, auth_provider),
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 메타데이터 변경 시에만 트리거 실행 (세션 갱신 등 불필요한 실행 방지)
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data
    OR NEW.raw_app_meta_data IS DISTINCT FROM OLD.raw_app_meta_data)
  EXECUTE FUNCTION handle_user_updated();
