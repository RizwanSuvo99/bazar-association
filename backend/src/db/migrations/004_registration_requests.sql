-- Public self-registration submissions (intake + audit trail).
-- Same applicant columns as `businessmen`, plus request-specific fields.
CREATE TABLE registration_requests (
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

  nid_no           VARCHAR(30) NOT NULL,

  -- Nominee
  nominee_name     TEXT,
  nominee_relation TEXT,
  nominee_mobile   VARCHAR(20),

  -- Photo is required on the public registration form.
  profile_photo_url TEXT        NOT NULL,

  -- Request-specific
  transaction_id   VARCHAR(60) NOT NULL,      -- bKash payment proof (registration fee)
  status           VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason    TEXT,
  businessman_id   BIGINT      REFERENCES businessmen(id) ON DELETE SET NULL,  -- set on approval
  reviewed_by      BIGINT      REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_reqs_status_created ON registration_requests (status, created_at DESC);
CREATE INDEX ix_reqs_nid            ON registration_requests (nid_no);

CREATE TRIGGER trg_reqs_updated
  BEFORE UPDATE ON registration_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
