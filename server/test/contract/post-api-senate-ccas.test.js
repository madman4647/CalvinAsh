const crypto = require('crypto');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { expectRouteContract } = require('./routeContractHelper');
const { agentForRole } = require('../helpers/loginAgent');

describe('POST /api/senate/ccas', () => {
  it('only Senate can create a CCA account, and it is audited', async () => {
    const app = createApp();
    const senate = await agentForRole(app, 'senate');
    const student = await agentForRole(app, 'student');
    const loginId = `contract-cca-${crypto.randomBytes(4).toString('hex')}`;

    await expectRouteContract({
      method: 'post',
      path: '/api/senate/ccas',
      wrongRoleAgent: student,
      correctRoleAgent: senate,
      auditEvent: 'cca.created',
      wrongBody: { loginId: `wrong-${loginId}`, name: 'Wrong', type: 'committee', email: 'wrong@fixture.test' },
      correctBody: { loginId, name: 'Contract Test CCA', type: 'committee', email: 'contract-cca@fixture.test' },
      expectStatus: 201,
    });
  });
});
