const crypto = require('crypto');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { expectRouteContract } = require('./routeContractHelper');
const { agentForRole } = require('../helpers/loginAgent');

function csvFor(loginId) {
  return Buffer.from(`login_id,name,email,batch\n${loginId},Contract Import Student,contract-import@fixture.test,PGP25\n`);
}

describe('POST /api/senate/students/import', () => {
  it('only Senate can import students, and it is audited', async () => {
    const app = createApp();
    const senate = await agentForRole(app, 'senate');
    const cca = await agentForRole(app, 'cca');
    const loginId = `contract-import-${crypto.randomBytes(4).toString('hex')}`;

    await expectRouteContract({
      method: 'post',
      path: '/api/senate/students/import',
      wrongRoleAgent: cca,
      correctRoleAgent: senate,
      auditEvent: 'students.imported',
      buildWrongRequest: (req) => req.attach('file', csvFor(`wrong-${loginId}`), 'students.csv'),
      buildCorrectRequest: (req) => req.attach('file', csvFor(loginId), 'students.csv'),
    });
  });
});
