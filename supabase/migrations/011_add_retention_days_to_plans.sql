-- 플랜별 히스토리 보관 기간 (일 단위, NULL = 무제한)
ALTER TABLE subscription_plans
  ADD COLUMN retention_days INTEGER DEFAULT 30;

-- 기본값 설정: Free=30일, 유료 플랜은 나중에 UPDATE로 조정
COMMENT ON COLUMN subscription_plans.retention_days IS '히스토리 보관 기간 (일). NULL=무제한, 30=30일 후 자동 삭제 대상';
