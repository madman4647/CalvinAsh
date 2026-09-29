const { Pool } = require('pg');

function connectionString() {
  if (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
}

const pool = new Pool({ connectionString: connectionString() });

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
