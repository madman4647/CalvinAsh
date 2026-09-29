const request = require('supertest');
const { createApp } = require('../../src/app');
const { expectPublicRouteAudit } = require('./routeContractHelper');
const { SENATE_LOGIN_ID, TEST_PASSWORD } = require('../../../scripts/seed/fixtures');

describe('POST /api/auth/login', () => {
  it('is public and writes an audit row on success', async () => {
    const app = createApp();
    await expectPublicRouteAudit({
      agent: request(app),
      method: 'post',
      path: '/api/auth/login',
      auditEvent: 'login.succeeded',
      body: { loginId: SENATE_LOGIN_ID, password: TEST_PASSWORD },
    });
  });

  it('refuses an incorrect password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({ loginId: SENATE_LOGIN_ID, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
