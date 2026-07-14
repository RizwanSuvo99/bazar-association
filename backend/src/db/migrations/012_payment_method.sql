-- Registration fee can be paid via bKash (with a transaction id as proof) or in
-- cash/hand-to-hand (no proof; an admin confirms it manually). Default stays bKash.
ALTER TABLE registration_requests
  ADD COLUMN payment_method VARCHAR(10) NOT NULL DEFAULT 'bkash'
    CHECK (payment_method IN ('bkash', 'cash'));

-- Cash submissions have no transaction id, so it can no longer be NOT NULL.
ALTER TABLE registration_requests
  ALTER COLUMN transaction_id DROP NOT NULL;
