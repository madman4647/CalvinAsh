const request = require('supertest');
const { createApp } = require('../../src/app');
const { expectRouteContract } = require('./routeContractHelper');
const { agentForRole } = require('../helpers/loginAgent');

describe('POST /api/auth/logout', () => {
  it('refuses an unauthenticated request and audits a signed-in one', async () => {
    const app = createApp();
    const student = await agentForRole(app, 'student');

    await expectRouteContract({
      method: 'post',
      path: '/api/auth/logout',
      wrongRoleAgent: request(app), // no session at all - every role is otherwise allowed
      correctRoleAgent: student,
      auditEvent: 'logout',
    });
  });
});
