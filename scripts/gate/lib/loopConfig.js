module.exports = {
  currentLoop: 1,
  loopReportPath: 'docs/loops/loop-1.md',
  demoScriptPath: 'docs/loops/loop-1-demo.md',
  // Per PLAN.md's Shared Components table - the rows whose "Changed in loops" list includes this loop.
  sharedComponentsTouched: ['Accounts and roles', 'Audit log'],
  // Per PLAN.md's Decisions tables - accumulates across loops rather than
  // replacing, since gate check 8 also re-confirms nothing already Decided
  // has quietly regressed.
  decisionsToVerify: ['N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'D3'],
};
