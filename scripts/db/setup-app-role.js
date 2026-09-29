const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client } = require('pg');

/**
 * Sets the restricted app role's login password from an env var, so no
 * secret has to live in a committed migration file. Safe to run repeatedly -
 * it always just (re)sets the password on the role the migrations already
 * created. Runs against both the dev and test databases.
 */
async function setPassword(connectionString, password) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const escaped = password.replace(/'/g, "''");
    await client.query(`ALTER ROLE calvin_app WITH LOGIN PASSWORD '${escaped}'`);
  } finally {
    await client.end();
  }
}

async function main() {
  const password = process.env.APP_DB_PASSWORD;
  if (!password) {
    throw new Error('APP_DB_PASSWORD is not set');
  }

  const targets = [process.env.DATABASE_URL, process.env.TEST_DATABASE_URL].filter(Boolean);
  for (const connectionString of targets) {
    await setPassword(connectionString, password);
  }
  console.log(`calvin_app password set on ${targets.length} database(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
