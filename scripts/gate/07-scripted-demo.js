const fs = require('fs');
const path = require('path');
const { demoScriptPath, loopReportPath } = require('./lib/loopConfig');

const SIGN_OFF_PATTERN = /PM sign-off:\s*\S+.*\d{4}-\d{2}-\d{2}/i;

/**
 * The scripted demo and PM sign-off are a human judgment call - this doesn't
 * automate that judgment. It makes the paperwork machine-verifiable: the demo
 * script must exist, be non-trivial, and carry a completed sign-off line the
 * gate refuses to pass without.
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
  if (!SIGN_OFF_PATTERN.test(demo)) {
    return {
      passed: false,
      summary: `${demoScriptPath} is missing a completed "PM sign-off: <name> <YYYY-MM-DD>" line`,
    };
  }

  const reportFile = path.resolve(__dirname, '../..', loopReportPath);
  if (!fs.existsSync(reportFile)) {
    return { passed: false, summary: `missing loop report at ${loopReportPath} to cross-check the demo against` };
  }

  return { passed: true, summary: `${demoScriptPath} present, non-trivial, and signed off` };
};
