-- Random, unguessable per-member token used in ID-card QR URLs (/members/<token>), so the
-- public form routes cannot be enumerated from the predictable six-digit id.
-- A volatile default makes Postgres assign a distinct token to every existing row on rewrite,
-- and to every new row on insert.
ALTER TABLE businessmen
  ADD COLUMN public_token VARCHAR(24) NOT NULL
  DEFAULT substr(md5(random()::text || clock_timestamp()::text || random()::text), 1, 22);

CREATE UNIQUE INDEX ux_businessmen_public_token ON businessmen (public_token);
