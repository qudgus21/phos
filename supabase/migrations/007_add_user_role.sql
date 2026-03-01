-- users 테이블에 role 컬럼 추가
ALTER TABLE public.users
  ADD COLUMN role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));
