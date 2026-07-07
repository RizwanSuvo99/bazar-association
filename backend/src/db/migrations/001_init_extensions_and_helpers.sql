-- Extensions used across the schema.
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy / substring search indexes
CREATE EXTENSION IF NOT EXISTS citext;    -- case-insensitive admin email

-- Shared trigger function: keep updated_at fresh on UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
