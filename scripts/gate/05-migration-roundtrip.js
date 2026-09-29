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
 * Migrates up, seeds the real selection-day fixtures, runs the invariants,
 * then migrates all the way down and back up, comparing schemas. Seeding
 * before the down/up cycle (rather than Loop 0's empty-schema round-trip)
 * proves the down migrations tear down a genuinely populated database
 * cleanly - FK/ordering bugs an empty schema can't surface - not that data
 * survives the round-trip, which down migrations are never meant to do.
 */
module.exports = async function migrationRoundTrip() {
  const up1 = run('npm', ['run', 'db:migrate:test']);
  if (up1.code !== 0) return { passed: false, summary: 'migrate up failed' };

  const seed = run('npm', ['run', 'seed:selection-day']);
  if (seed.code !== 0) return { passed: false, summary: 'selection-day seed failed before the round-trip' };

  const invariantResult = await invariantCheck();
  if (!invariantResult.passed) {
    return { passed: false, summary: `invariants failed after migrate up + seed: ${invariantResult.summary}` };
  }

  const afterUp = await withClient(schemaSnapshot);

  const down = run('npm', ['run', 'db:migrate:test:down:all']);
  if (down.code !== 0) return { passed: false, summary: 'migrate down (populated schema) failed' };

  const up2 = run('npm', ['run', 'db:migrate:test']);
  if (up2.code !== 0) return { passed: false, summary: 'second migrate up failed' };

  const afterUp2 = await withClient(schemaSnapshot);

  if (afterUp !== afterUp2) {
    return { passed: false, summary: 'schema after up -> down -> up does not match the schema after the first up' };
  }
  return { passed: true, summary: 'migrate up -> seed -> down (all) -> up round-tripped a populated schema to an identical shape' };
};
