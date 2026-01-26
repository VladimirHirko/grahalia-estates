-- 0008_add_public_id.sql
-- Adds public_id to properties and backfills existing rows.
-- public_id format: GE-000123

ALTER TABLE properties
  ADD COLUMN public_id varchar(16);

-- Backfill for existing rows
UPDATE properties
SET public_id = 'GE-' || lpad(id::text, 6, '0')
WHERE public_id IS NULL;

ALTER TABLE properties
  ALTER COLUMN public_id TYPE varchar(32);

CREATE UNIQUE INDEX properties_public_id_unique
  ON properties(public_id);
