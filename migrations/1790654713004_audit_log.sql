-- Up Migration

-- INV-02: every state change has an audit row with a database timestamp,
-- and the hash chain verifies. audit_row_hash is the one place the hash
-- formula is defined - both the trigger below and invariants/inv-02.sql
-- call it, so they can never drift apart.
CREATE FUNCTION audit_row_hash(
  prev_hash text,
  event_type text,
  actor_account_id uuid,
  entity_type text,
  entity_id text,
  details jsonb,
  occurred_at timestamptz
) RETURNS text AS $$
  SELECT encode(
    digest(
      coalesce(prev_hash, '') || '|' ||
      coalesce(event_type, '') || '|' ||
      coalesce(actor_account_id::text, '') || '|' ||
      coalesce(entity_type, '') || '|' ||
      coalesce(entity_id, '') || '|' ||
      coalesce(details::text, '') || '|' ||
      occurred_at::text,
      'sha256'
    ),
    'hex'
  );
$$ LANGUAGE sql IMMUTABLE;

-- id is NOT a serial/identity column on purpose: nextval() for a serial
-- default is handed out before this table's BEFORE INSERT trigger even
-- starts, uncoordinated with the advisory lock below - two concurrent
-- inserts can be assigned ids 3 and 4 in that order, yet the transaction
-- that got id 4 can reach (and release) the lock first, chaining id 3 off
-- id 4's hash. id must be assigned *inside* the locked section instead, so
-- id order and chain order can never diverge.
CREATE TABLE audit_log (
  id bigint PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_account_id uuid REFERENCES accounts(id),
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}',
  prev_hash text,
  hash text NOT NULL
);

-- The app supplies event_type/actor/entity/details only - id, prev_hash and
-- hash are always computed here, so the app (even with a bug) cannot forge
-- them. The advisory lock serializes concurrent writers so id assignment and
-- hash chaining happen as one atomic step - two transactions can never both
-- chain off the same "previous" row, or race each other for the next id.
CREATE FUNCTION audit_log_chain_trigger() RETURNS trigger AS $$
DECLARE
  last_id bigint;
  last_hash text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit_log_chain'));
  SELECT id, hash INTO last_id, last_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.id := COALESCE(last_id, 0) + 1;
  NEW.prev_hash := last_hash;
  NEW.hash := audit_row_hash(last_hash, NEW.event_type, NEW.actor_account_id, NEW.entity_type, NEW.entity_id, NEW.details, NEW.occurred_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_before_insert
  BEFORE INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_chain_trigger();

CREATE INDEX audit_log_event_type_idx ON audit_log(event_type);

-- Down Migration

DROP TABLE audit_log;
DROP FUNCTION audit_log_chain_trigger();
DROP FUNCTION audit_row_hash(text, text, uuid, text, text, jsonb, timestamptz);
