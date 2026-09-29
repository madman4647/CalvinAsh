const { pool } = require('../../src/db');

async function auditCount(auditEvent) {
  const result = await pool.query('SELECT count(*)::int AS count FROM audit_log WHERE event_type = $1', [auditEvent]);
  return result.rows[0].count;
}

/**
 * Full contract for a route with a role restriction: a request from a role
 * outside the allowed set (or with no session, if wrongRoleAgent is an
 * unauthenticated agent) must be refused, and a request from an allowed role
 * must succeed and leave a new audit_log row for auditEvent. This is what
 * gate check 4 (scripts/gate/04-route-contract.js) requires every
 * data-changing, role-restricted route's contract test to call.
 */
async function expectRouteContract({
  method, path, wrongRoleAgent, correctRoleAgent, auditEvent, wrongBody, correctBody, expectStatus = 200,
  buildWrongRequest = (req) => req.send(wrongBody),
  buildCorrectRequest = (req) => req.send(correctBody),
}) {
  const wrongRes = await buildWrongRequest(wrongRoleAgent[method](path));
  if (![401, 403].includes(wrongRes.status)) {
    throw new Error(
      `expected the wrong-role request to ${method.toUpperCase()} ${path} to be refused (401/403), got ${wrongRes.status}: ${JSON.stringify(wrongRes.body)}`,
    );
  }

  const before = await auditCount(auditEvent);
  const res = await buildCorrectRequest(correctRoleAgent[method](path));
  if (res.status !== expectStatus) {
    throw new Error(
      `expected the correct-role request to ${method.toUpperCase()} ${path} to return ${expectStatus}, got ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }
  const after = await auditCount(auditEvent);
  if (after <= before) {
    throw new Error(`expected a new audit_log row with event_type=${auditEvent} after ${method.toUpperCase()} ${path}`);
  }

  return res;
}

/**
 * For 'public' data-changing routes (no role restriction to test) - just the
 * audit-row assertion. What gate check 4 requires every data-changing,
 * public route's contract test to call.
 */
async function expectPublicRouteAudit({ agent, method, path, auditEvent, body, expectStatus = 200 }) {
  const before = await auditCount(auditEvent);
  const res = await agent[method](path).send(body);
  if (res.status !== expectStatus) {
    throw new Error(`expected ${method.toUpperCase()} ${path} to return ${expectStatus}, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  const after = await auditCount(auditEvent);
  if (after <= before) {
    throw new Error(`expected a new audit_log row with event_type=${auditEvent} after ${method.toUpperCase()} ${path}`);
  }
  return res;
}

module.exports = { expectRouteContract, expectPublicRouteAudit };
