const express = require('express');
const { defineRoute } = require('../lib/routeRegistry');
const { withTransaction, pool } = require('../db');
const { hashPassword, verifyPassword } = require('../lib/auth/password');
const { generateToken, hashToken } = require('../lib/auth/tokens');
const { createSession, setSessionCookie, clearSessionCookie, revokeSession } = require('../lib/auth/session');
const { writeAuditRow } = require('../lib/audit');
const { sendSetPasswordEmail } = require('../services/email.service');

const router = express.Router();
const ALL_ROLES = ['student', 'cca', 'panelist', 'senate'];
const SET_PASSWORD_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RESET_RATE_LIMIT_MAX = 3;

function setPasswordUrl(rawToken) {
  const base = process.env.SET_PASSWORD_URL_BASE || 'http://localhost:3000/set-password';
  return `${base}?token=${rawToken}`;
}

async function findEmailForAccount(client, accountId) {
  const result = await client.query(
    `SELECT COALESCE(s.email, c.email, p.email, a.email) AS email
     FROM accounts a
     LEFT JOIN students s ON s.account_id = a.id
     LEFT JOIN ccas c ON c.account_id = a.id
     LEFT JOIN panelists p ON p.account_id = a.id
     WHERE a.id = $1`,
    [accountId],
  );
  return result.rows[0]?.email || null;
}

/** Shared by account creation and forgot-password - N9 says the same mechanism backs both. */
async function issueSetPasswordToken(client, accountId, { isReset }) {
  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + SET_PASSWORD_TOKEN_TTL_MS);
  await client.query(
    'INSERT INTO password_set_tokens (account_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [accountId, hashToken(rawToken), expiresAt],
  );
  const email = await findEmailForAccount(client, accountId);
  const loginIdResult = await client.query('SELECT login_id FROM accounts WHERE id = $1', [accountId]);
  const url = setPasswordUrl(rawToken);
  if (email && process.env.SMTP_USER) {
    await sendSetPasswordEmail(email, { loginId: loginIdResult.rows[0].login_id, url, isReset });
  } else {
    // No SMTP configured (local dev, tests, CI) - print the link instead of
    // silently failing or hanging trying to reach a real mail server.
    console.log(`[set-password link] ${loginIdResult.rows[0].login_id}: ${url}`);
  }
  return rawToken;
}

defineRoute(router, { method: 'post', path: '/login', permission: 'public', dataChanging: true, auditEvent: 'login.succeeded' }, async (req, res, next) => {
  try {
    const { loginId, password } = req.body || {};
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Enter your login ID and password' });
    }

    const result = await withTransaction(async (client) => {
      const accountResult = await client.query(
        'SELECT id, password_hash, role, status FROM accounts WHERE login_id = $1 FOR UPDATE',
        [loginId],
      );
      const account = accountResult.rows[0];
      const passwordOk = account && account.status === 'active' && (await verifyPassword(password, account.password_hash));
      if (!passwordOk) {
        return { status: 401, body: { error: 'Incorrect login ID or password' } };
      }

      const rawToken = await createSession(client, account.id);
      await writeAuditRow(client, {
        eventType: 'login.succeeded',
        actorAccountId: account.id,
        entityType: 'account',
        entityId: account.id,
      });
      return { status: 200, body: { role: account.role }, sessionToken: rawToken };
    });

    if (result.sessionToken) {
      setSessionCookie(res, result.sessionToken);
    }
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

defineRoute(router, { method: 'post', path: '/logout', permission: ALL_ROLES, dataChanging: true, auditEvent: 'logout' }, async (req, res, next) => {
  try {
    await withTransaction(async (client) => {
      await revokeSession(client, req.sessionToken);
      await writeAuditRow(client, {
        eventType: 'logout',
        actorAccountId: req.account.id,
        entityType: 'account',
        entityId: req.account.id,
      });
    });
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// N9: the response is identical whether or not the login ID exists, and
// requests are rate-limited without revealing that they were.
defineRoute(router, { method: 'post', path: '/forgot-password', permission: 'public', dataChanging: true, auditEvent: 'password_reset.requested' }, async (req, res, next) => {
  try {
    const { loginId } = req.body || {};
    const genericBody = { message: 'If that login ID exists, we have sent a link to set a new password.' };
    if (!loginId) {
      return res.status(200).json(genericBody);
    }

    await withTransaction(async (client) => {
      const accountResult = await client.query('SELECT id FROM accounts WHERE login_id = $1', [loginId]);
      const account = accountResult.rows[0];
      if (!account) return;

      const recentResult = await client.query(
        `SELECT count(*)::int AS count FROM password_set_tokens
         WHERE account_id = $1 AND created_at > now() - $2::interval`,
        [account.id, `${RESET_RATE_LIMIT_WINDOW_MS} milliseconds`],
      );
      if (recentResult.rows[0].count >= RESET_RATE_LIMIT_MAX) return;

      await issueSetPasswordToken(client, account.id, { isReset: true });
      await writeAuditRow(client, {
        eventType: 'password_reset.requested',
        actorAccountId: account.id,
        entityType: 'account',
        entityId: account.id,
      });
    });

    res.status(200).json(genericBody);
  } catch (err) {
    next(err);
  }
});

defineRoute(router, { method: 'post', path: '/set-password', permission: 'public', dataChanging: true, auditEvent: 'password.set' }, async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: 'A token and a password of at least 8 characters are required' });
    }

    const result = await withTransaction(async (client) => {
      const tokenResult = await client.query(
        `SELECT id, account_id FROM password_set_tokens
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
         FOR UPDATE`,
        [hashToken(token)],
      );
      const tokenRow = tokenResult.rows[0];
      if (!tokenRow) {
        return { status: 400, body: { error: 'This link is invalid or has expired. Request a new one.' } };
      }

      const passwordHash = await hashPassword(password);
      await client.query('UPDATE accounts SET password_hash = $1, status = $2 WHERE id = $3', [passwordHash, 'active', tokenRow.account_id]);
      await client.query('UPDATE password_set_tokens SET used_at = now() WHERE id = $1', [tokenRow.id]);
      // A new password invalidates any session issued before it.
      await client.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [tokenRow.account_id]);
      await writeAuditRow(client, {
        eventType: 'password.set',
        actorAccountId: tokenRow.account_id,
        entityType: 'account',
        entityId: tokenRow.account_id,
      });
      return { status: 200, body: { ok: true } };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

defineRoute(router, { method: 'get', path: '/me', permission: ALL_ROLES }, (req, res) => {
  res.json({ loginId: req.account.loginId, role: req.account.role });
});

module.exports = { router, issueSetPasswordToken, findEmailForAccount, setPasswordUrl };
