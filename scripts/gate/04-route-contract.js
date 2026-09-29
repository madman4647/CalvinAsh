const fs = require('fs');
const path = require('path');
const { createApp } = require('../../server/src/app');
const { getRegisteredRoutes } = require('../../server/src/lib/routeRegistry');

const CONTRACT_TEST_DIR = path.resolve(__dirname, '../../server/test/contract');

function slug(route) {
  // e.g. { method: 'post', path: '/api/auth/login' } -> 'post-api-auth-login'.
  // Loop 0 only ever had path: '/', which happened not to expose that
  // joining "post-" with "/api/..." left a doubled "--" once the "/" itself
  // got collapsed to "-" (the leading "-" from the join was never touched by
  // the regex, since "-" isn't in the character class it matches).
  const cleanPath = route.path.replace(/^\/+/, '').replace(/[/:]+/g, '-').replace(/-+$/, '');
  return cleanPath ? `${route.method}-${cleanPath}` : route.method;
}

/**
 * Every data-changing route must declare a permission + auditEvent (enforced
 * at registration time by routeRegistry.defineRoute) AND have a contract
 * test at server/test/contract/<method>-<path>.test.js that calls the shared
 * helper (server/test/contract/routeContractHelper.js) instead of asserting
 * this freehand - expectRouteContract() for a role-restricted route,
 * expectPublicRouteAudit() for a 'public' one. This replaces Loop 0's loose
 * /refus/i and /audit/i text-matching, which a contract test could satisfy
 * just by mentioning those words in a comment.
 */
module.exports = async function routeContractCheck() {
  createApp();
  const routes = getRegisteredRoutes();
  const dataChanging = routes.filter((r) => r.dataChanging);

  const problems = [];
  for (const route of dataChanging) {
    if (!route.permission) problems.push(`${route.method.toUpperCase()} ${route.path}: missing permission`);
    if (!route.auditEvent) problems.push(`${route.method.toUpperCase()} ${route.path}: missing auditEvent`);

    const testFile = path.join(CONTRACT_TEST_DIR, `${slug(route)}.test.js`);
    if (!fs.existsSync(testFile)) {
      problems.push(`${route.method.toUpperCase()} ${route.path}: no contract test at server/test/contract/${slug(route)}.test.js`);
      continue;
    }

    const content = fs.readFileSync(testFile, 'utf8');
    const requiredHelper = route.permission === 'public' ? 'expectPublicRouteAudit' : 'expectRouteContract';
    if (!new RegExp(`${requiredHelper}\\s*\\(`).test(content)) {
      problems.push(
        `${route.method.toUpperCase()} ${route.path}: contract test doesn't call the shared ${requiredHelper}() helper`,
      );
    }
  }

  if (problems.length > 0) {
    return { passed: false, summary: problems.join('; ') };
  }
  return {
    passed: true,
    summary: `${routes.length} route(s) registered, ${dataChanging.length} data-changing, all have permission+audit contract tests using the shared helper`,
  };
};
