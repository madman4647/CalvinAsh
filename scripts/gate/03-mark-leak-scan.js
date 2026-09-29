const http = require('http');
const { createApp } = require('../../server/src/app');
const { getRegisteredRoutes } = require('../../server/src/lib/routeRegistry');

const BANNED_FIELD_PATTERN = /(^|_)(mark|marks|score|scores|total|totals|rank|ranks)($|_)/i;

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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    }).on('error', reject);
  });
}

/**
 * Crawls every registered route (via the same registry gate check 4 uses) and
 * scans each JSON response for banned mark/score/total/rank fields. Loop 0 has
 * one route (health check) and no roles yet, so it scans everything registered;
 * Loop 1+ narrow this to student/CCA-role routes once roles exist.
 */
module.exports = async function markLeakScan() {
  // Routes register themselves once, at module require-time (see
  // routeRegistry.js) - the registry already holds every route by the time
  // this runs, whether createApp() has been called before or not.
  const app = createApp();
  const routes = getRegisteredRoutes().filter((r) => r.method === 'get');

  const server = app.listen(0);
  const { port } = server.address();

  const hits = [];
  try {
    for (const route of routes) {
      const body = await fetchJson(`http://127.0.0.1:${port}${route.path}`);
      scanForBannedFields(body).forEach((p) => hits.push(`${route.method.toUpperCase()} ${route.path} ${p}`));
    }
  } finally {
    server.close();
  }

  if (hits.length > 0) {
    return { passed: false, summary: `banned field(s) leaked: ${hits.join(', ')}` };
  }
  return {
    passed: true,
    summary: `${routes.length} route(s) scanned, 0 leaked mark/score/total/rank fields`,
  };
};
