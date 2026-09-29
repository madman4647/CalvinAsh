-- INV-02: every state change has an audit row with a database timestamp,
-- and the hash chain verifies.
--
-- Recomputes each row's expected hash using the exact same audit_row_hash()
-- function the audit_log_before_insert trigger uses (migrations/*_audit_log.sql),
-- chaining off the actual previous row (LAG by id order) rather than trusting
-- the stored prev_hash. Any row returned is a violation: either its prev_hash
-- doesn't match the row that actually precedes it, or its hash doesn't match
-- what audit_row_hash() computes from its own columns.
WITH chained AS (
  SELECT
    id,
    prev_hash,
    hash,
    LAG(hash) OVER (ORDER BY id) AS expected_prev_hash,
    audit_row_hash(
      LAG(hash) OVER (ORDER BY id),
      event_type,
      actor_account_id,
      entity_type,
      entity_id,
      details,
      occurred_at
    ) AS expected_hash
  FROM audit_log
)
SELECT id
FROM chained
WHERE prev_hash IS DISTINCT FROM expected_prev_hash
   OR hash IS DISTINCT FROM expected_hash;
