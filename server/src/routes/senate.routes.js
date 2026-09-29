const express = require('express');
const multer = require('multer');
const { defineRoute } = require('../lib/routeRegistry');
const { withTransaction, query } = require('../db');
const { writeAuditRow } = require('../lib/audit');
const { pickFields } = require('../lib/serialize');
const { parseStudentCsv } = require('../services/csv.service');
const { issueSetPasswordToken } = require('./auth.routes');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// N10: Senate imports students by CSV (login ID, name, email, batch). A row
// whose login ID already exists is skipped, not a hard failure for the whole
// batch - re-running an import to add more students is a normal workflow.
defineRoute(
  router,
  { method: 'post', path: '/api/senate/students/import', permission: 'senate', dataChanging: true, auditEvent: 'students.imported' },
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Attach a CSV file' });
      }
      let rows;
      try {
        rows = parseStudentCsv(req.file.buffer);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }

      const result = await withTransaction(async (client) => {
        let created = 0;
        const skipped = [];

        for (const row of rows) {
          if (!row.loginId || !row.name || !row.email || !row.batch) {
            skipped.push({ loginId: row.loginId || '(blank)', reason: 'missing field(s)' });
            continue;
          }
          const existing = await client.query('SELECT id FROM accounts WHERE login_id = $1', [row.loginId]);
          if (existing.rows.length > 0) {
            skipped.push({ loginId: row.loginId, reason: 'already exists' });
            continue;
          }

          const accountResult = await client.query(
            "INSERT INTO accounts (login_id, role) VALUES ($1, 'student') RETURNING id",
            [row.loginId],
          );
          const accountId = accountResult.rows[0].id;
          await client.query(
            'INSERT INTO students (account_id, name, email, batch) VALUES ($1, $2, $3, $4)',
            [accountId, row.name, row.email, row.batch],
          );
          await issueSetPasswordToken(client, accountId, { isReset: false });
          created += 1;
        }

        // One audit row for the whole batch (with a count), not one per
        // student - a bulk import is one logical action, not N of them.
        await writeAuditRow(client, {
          eventType: 'students.imported',
          actorAccountId: req.account.id,
          entityType: 'import',
          details: { created, skipped: skipped.length, filename: req.file.originalname },
        });

        return { created, skipped };
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

defineRoute(router, { method: 'get', path: '/api/senate/ccas', permission: 'senate' }, async (req, res, next) => {
  try {
    const result = await query('SELECT account_id, name, type, email FROM ccas ORDER BY name');
    res.json(pickFields(result.rows, ['account_id', 'name', 'type', 'email']));
  } catch (err) {
    next(err);
  }
});

defineRoute(router, { method: 'post', path: '/api/senate/ccas', permission: 'senate', dataChanging: true, auditEvent: 'cca.created' }, async (req, res, next) => {
  try {
    const { loginId, name, type, email } = req.body || {};
    if (!loginId || !name || !type || !email) {
      return res.status(400).json({ error: 'Login ID, name, type and email are all required' });
    }
    if (!['committee', 'club', 'aig'].includes(type)) {
      return res.status(400).json({ error: 'Type must be committee, club or aig' });
    }

    const result = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM accounts WHERE login_id = $1', [loginId]);
      if (existing.rows.length > 0) {
        return { status: 409, body: { error: 'That login ID is already in use' } };
      }

      const accountResult = await client.query(
        "INSERT INTO accounts (login_id, role) VALUES ($1, 'cca') RETURNING id",
        [loginId],
      );
      const accountId = accountResult.rows[0].id;
      await client.query('INSERT INTO ccas (account_id, name, type, email) VALUES ($1, $2, $3, $4)', [accountId, name, type, email]);
      await issueSetPasswordToken(client, accountId, { isReset: false });
      await writeAuditRow(client, {
        eventType: 'cca.created',
        actorAccountId: req.account.id,
        entityType: 'cca',
        entityId: accountId,
        details: { name, type },
      });
      return { status: 201, body: { accountId, name, type } };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
