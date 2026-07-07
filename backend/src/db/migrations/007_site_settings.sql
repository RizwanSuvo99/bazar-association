-- Single-row settings table (id is pinned to 1).
CREATE TABLE site_settings (
  id                 INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  org_name_bn        TEXT NOT NULL DEFAULT 'নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা',
  org_name_en        TEXT NOT NULL DEFAULT 'Nangalkot Bazar Business Association',
  bkash_number       VARCHAR(20) NOT NULL DEFAULT '01700000000',
  registration_fee   INT NOT NULL DEFAULT 500,
  active_theme       VARCHAR(30) NOT NULL DEFAULT 'emerald'
                     CHECK (active_theme IN ('emerald', 'royal-blue', 'warm-amber', 'crimson')),
  logo_url           TEXT,
  contact_email      TEXT,
  contact_phone      TEXT,
  contact_address_bn TEXT,
  contact_address_en TEXT,
  facebook_url       TEXT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_settings_updated
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Contact form submissions -> simple admin inbox.
CREATE TABLE contact_messages (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT,
  phone      VARCHAR(20),
  subject    TEXT,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_contact_created ON contact_messages (created_at DESC);
