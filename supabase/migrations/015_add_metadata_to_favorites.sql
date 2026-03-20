ALTER TABLE favorites ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
