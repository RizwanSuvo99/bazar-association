-- Hero carousel images for the home page, managed from the admin panel.
-- Stored as a JSONB array of objects: [{ "url": "...", "public_id": "..." }]
ALTER TABLE site_settings
  ADD COLUMN hero_images JSONB NOT NULL DEFAULT '[]'::jsonb;
