-- Members print their registration form, sign it by hand and return it to the office.
-- The admin scans or photographs that signed copy and attaches it here, and decides per
-- member whether the public token page shows the signed copy or the generated (unsigned) one.
--
-- signed_form_mime distinguishes an image (shown inline) from a PDF (embedded with a
-- download fallback). signed_form_public_id is only set for Cloudinary-stored images —
-- PDFs live on local disk under uploads/signed-forms, because Cloudinary blocks PDF
-- delivery by default (same reason notices are stored locally).
ALTER TABLE businessmen
  ADD COLUMN IF NOT EXISTS signed_form_url         TEXT,
  ADD COLUMN IF NOT EXISTS signed_form_public_id   TEXT,
  ADD COLUMN IF NOT EXISTS signed_form_mime        TEXT,
  ADD COLUMN IF NOT EXISTS signed_form_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_form_visible     BOOLEAN NOT NULL DEFAULT true;

-- Lets the admin list find members still missing a signed copy.
CREATE INDEX IF NOT EXISTS ix_businessmen_signed_form
  ON businessmen ((signed_form_url IS NOT NULL));
