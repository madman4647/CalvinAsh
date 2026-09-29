-- Up Migration

-- Minimal per-role profile tables. accounts holds auth identity only; these
-- hold the display/contact data each role needs. ccas is deliberately
-- minimal (name, type, its account) - the full CCA profile, verticals and
-- structure are Loop 2.
CREATE TABLE students (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  name text NOT NULL,
  email text NOT NULL,
  batch text NOT NULL
);

CREATE TABLE ccas (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('committee', 'club', 'aig'))
);

-- "A panelist is a person" - one profile row per panelist account, even
-- though the same person can belong to several CCAs (via cca_members below).
CREATE TABLE panelists (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  name text NOT NULL,
  email text NOT NULL
);

CREATE TABLE cca_members (
  id bigserial PRIMARY KEY,
  panelist_id uuid NOT NULL REFERENCES panelists(account_id),
  cca_id uuid NOT NULL REFERENCES ccas(account_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (panelist_id, cca_id)
);

-- Down Migration

DROP TABLE cca_members;
DROP TABLE panelists;
DROP TABLE ccas;
DROP TABLE students;
