const express = require('express');
const { defineRoute } = require('../lib/routeRegistry');
const { withTransaction, query } = require('../db');
const { writeAuditRow } = require('../lib/audit');
const { pickFields } = require('../lib/serialize');
const { issueSetPasswordToken } = require('./auth.routes');

const router = express.Router();

defineRoute(router, { method: 'get', path: '/panelists', permission: 'cca' }, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.account_id, p.name, p.email
       FROM cca_members cm
       JOIN panelists p ON p.account_id = cm.panelist_id
       WHERE cm.cca_id = $1
       ORDER BY p.name`,
      [req.account.id],
    );
    res.json(pickFields(result.rows, ['account_id', 'name', 'email']));
  } catch (err) {
    next(err);
  }
});

// D3: the CCA account adds its own panelists. A senior already panelling for
// another CCA is matched by login ID and simply linked via cca_members,
// rather than erroring or creating a second account for the same person.
defineRoute(router, { method: 'post', path: '/panelists', permission: 'cca', dataChanging: true, auditEvent: 'panelist.added' }, async (req, res, next) => {
  try {
    const { loginId, name, email } = req.body || {};
    if (!loginId) {
      return res.status(400).json({ error: 'Login ID is required' });
    }

    const result = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id, role FROM accounts WHERE login_id = $1', [loginId]);
      let panelistAccountId;
      let linkedExisting = false;

      if (existing.rows.length > 0) {
        const account = existing.rows[0];
        if (account.role !== 'panelist') {
          return { status: 409, body: { error: 'That login ID belongs to a different role' } };
        }
        panelistAccountId = account.id;
        linkedExisting = true;
      } else {
        if (!name || !email) {
          return { status: 400, body: { error: 'Name and email are required for a new panelist' } };
        }
        const accountResult = await client.query(
          "INSERT INTO accounts (login_id, role) VALUES ($1, 'panelist') RETURNING id",
          [loginId],
        );
        panelistAccountId = accountResult.rows[0].id;
        await client.query('INSERT INTO panelists (account_id, name, email) VALUES ($1, $2, $3)', [panelistAccountId, name, email]);
        await issueSetPasswordToken(client, panelistAccountId, { isReset: false });
      }

      const alreadyMember = await client.query(
        'SELECT id FROM cca_members WHERE panelist_id = $1 AND cca_id = $2',
        [panelistAccountId, req.account.id],
      );
      if (alreadyMember.rows.length > 0) {
        return { status: 409, body: { error: 'That panelist is already a member of this CCA' } };
      }

      await client.query('INSERT INTO cca_members (panelist_id, cca_id) VALUES ($1, $2)', [panelistAccountId, req.account.id]);
      await writeAuditRow(client, {
        eventType: 'panelist.added',
        actorAccountId: req.account.id,
        entityType: 'panelist',
        entityId: panelistAccountId,
        details: { ccaId: req.account.id, linkedExisting },
      });

      return { status: 201, body: { accountId: panelistAccountId, linkedExisting } };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
