-- 기존 데이터 전체 삭제 (기존 이미지 불필요)
TRUNCATE generation_history;

-- 기존 컬럼 삭제
ALTER TABLE generation_history DROP COLUMN output_urls;
ALTER TABLE generation_history DROP COLUMN preview_urls;

-- 새 컬럼 추가: WebP 3벌 (Lambda가 처리 후 업데이트)
ALTER TABLE generation_history ADD COLUMN thumb_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE generation_history ADD COLUMN display_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE generation_history ADD COLUMN original_urls TEXT[] NOT NULL DEFAULT '{}';

-- Service role이 Lambda에서 UPDATE 가능하도록 정책 추가
CREATE POLICY "Service role can update history"
  ON generation_history FOR UPDATE
  WITH CHECK (true);
