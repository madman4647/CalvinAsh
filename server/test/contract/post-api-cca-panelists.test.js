const crypto = require('crypto');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { expectRouteContract } = require('./routeContractHelper');
const { agentForRole } = require('../helpers/loginAgent');

describe('POST /api/cca/panelists', () => {
  it('only a CCA account can add a panelist, and it is audited', async () => {
    const app = createApp();
    const cca = await agentForRole(app, 'cca');
    const student = await agentForRole(app, 'student');
    const loginId = `contract-panelist-${crypto.randomBytes(4).toString('hex')}`;

    await expectRouteContract({
      method: 'post',
      path: '/api/cca/panelists',
      wrongRoleAgent: student,
      correctRoleAgent: cca,
      auditEvent: 'panelist.added',
      wrongBody: { loginId: `wrong-${loginId}`, name: 'Wrong', email: 'wrong@fixture.test' },
      correctBody: { loginId, name: 'Contract Test Panelist', email: 'contract-panelist@fixture.test' },
      expectStatus: 201,
    });
  });
});
