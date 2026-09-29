const fs = require('fs');
const path = require('path');
const { withClient } = require('./lib/db');
const { run } = require('./lib/exec');

const INVARIANTS_DIR = path.resolve(__dirname, '../../invariants');

async function runInvariantFiles(client) {
  const files = fs.readdirSync(INVARIANTS_DIR).filter((f) => f.endsWith('.sql'));
  const failures = [];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(INVARIANTS_DIR, file), 'utf8');
    const result = await client.query(sql);
    if (result.rows.length > 0) {
      failures.push({ file, violatingRows: result.rows.length });
    }
  }
  return { files, failures };
}

/**
 * Runs every invariants/*.sql assertion twice: once on the test database as it
 * stands after the regression suite, once on a seeded "selection day" dataset.
 * Loop 0 has zero invariant files (INV-01..21 start at Loop 1) so this passes
 * vacuously - but the runner, the seed script and the double-pass structure are
 * all real and exercised now.
 */
module.exports = async function invariantCheck() {
  const pass1 = await withClient(runInvariantFiles);

  const seed = run('node', ['scripts/seed/selection-day.js']);
  if (seed.code !== 0) {
    return { passed: false, summary: 'selection-day seed script failed' };
  }
  const pass2 = await withClient(runInvariantFiles);

  const totalFailures = pass1.failures.length + pass2.failures.length;
  if (totalFailures > 0) {
    return {
      passed: false,
      summary: `${totalFailures} invariant violation(s) found`,
      details: { pass1, pass2 },
    };
  }

  const note = pass1.files.length === 0
    ? ' (0 invariants defined yet - expected until Loop 1 adds INV-01..03)'
    : '';
  return {
    passed: true,
    summary: `${pass1.files.length} invariant file(s) checked twice, 0 violations${note}`,
  };
};
