const crypto = require('crypto');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { pool } = require('../../src/db');
const { expectPublicRouteAudit } = require('./routeContractHelper');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function createThrowawayTokenAccount() {
  const loginId = `contract-set-pw-${crypto.randomBytes(4).toString('hex')}`;
  const accountResult = await pool.query(
    "INSERT INTO accounts (login_id, role, status) VALUES ($1, 'student', 'pending') RETURNING id",
    [loginId],
  );
  const accountId = accountResult.rows[0].id;
  await pool.query(
    'INSERT INTO students (account_id, name, email, batch) VALUES ($1, $2, $3, $4)',
    [accountId, 'Contract Test Student', 'contract-set-pw@fixture.test', 'PGP25'],
  );
  const rawToken = generateToken();
  await pool.query(
    "INSERT INTO password_set_tokens (account_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 day')",
    [accountId, hashToken(rawToken)],
  );
  return rawToken;
}

describe('POST /api/auth/set-password', () => {
  it('is public and writes an audit row on success', async () => {
    const app = createApp();
    const token = await createThrowawayTokenAccount();
    await expectPublicRouteAudit({
      agent: request(app),
      method: 'post',
      path: '/api/auth/set-password',
      auditEvent: 'password.set',
      body: { token, password: 'ThrowawayPass1!' },
    });
  });

  it('refuses a reused token', async () => {
    const app = createApp();
    const token = await createThrowawayTokenAccount();
    await request(app).post('/api/auth/set-password').send({ token, password: 'ThrowawayPass1!' });
    const second = await request(app).post('/api/auth/set-password').send({ token, password: 'AnotherPass1!' });
    expect(second.status).toBe(400);
  });
});
