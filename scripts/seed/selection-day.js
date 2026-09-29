const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client } = require('pg');

/**
 * Seeds a "selection day" dataset (PLAN.md gate check 2: 35 CCAs, all round
 * types, open sessions, parked submissions) that the invariant check runs
 * against. Loop 0 has no business tables yet, so there is nothing to seed
 * beyond confirming the baseline migration's rows are there - Loop 1+ fill in
 * the real fixtures here without changing how the gate calls this script.
 */
async function main() {
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query('SELECT count(*)::int AS count FROM _health_check');
    console.log(`selection-day seed: no business tables yet (${result.rows[0].count} baseline health-check row(s) present)`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
