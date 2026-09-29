const fs = require('fs');
const path = require('path');
const { decisionsToVerify } = require('./lib/loopConfig');

const PLAN_PATH = path.resolve(__dirname, '../../docs/PLAN.md');

function parseDecisionRows(markdown) {
  const rows = {};
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => !(i === 0 || i === arr.length - 1));
    if (cells.length < 2) continue;
    const id = cells[0];
    if (!/^[DN]\d+$/.test(id)) continue;
    rows[id] = { status: cells[cells.length - 1], builtInLoop: cells[cells.length - 2] };
  }
  return rows;
}

/**
 * Parses docs/PLAN.md's Decisions tables and asserts every D/N row this loop
 * depends on is marked Decided. Fully automatable now and stays that way -
 * later loops just extend decisionsToVerify in lib/loopConfig.js.
 */
module.exports = async function decisionCheck() {
  const markdown = fs.readFileSync(PLAN_PATH, 'utf8');
  const rows = parseDecisionRows(markdown);

  const problems = [];
  for (const id of decisionsToVerify) {
    const row = rows[id];
    if (!row) {
      problems.push(`${id}: not found in docs/PLAN.md decisions tables`);
    } else if (row.status !== 'Decided') {
      problems.push(`${id}: status is "${row.status}", not Decided`);
    }
  }

  if (problems.length > 0) {
    return { passed: false, summary: problems.join('; ') };
  }
  return { passed: true, summary: `${decisionsToVerify.join(', ')} all marked Decided in docs/PLAN.md` };
};
