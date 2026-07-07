-- Approved members. Every row here is a vetted businessman shown on the public site.
CREATE TABLE businessmen (
  id               BIGSERIAL PRIMARY KEY,

  -- Personal
  full_name        TEXT        NOT NULL,
  mobile_number    VARCHAR(20) NOT NULL,
  father_name      TEXT,
  mother_name      TEXT,
  blood_group      VARCHAR(3)  CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-') OR blood_group IS NULL),

  -- Permanent address (structured)
  village                 TEXT,
  post_office             TEXT,
  municipality_or_union   TEXT,
  upazila                 TEXT,
  district                TEXT,

  -- Business
  current_business_name_address TEXT,
  business_type    TEXT,
  trade_license_no VARCHAR(60),
  tin_no           VARCHAR(60),
  market_name      TEXT,
  owner_name       TEXT,
  ward_no          VARCHAR(20),
  holding_no       VARCHAR(40),
  voter_type       TEXT        NOT NULL DEFAULT 'ব্যবসায়ী',

  -- National ID (stored normalized to ASCII digits by the app layer)
  nid_no           VARCHAR(30) NOT NULL,

  -- Nominee
  nominee_name     TEXT,
  nominee_relation TEXT,
  nominee_mobile   VARCHAR(20),

  -- System
  profile_photo_url TEXT,
  status           VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Derived identity: guarantees /profiles/{6} determinism and collision safety.
  six_digit_id     VARCHAR(6)  GENERATED ALWAYS AS (RIGHT(nid_no, 6)) STORED,
  unique_id        VARCHAR(16) GENERATED ALWAYS AS ('NBA-' || RIGHT(nid_no, 6)) STORED,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast, collision-safe lookup for /profiles/{sixDigits} and the NBA-xxxxxx id.
CREATE UNIQUE INDEX ux_businessmen_six_digit ON businessmen (six_digit_id);
CREATE UNIQUE INDEX ux_businessmen_unique_id ON businessmen (unique_id);

CREATE TRIGGER trg_businessmen_updated
  BEFORE UPDATE ON businessmen
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
