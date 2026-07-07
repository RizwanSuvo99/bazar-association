-- Notices with a downloadable/viewable PDF file, managed from the admin panel.
CREATE TABLE notices (
  id                 BIGSERIAL PRIMARY KEY,
  title_bn           TEXT        NOT NULL,
  title_en           TEXT,
  file_url           TEXT        NOT NULL,
  file_public_id     TEXT,                          -- Cloudinary public id (for delete), null for local files
  file_resource_type VARCHAR(10) NOT NULL DEFAULT 'auto',
  file_name          TEXT,                          -- original filename (for the download link)
  is_published       BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_notices_created ON notices (created_at DESC);

CREATE TRIGGER trg_notices_updated
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
