module.exports = {
  currentLoop: 0,
  loopReportPath: 'docs/loops/loop-0.md',
  demoScriptPath: 'docs/loops/loop-0-demo.md',
  // Per PLAN.md's Shared Components table - the rows whose "Changed in loops" list includes this loop.
  sharedComponentsTouched: ['Accounts and roles', 'Applications and ranking', 'File storage'],
  // Per PLAN.md's Decisions tables - the D/N rows with "Built in loop" <= currentLoop.
  decisionsToVerify: ['N5', 'N6', 'N7', 'N8'],
};
