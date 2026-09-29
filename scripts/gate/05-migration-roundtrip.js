const { run } = require('./lib/exec');
const { withClient } = require('./lib/db');
const invariantCheck = require('./02-invariants');

async function schemaSnapshot(client) {
  const result = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name
  `);
  return JSON.stringify(result.rows);
}

/**
 * Loop 0 is the first loop, so there is no previous loop's database to diff
 * against. Instead: migrate up from empty, run the invariants, migrate down,
 * migrate up again, and assert the schema is identical to the first up. This
 * exercises the real up/down/up mechanism now so Loop 1 can point it at a real
 * prior-loop snapshot without changing how the check itself works.
 */
module.exports = async function migrationRoundTrip() {
  const up1 = run('npm', ['run', 'db:migrate:test']);
  if (up1.code !== 0) return { passed: false, summary: 'migrate up failed' };

  const invariantResult = await invariantCheck();
  if (!invariantResult.passed) {
    return { passed: false, summary: `invariants failed after migrate up: ${invariantResult.summary}` };
  }

  const afterUp = await withClient(schemaSnapshot);

  const down = run('npm', ['run', 'db:migrate:test:down']);
  if (down.code !== 0) return { passed: false, summary: 'migrate down failed' };

  const up2 = run('npm', ['run', 'db:migrate:test']);
  if (up2.code !== 0) return { passed: false, summary: 'second migrate up failed' };

  const afterUp2 = await withClient(schemaSnapshot);

  if (afterUp !== afterUp2) {
    return { passed: false, summary: 'schema after up -> down -> up does not match the schema after the first up' };
  }
  return { passed: true, summary: 'migrate up -> down -> up round-tripped to an identical schema' };
};
