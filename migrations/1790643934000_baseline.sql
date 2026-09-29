-- Up Migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Proves the migration -> database -> server -> test chain end to end.
-- Loop 1 owns the first real business table (accounts); this is intentionally
-- the only table Loop 0 creates.
CREATE TABLE _health_check (
  id serial PRIMARY KEY,
  label text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO _health_check (label) VALUES
  ('migration-tool'),
  ('database-connection');

-- Down Migration

DROP TABLE _health_check;
DROP EXTENSION IF EXISTS pgcrypto;
