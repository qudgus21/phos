-- 업스케일 전 1K 프리뷰 URL 저장 (히스토리 썸네일 + 프로그레시브 로딩)
ALTER TABLE generation_history ADD COLUMN preview_urls TEXT[] NOT NULL DEFAULT '{}';
