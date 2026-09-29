-- Up Migration

-- D3: one accounts table gives every login exactly one role. Login ID
-- uniqueness is what makes "an ID is either an applicant or a panelist,
-- never both" a database fact, not just a convention.
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id text NOT NULL UNIQUE,
  password_hash text,
  -- Nullable fallback contact address - students/CCAs/panelists have their
  -- own required email in their profile table; Senate has no profile table
  -- in Loop 1, so this is the only place its set-password/reset link can go.
  email text,
  role text NOT NULL CHECK (role IN ('student', 'cca', 'panelist', 'senate')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Down Migration

DROP TABLE accounts;
