const http = require('http');
const { createApp } = require('../../server/src/app');
const { getRegisteredRoutes } = require('../../server/src/lib/routeRegistry');
const { TEST_PASSWORD, SAMPLE_CCA_LOGIN_ID, SAMPLE_PANELIST_LOGIN_ID, SAMPLE_STUDENT_LOGIN_ID } = require('../seed/fixtures');

const BANNED_FIELD_PATTERN = /(^|_)(mark|marks|score|scores|total|totals|rank|ranks)($|_)/i;

// PLAN.md: "a crawler calls every student and CCA endpoint" - extended to
// panelist too, since CLAUDE.md's non-negotiables say a panelist can never
// see a locked mark either. Senate is exempt (Senate IS allowed to see marks).
const LOGIN_ID_BY_ROLE = {
  student: SAMPLE_STUDENT_LOGIN_ID,
  cca: SAMPLE_CCA_LOGIN_ID,
  panelist: SAMPLE_PANELIST_LOGIN_ID,
};

function scanForBannedFields(value, pointer = '$') {
  const hits = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => hits.push(...scanForBannedFields(v, `${pointer}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (BANNED_FIELD_PATTERN.test(key)) {
        hits.push(`${pointer}.${key}`);
      }
      hits.push(...scanForBannedFields(v, `${pointer}.${key}`));
    }
  }
  return hits;
}

function request(method, url, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let json = {};
          try { json = JSON.parse(data); } catch { /* non-JSON response, nothing to scan */ }
          resolve({ status: res.statusCode, body: json, cookie: res.headers['set-cookie']?.[0]?.split(';')[0] });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function loginAs(baseUrl, role) {
  const loginId = LOGIN_ID_BY_ROLE[role];
  const res = await request('POST', `${baseUrl}/api/auth/login`, { body: { loginId, password: TEST_PASSWORD } });
  if (res.status !== 200 || !res.cookie) {
    throw new Error(`could not log in the fixture ${role} account "${loginId}" for the mark-leak scan (status ${res.status}, body ${JSON.stringify(res.body)}, cookie ${res.cookie}) - run npm run seed:selection-day`);
  }
  return res.cookie;
}

/**
 * Crawls every registered GET route as each of student/CCA/panelist (using
 * seeded fixture accounts) plus once fully unauthenticated, scanning every
 * response body for banned mark/score/total/rank fields regardless of status
 * code. Loop 0 only ever crawled anonymously; Loop 1 has real roles to test.
 */
module.exports = async function markLeakScan() {
  const app = createApp();
  const routes = getRegisteredRoutes().filter((r) => r.method === 'get');

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const hits = [];
  try {
    const identities = [{ label: 'unauthenticated', cookie: null }];
    for (const role of Object.keys(LOGIN_ID_BY_ROLE)) {
      identities.push({ label: role, cookie: await loginAs(baseUrl, role) });
    }

    for (const identity of identities) {
      for (const route of routes) {
        const res = await request('GET', `${baseUrl}${route.path}`, { cookie: identity.cookie });
        scanForBannedFields(res.body).forEach((p) => hits.push(`[${identity.label}] GET ${route.path} ${p}`));
      }
    }

    if (hits.length > 0) {
      return { passed: false, summary: `banned field(s) leaked: ${hits.join(', ')}` };
    }
    return {
      passed: true,
      summary: `${routes.length} route(s) x ${identities.length} identit(y/ies) (${identities.map((i) => i.label).join(', ')}) scanned, 0 leaked mark/score/total/rank fields`,
    };
  } finally {
    server.close();
  }
};
