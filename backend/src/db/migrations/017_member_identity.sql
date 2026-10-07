-- Member identity: the full NID becomes the unique key, and the public profile route moves
-- off the six-digit tail.
--
-- Why: the last 6 digits of an NID are NOT unique. Two members can legitimately share a tail
-- (production already has such a pair), but ux_businessmen_six_digit made the second one
-- impossible to insert, so their registration could never be approved. The full NID is the
-- only value here that genuinely identifies a person, so it becomes the uniqueness key.
--
-- six_digit_id and unique_id are kept exactly as they are: the printed ID card still shows
-- NBA-<last6>. They simply stop being unique, which is an accepted consequence -- two members
-- may carry the same card number, and a lookup by card number can return both.

-- 1. The real identity key.
CREATE UNIQUE INDEX ux_businessmen_nid_no ON businessmen (nid_no);

-- 2. Drop uniqueness from the derived tail, keeping plain indexes so the admin/public
--    "search by ID number" (six_digit_id / unique_id ILIKE) stays indexed.
DROP INDEX ux_businessmen_six_digit;
DROP INDEX ux_businessmen_unique_id;
CREATE INDEX ix_businessmen_six_digit ON businessmen (six_digit_id);
CREATE INDEX ix_businessmen_unique_id ON businessmen (unique_id);

-- 3. Route identifier for /profiles/<slug>.
--
--    Deliberately NOT public_token: that token is a capability secret -- whoever holds it can
--    fetch /members/<token>/form.pdf, the member's full registration form (unmasked NID,
--    parents' names, nominee, address, and the signed copy when the office enables it). It is
--    random precisely so those routes cannot be enumerated (see 011_public_token.sql). Putting
--    it in a profile URL would publish it on the public directory and in search engines.
--
--    This slug carries no such capability: it only addresses the already-public, NID-masked
--    profile page. A volatile default assigns a distinct value to every existing row during the
--    rewrite, and to every new row on insert.
ALTER TABLE businessmen
  ADD COLUMN profile_slug VARCHAR(24) NOT NULL
  DEFAULT substr(md5(random()::text || clock_timestamp()::text || random()::text), 1, 22);

CREATE UNIQUE INDEX ux_businessmen_profile_slug ON businessmen (profile_slug);
