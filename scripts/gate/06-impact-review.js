const fs = require('fs');
const path = require('path');
const { loopReportPath, sharedComponentsTouched } = require('./lib/loopConfig');

function extractSection(markdown, headingText) {
  const lines = markdown.split('\n');
  const isHeading = (l) => /^#{1,6}\s/.test(l);
  const startIdx = lines.findIndex(
    (l) => isHeading(l) && l.replace(/^#+\s*/, '').trim().toLowerCase() === headingText.toLowerCase(),
  );
  if (startIdx === -1) return null;
  const startLevel = lines[startIdx].match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (isHeading(lines[i]) && lines[i].match(/^#+/)[0].length <= startLevel) {
      end = i;
      break;
    }
  }
  return lines.slice(startIdx + 1, end).join('\n').trim();
}

/**
 * Impact review is inherently a human/process checklist (a 15-minute exploratory
 * pass over each shared component the loop touched). This doesn't fake that
 * automation - it makes the paperwork machine-verifiable: the loop report must
 * exist and have a real, non-empty section for every shared component PLAN.md
 * says this loop touches, so the gate can't pass on a missing or copy-pasted
 * checklist.
 */
module.exports = async function impactReview() {
  const reportFile = path.resolve(__dirname, '../..', loopReportPath);
  if (!fs.existsSync(reportFile)) {
    return { passed: false, summary: `missing loop report at ${loopReportPath}` };
  }
  const markdown = fs.readFileSync(reportFile, 'utf8');

  const missing = [];
  for (const component of sharedComponentsTouched) {
    const section = extractSection(markdown, component);
    if (!section || section.length < 10) {
      missing.push(component);
    }
  }

  if (missing.length > 0) {
    return {
      passed: false,
      summary: `loop report missing/empty impact-review section(s) for: ${missing.join(', ')}`,
    };
  }
  return { passed: true, summary: `impact review present for: ${sharedComponentsTouched.join(', ')}` };
};
