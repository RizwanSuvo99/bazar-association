-- The admin list filters and sorts by registration date across BOTH statuses, but the only
-- existing created_at index (ix_bm_active_created, migration 008) is partial on
-- status = 'active', so it cannot serve those queries.
--
-- The column list matches the new ORDER BY exactly (created_at DESC, id DESC). The id
-- tiebreaker is what keeps a member's position stable when it is edited: without it, rows
-- sharing a created_at have an undefined order that can shift after an UPDATE.
CREATE INDEX IF NOT EXISTS ix_bm_created_id
  ON businessmen (created_at DESC, id DESC);
