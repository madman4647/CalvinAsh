const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const {
  TEST_PASSWORD,
  SENATE_LOGIN_ID,
  CCA_COUNT,
  PANELISTS_PER_CCA,
  TOTAL_PANELISTS,
  STUDENT_COUNT,
  CCA_TYPES,
  ccaLoginId,
  panelistLoginId,
  studentLoginId,
} = require('./fixtures');

/**
 * Seeds the "selection day" dataset the invariant check and gate check 3's
 * role-based crawl both rely on: 1 Senate account, a shared pool of panelist
 * accounts (some serving more than one CCA, like a real senior would), 35
 * CCA accounts, and a few hundred students - all sharing one pre-hashed
 * password so seeding stays fast. Idempotent: does nothing if the Senate
 * fixture account already exists.
 */
async function main() {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const existing = await client.query('SELECT id FROM accounts WHERE login_id = $1', [SENATE_LOGIN_ID]);
    if (existing.rows.length > 0) {
      console.log('selection-day seed: fixtures already present, skipping');
      return;
    }

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    await client.query('BEGIN');

    await client.query(
      "INSERT INTO accounts (login_id, password_hash, role, status, email) VALUES ($1, $2, 'senate', 'active', $3)",
      [SENATE_LOGIN_ID, passwordHash, 'senate@fixture.test'],
    );

    const panelistAccountIds = [];
    for (let i = 1; i <= TOTAL_PANELISTS; i += 1) {
      const accountResult = await client.query(
        "INSERT INTO accounts (login_id, password_hash, role, status) VALUES ($1, $2, 'panelist', 'active') RETURNING id",
        [panelistLoginId(i), passwordHash],
      );
      const accountId = accountResult.rows[0].id;
      await client.query(
        'INSERT INTO panelists (account_id, name, email) VALUES ($1, $2, $3)',
        [accountId, `Panelist ${i}`, `panelist${i}@fixture.test`],
      );
      panelistAccountIds.push(accountId);
    }

    for (let i = 1; i <= CCA_COUNT; i += 1) {
      const accountResult = await client.query(
        "INSERT INTO accounts (login_id, password_hash, role, status) VALUES ($1, $2, 'cca', 'active') RETURNING id",
        [ccaLoginId(i), passwordHash],
      );
      const ccaAccountId = accountResult.rows[0].id;
      const type = CCA_TYPES[i % CCA_TYPES.length];
      await client.query(
        'INSERT INTO ccas (account_id, name, type, email) VALUES ($1, $2, $3, $4)',
        [ccaAccountId, `Fixture CCA ${i}`, type, `cca${i}@fixture.test`],
      );

      for (let p = 0; p < PANELISTS_PER_CCA; p += 1) {
        const panelistIdx = ((i - 1) * PANELISTS_PER_CCA + p) % panelistAccountIds.length;
        await client.query(
          'INSERT INTO cca_members (panelist_id, cca_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [panelistAccountIds[panelistIdx], ccaAccountId],
        );
      }
    }

    for (let i = 1; i <= STUDENT_COUNT; i += 1) {
      const accountResult = await client.query(
        "INSERT INTO accounts (login_id, password_hash, role, status) VALUES ($1, $2, 'student', 'active') RETURNING id",
        [studentLoginId(i), passwordHash],
      );
      await client.query(
        'INSERT INTO students (account_id, name, email, batch) VALUES ($1, $2, $3, $4)',
        [accountResult.rows[0].id, `Student ${i}`, `student${i}@fixture.test`, `PGP${25 + (i % 2)}`],
      );
    }

    await client.query('COMMIT');
    console.log(
      `selection-day seed: created 1 senate, ${TOTAL_PANELISTS} panelists, ${CCA_COUNT} CCAs, ${STUDENT_COUNT} students (shared password: ${TEST_PASSWORD})`,
    );
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
