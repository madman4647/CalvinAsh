const crypto = require('crypto');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { pool } = require('../../src/db');
const { expectPublicRouteAudit } = require('./routeContractHelper');

// A fresh throwaway account per test run, not a shared fixture login - reusing
// a fixture ID across many local `npm run gate` runs would eventually trip
// the rate limit this same route enforces and make the test flaky.
async function createThrowawayStudent() {
  const loginId = `contract-forgot-${crypto.randomBytes(4).toString('hex')}`;
  const result = await pool.query(
    "INSERT INTO accounts (login_id, role, status) VALUES ($1, 'student', 'active') RETURNING id",
    [loginId],
  );
  await pool.query(
    'INSERT INTO students (account_id, name, email, batch) VALUES ($1, $2, $3, $4)',
    [result.rows[0].id, 'Contract Test Student', 'contract-forgot@fixture.test', 'PGP25'],
  );
  return loginId;
}

describe('POST /api/auth/forgot-password', () => {
  it('is public and writes an audit row for an existing login ID', async () => {
    const app = createApp();
    const loginId = await createThrowawayStudent();
    await expectPublicRouteAudit({
      agent: request(app),
      method: 'post',
      path: '/api/auth/forgot-password',
      auditEvent: 'password_reset.requested',
      body: { loginId },
    });
  });

  it('responds identically for a login ID that does not exist (N9)', async () => {
    const app = createApp();
    const loginId = await createThrowawayStudent();
    const known = await request(app).post('/api/auth/forgot-password').send({ loginId });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ loginId: 'no-such-login-id' });
    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
  });
});
