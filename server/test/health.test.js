const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /api/health', () => {
  it('returns the health check rows written by the baseline migration', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.checks)).toBe(true);
    expect(res.body.checks.length).toBeGreaterThan(0);
  });
});
