const fs = require('fs');
const path = require('path');
const { createApp } = require('../../server/src/app');
const { getRegisteredRoutes } = require('../../server/src/lib/routeRegistry');

const CONTRACT_TEST_DIR = path.resolve(__dirname, '../../server/test/contract');

function slug(route) {
  return `${route.method}-${route.path}`.replace(/[/:]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Every data-changing route must declare a permission + auditEvent (enforced at
 * registration time by routeRegistry.defineRoute) AND have a contract test at
 * server/test/contract/<method>-<path>.test.js that asserts a wrong role is
 * refused and that an audit row is written. Loop 0 registers zero data-changing
 * routes, so this passes now with nothing to enforce - but Loop 1's first POST
 * route is forced through this exact check.
 */
module.exports = async function routeContractCheck() {
  // Routes register themselves once, at module require-time (see
  // routeRegistry.js) - calling createApp() here just guarantees that has
  // happened before we read the registry.
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
    if (!/refus/i.test(content)) {
      problems.push(`${route.method.toUpperCase()} ${route.path}: contract test doesn't assert a wrong-role refusal`);
    }
    if (!/audit/i.test(content)) {
      problems.push(`${route.method.toUpperCase()} ${route.path}: contract test doesn't assert an audit row is written`);
    }
  }

  if (problems.length > 0) {
    return { passed: false, summary: problems.join('; ') };
  }
  return {
    passed: true,
    summary: `${routes.length} route(s) registered, ${dataChanging.length} data-changing, all have permission+audit contract tests`,
  };
};
