const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { run } = require('./lib/exec');

const CHECKS = [
  { id: 1, name: 'Full regression suite', module: './01-regression' },
  { id: 2, name: 'Invariant check', module: './02-invariants' },
  { id: 3, name: 'Mark-leak scan', module: './03-mark-leak-scan' },
  { id: 4, name: 'Route contract check', module: './04-route-contract' },
  { id: 5, name: 'Migration round-trip', module: './05-migration-roundtrip' },
  { id: 6, name: 'Impact review', module: './06-impact-review' },
  { id: 7, name: 'Scripted demo', module: './07-scripted-demo' },
  { id: 8, name: 'Decision check', module: './08-decision-check' },
];

async function main() {
  console.log('Preparing test database (migrate up)...');
  const migrate = run('npm', ['run', 'db:migrate:test']);
  if (migrate.code !== 0) {
    console.error('Could not migrate the test database. Is `npm run db:up` running?');
    process.exit(1);
  }

  const results = [];
  for (const check of CHECKS) {
    console.log(`\n=== Gate check ${check.id}/8: ${check.name} ===`);
    let result;
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      result = await require(check.module)();
    } catch (err) {
      result = { passed: false, summary: err.stack || String(err) };
    }
    results.push({ ...check, ...result });

    if (result.passed) {
      console.log(`PASS: ${result.summary}`);
    } else {
      console.error(`FAIL: ${result.summary}`);
    }

    if (!result.passed) {
      writeReport(results);
      console.error(`\nGATE CHECK ${check.id} FAILED (${check.name}). Fix it, then run the whole gate again.`);
      process.exit(1);
    }
  }

  writeReport(results);
  console.log('\nAll 8 gate checks passed.');
}

function writeReport(results) {
  const reportPath = path.resolve(__dirname, '../../gate-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
