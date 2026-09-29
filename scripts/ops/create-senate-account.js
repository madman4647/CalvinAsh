const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client } = require('pg');
const crypto = require('crypto');

/**
 * N10: the first Senate account comes from a CLI/seed command, never the
 * web. Usage:
 *   node scripts/ops/create-senate-account.js --loginId=senate --name="Senate" --email=senate@iiml.ac.in
 */
function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function main() {
  const { loginId, name, email } = parseArgs(process.argv.slice(2));
  if (!loginId || !email) {
    console.error('Usage: node scripts/ops/create-senate-account.js --loginId=senate --email=senate@iiml.ac.in [--name="Senate"]');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM accounts WHERE login_id = $1', [loginId]);
    if (existing.rows.length > 0) {
      throw new Error(`An account with login ID "${loginId}" already exists`);
    }

    const accountResult = await client.query(
      "INSERT INTO accounts (login_id, role, email) VALUES ($1, 'senate', $2) RETURNING id",
      [loginId, email],
    );
    const accountId = accountResult.rows[0].id;

    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO password_set_tokens (account_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [accountId, hashToken(rawToken), expiresAt],
    );

    await client.query(
      `INSERT INTO audit_log (event_type, actor_account_id, entity_type, entity_id, details)
       VALUES ('senate_account.created', NULL, 'account', $1, $2)`,
      [accountId, JSON.stringify({ loginId, name: name || null, createdVia: 'cli' })],
    );

    await client.query('COMMIT');

    const base = process.env.SET_PASSWORD_URL_BASE || 'http://localhost:3000/set-password';
    console.log(`Senate account "${loginId}" created.`);
    console.log(`Set-password link (expires in 24h): ${base}?token=${rawToken}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
