-- Tracks when an admin's password last changed so that JWTs issued before that moment
-- can be rejected — i.e. changing your password signs out every other device.
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now();
