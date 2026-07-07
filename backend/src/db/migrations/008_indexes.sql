-- Fuzzy / substring search (name, market, business type, owner) via pg_trgm GIN indexes.
CREATE INDEX gin_bm_fullname_trgm ON businessmen USING gin (full_name gin_trgm_ops);
CREATE INDEX gin_bm_market_trgm   ON businessmen USING gin (market_name gin_trgm_ops);
CREATE INDEX gin_bm_business_trgm ON businessmen USING gin (business_type gin_trgm_ops);
CREATE INDEX gin_bm_owner_trgm    ON businessmen USING gin (owner_name gin_trgm_ops);

-- Equality / prefix filters.
CREATE INDEX ix_bm_mobile   ON businessmen (mobile_number);
CREATE INDEX ix_bm_ward     ON businessmen (ward_no);
CREATE INDEX ix_bm_union    ON businessmen (municipality_or_union);
CREATE INDEX ix_bm_district ON businessmen (district);
CREATE INDEX ix_bm_blood    ON businessmen (blood_group);

-- Public listing: active members, newest first.
CREATE INDEX ix_bm_active_created ON businessmen (created_at DESC) WHERE status = 'active';
