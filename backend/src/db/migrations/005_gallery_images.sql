CREATE TABLE gallery_images (
  id                   BIGSERIAL PRIMARY KEY,
  image_url            TEXT    NOT NULL,       -- Cloudinary URL or local/placeholder URL
  cloudinary_public_id TEXT,                   -- enables remote delete via the SDK
  caption_bn           TEXT,
  caption_en           TEXT,
  sort_order           INT     NOT NULL DEFAULT 0,
  is_published         BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_gallery_order ON gallery_images (sort_order, id);

CREATE TRIGGER trg_gallery_updated
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
