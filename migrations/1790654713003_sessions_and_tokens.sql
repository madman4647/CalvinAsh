-- Up Migration

-- N11: cookies backed by a server-side sessions table, not tokens in
-- localStorage. Only the hash of the cookie's raw token is ever stored, so a
-- database leak alone can't be used to forge a session.
CREATE TABLE sessions (
  id bigserial PRIMARY KEY,
  session_hash text NOT NULL UNIQUE,
  account_id uuid NOT NULL REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX sessions_account_id_idx ON sessions(account_id);

-- N9: one-time, expiring set-password links back both new-account
-- activation and forgot-password resets. Only the token's hash is stored.
CREATE TABLE password_set_tokens (
  id bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX password_set_tokens_account_id_idx ON password_set_tokens(account_id);

-- Down Migration

DROP TABLE password_set_tokens;
DROP TABLE sessions;
