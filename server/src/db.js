const { Pool } = require('pg');

// The running server always connects as the restricted calvin_app role -
// migrations, seeding and schema inspection use the owner role instead (see
// scripts/db/lib/db.js and scripts/gate/lib/db.js).
function connectionString() {
  if (process.env.NODE_ENV === 'test' && process.env.APP_TEST_DATABASE_URL) {
    return process.env.APP_TEST_DATABASE_URL;
  }
  return process.env.APP_DATABASE_URL;
}

const pool = new Pool({ connectionString: connectionString() });

function query(text, params) {
  return pool.query(text, params);
}

/**
 * Runs fn inside BEGIN/COMMIT, rolling back on any throw. This is the "open
 * a transaction ... write the new state and the audit row, commit" pattern
 * every state-transition route follows (CLAUDE.md -> Engineering conventions).
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
