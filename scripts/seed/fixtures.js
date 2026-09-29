// Shared between scripts/seed/selection-day.js and anything that needs to
// log in as a seeded fixture account (gate check 3's role-based crawl,
// contract tests) - one place defines the known login IDs and password so
// they can never drift apart.
const TEST_PASSWORD = 'SelectionDay1!';

const SENATE_LOGIN_ID = 'senate';
const CCA_COUNT = 35;
const PANELISTS_PER_CCA = 3;
const TOTAL_PANELISTS = Math.max(PANELISTS_PER_CCA * 4, 20);
const STUDENT_COUNT = 300;

const CCA_TYPES = ['committee', 'club', 'aig'];

function ccaLoginId(i) {
  return `cca-${String(i).padStart(2, '0')}`;
}

function panelistLoginId(i) {
  return `panelist-${String(i).padStart(3, '0')}`;
}

function studentLoginId(i) {
  return `student-${String(i).padStart(4, '0')}`;
}

// A fixed representative login ID per role, for anything that just needs
// "some account with this role" rather than enumerating all of them.
const SAMPLE_CCA_LOGIN_ID = ccaLoginId(1);
const SAMPLE_PANELIST_LOGIN_ID = panelistLoginId(1);
const SAMPLE_STUDENT_LOGIN_ID = studentLoginId(1);

module.exports = {
  TEST_PASSWORD,
  SENATE_LOGIN_ID,
  CCA_COUNT,
  PANELISTS_PER_CCA,
  TOTAL_PANELISTS,
  STUDENT_COUNT,
  CCA_TYPES,
  ccaLoginId,
  panelistLoginId,
  studentLoginId,
  SAMPLE_CCA_LOGIN_ID,
  SAMPLE_PANELIST_LOGIN_ID,
  SAMPLE_STUDENT_LOGIN_ID,
};
