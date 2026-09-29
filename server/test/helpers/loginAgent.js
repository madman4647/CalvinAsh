const request = require('supertest');
const {
  TEST_PASSWORD,
  SENATE_LOGIN_ID,
  SAMPLE_CCA_LOGIN_ID,
  SAMPLE_PANELIST_LOGIN_ID,
  SAMPLE_STUDENT_LOGIN_ID,
} = require('../../../scripts/seed/fixtures');

const LOGIN_ID_BY_ROLE = {
  senate: SENATE_LOGIN_ID,
  cca: SAMPLE_CCA_LOGIN_ID,
  panelist: SAMPLE_PANELIST_LOGIN_ID,
  student: SAMPLE_STUDENT_LOGIN_ID,
};

/** A supertest agent already logged in as the given role's seeded fixture account. */
async function agentForRole(app, role) {
  const agent = request.agent(app);
  const loginId = LOGIN_ID_BY_ROLE[role];
  const res = await agent.post('/api/auth/login').send({ loginId, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(
      `could not log in the fixture ${role} account "${loginId}" - run \`npm run seed:selection-day\` first ` +
      `(got ${res.status}: ${JSON.stringify(res.body)})`,
    );
  }
  return agent;
}

module.exports = { agentForRole, LOGIN_ID_BY_ROLE };
