const registry = [];

/**
 * Every route in the app must be mounted through defineRoute instead of calling
 * router.get/post/... directly. This is the seam gate check 4 (route contract check)
 * inspects: any route that changes data must declare a permission and an audit event,
 * and must have a matching contract test (see scripts/gate/04-route-contract.js).
 */
function defineRoute(router, { method, path, permission = null, dataChanging = false, auditEvent = null }, ...handlers) {
  const normalizedMethod = method.toLowerCase();
  if (dataChanging && !permission) {
    throw new Error(`Route ${normalizedMethod.toUpperCase()} ${path} changes data but declares no permission`);
  }
  if (dataChanging && !auditEvent) {
    throw new Error(`Route ${normalizedMethod.toUpperCase()} ${path} changes data but declares no auditEvent`);
  }
  registry.push({ method: normalizedMethod, path, permission, dataChanging, auditEvent });
  router[normalizedMethod](path, ...handlers);
}

function getRegisteredRoutes() {
  return registry.slice();
}

module.exports = { defineRoute, getRegisteredRoutes };
