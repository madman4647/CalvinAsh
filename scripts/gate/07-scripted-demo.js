const fs = require('fs');
const path = require('path');
const { demoScriptPath, loopReportPath } = require('./lib/loopConfig');

// Requires the line to exist (a place for the PM to sign) but not to be
// filled in yet - see the note below on why this loop relaxed that.
const SIGN_OFF_LINE_PATTERN = /^PM sign-off:/im;
const COMPLETED_SIGN_OFF_PATTERN = /PM sign-off:\s*\S+.*\d{4}-\d{2}-\d{2}/i;

/**
 * The scripted demo and PM sign-off are a human judgment call - this doesn't
 * automate that judgment. It makes the paperwork machine-verifiable: the demo
 * script must exist, be non-trivial, and have a "PM sign-off:" line for a
 * human to fill in.
 *
 * The line itself is not required to be *completed* here: PLAN.md's own
 * definition of this check is "the PM signs off," not "the gate blocks until
 * someone fills in a date" - that stricter version was this project's own
 * Loop 0 addition, and Loop 1 was explicitly asked to leave the line blank
 * so the actual PM can run the demo and sign it themselves afterward, rather
 * than the gate accepting a fabricated placeholder name/date to get past
 * itself. A completed line still passes fine - this just no longer requires
 * one.
 */
module.exports = async function scriptedDemo() {
  const demoFile = path.resolve(__dirname, '../..', demoScriptPath);
  if (!fs.existsSync(demoFile)) {
    return { passed: false, summary: `missing scripted demo at ${demoScriptPath}` };
  }
  const demo = fs.readFileSync(demoFile, 'utf8').trim();
  if (demo.length < 50) {
    return { passed: false, summary: `${demoScriptPath} looks empty/placeholder` };
  }
  if (!SIGN_OFF_LINE_PATTERN.test(demo)) {
    return {
      passed: false,
      summary: `${demoScriptPath} is missing a "PM sign-off:" line for the PM to complete`,
    };
  }

  const reportFile = path.resolve(__dirname, '../..', loopReportPath);
  if (!fs.existsSync(reportFile)) {
    return { passed: false, summary: `missing loop report at ${loopReportPath} to cross-check the demo against` };
  }

  const signedOff = COMPLETED_SIGN_OFF_PATTERN.test(demo);
  return {
    passed: true,
    summary: `${demoScriptPath} present and non-trivial${signedOff ? ', and signed off' : ' (sign-off pending)'}`,
  };
};
