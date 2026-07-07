-- Bilingual CMS content for the static/informational pages.
CREATE TABLE page_content (
  id          BIGSERIAL PRIMARY KEY,
  page_key    VARCHAR(40) NOT NULL UNIQUE CHECK (page_key IN ('home', 'about', 'contact', 'rules')),
  title_bn    TEXT,
  title_en    TEXT,
  subtitle_bn TEXT,
  subtitle_en TEXT,
  body_bn     TEXT,
  body_en     TEXT,
  extra       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- page-specific structured bits (contact info, home CTA, ...)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_page_updated
  BEFORE UPDATE ON page_content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
