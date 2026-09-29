const { pool } = require('../../db');
const { generateToken, hashToken } = require('./tokens');

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'calvin_session';
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days - no idle timeout yet, that's Loop 11 (N11)

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  };
}

async function createSession(client, accountId) {
  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await client.query(
    'INSERT INTO sessions (session_hash, account_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(rawToken), accountId, expiresAt],
  );
  return rawToken;
}

function setSessionCookie(res, rawToken) {
  res.cookie(SESSION_COOKIE_NAME, rawToken, cookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: true, sameSite: 'lax', path: '/' });
}

async function revokeSession(client, rawToken) {
  await client.query(
    'UPDATE sessions SET revoked_at = now() WHERE session_hash = $1 AND revoked_at IS NULL',
    [hashToken(rawToken)],
  );
}

async function loadAccountForToken(rawToken) {
  const result = await pool.query(
    `SELECT a.id, a.login_id, a.role, a.status
     FROM sessions s
     JOIN accounts a ON a.id = s.account_id
     WHERE s.session_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
    [hashToken(rawToken)],
  );
  return result.rows[0] || null;
}

/** Mounted automatically by defineRoute for any route with a non-public permission. */
async function requireSession(req, res, next) {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!rawToken) {
      return res.status(401).json({ error: 'Not signed in' });
    }
    const account = await loadAccountForToken(rawToken);
    if (!account) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    req.account = { id: account.id, loginId: account.login_id, role: account.role, status: account.status };
    req.sessionToken = rawToken;
    next();
  } catch (err) {
    next(err);
  }
}

/** Mounted automatically by defineRoute after requireSession, when permission isn't 'public'. */
function requireRole(permission) {
  const allowed = Array.isArray(permission) ? permission : [permission];
  return (req, res, next) => {
    if (!req.account || !allowed.includes(req.account.role)) {
      return res.status(403).json({ error: 'Not allowed for this role' });
    }
    next();
  };
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  revokeSession,
  requireSession,
  requireRole,
};
