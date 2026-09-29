/**
 * Writes one audit_log row. Must be called with the same client/transaction
 * as the state change it's recording (CLAUDE.md: "Every state change writes
 * an audit row in the same transaction"). prev_hash/hash are computed by the
 * audit_log_before_insert trigger, not here - the caller only ever supplies
 * what actually happened.
 */
async function writeAuditRow(client, { eventType, actorAccountId = null, entityType = null, entityId = null, details = {} }) {
  await client.query(
    `INSERT INTO audit_log (event_type, actor_account_id, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [eventType, actorAccountId, entityType, entityId, JSON.stringify(details)],
  );
}

module.exports = { writeAuditRow };
