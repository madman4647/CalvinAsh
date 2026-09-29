const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { Client } = require('pg');

function testDatabaseUrl() {
  return process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
}

async function withClient(fn, connectionString = testDatabaseUrl()) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

module.exports = { withClient, testDatabaseUrl };
