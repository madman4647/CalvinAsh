const { createApp } = require('../src/app');
const { getRegisteredRoutes } = require('../src/lib/routeRegistry');

describe('route registry contract', () => {
  it('registers every mounted route through defineRoute', () => {
    createApp();
    const routes = getRegisteredRoutes();
    expect(routes.length).toBeGreaterThan(0);
  });

  it('requires a permission and an auditEvent on every data-changing route', () => {
    createApp();
    const routes = getRegisteredRoutes();
    for (const route of routes.filter((r) => r.dataChanging)) {
      expect(route.permission, `${route.method.toUpperCase()} ${route.path} needs a permission`).toBeTruthy();
      expect(route.auditEvent, `${route.method.toUpperCase()} ${route.path} needs an auditEvent`).toBeTruthy();
    }
  });
});
