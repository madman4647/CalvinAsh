const { requireSession, requireRole } = require('./auth/session');

const registry = [];
const VALID_ROLES = ['student', 'cca', 'panelist', 'senate'];

function isValidPermission(permission) {
  if (permission === 'public') return true;
  if (typeof permission === 'string') return VALID_ROLES.includes(permission);
  if (Array.isArray(permission)) return permission.length > 0 && permission.every((r) => VALID_ROLES.includes(r));
  return false;
}

/**
 * Every route in the app must be mounted through defineRoute instead of calling
 * router.get/post/... directly. This is the seam gate check 4 (route contract check)
 * inspects: any route that changes data must declare a permission and an audit event,
 * and must have a matching contract test (see scripts/gate/04-route-contract.js).
 *
 * permission is one of:
 *   - null/omitted   - no auth at all (only the health check should use this)
 *   - 'public'       - open to anyone, but still eligible to be dataChanging
 *                      (login, forgot-password, set-password)
 *   - a role string, or an array of roles - requireSession + requireRole are
 *     attached automatically, so authorization lives in exactly one place.
 */
function defineRoute(router, { method, path, permission = null, dataChanging = false, auditEvent = null }, ...handlers) {
  const normalizedMethod = method.toLowerCase();
  if (permission !== null && !isValidPermission(permission)) {
    throw new Error(`Route ${normalizedMethod.toUpperCase()} ${path} declares an invalid permission: ${JSON.stringify(permission)}`);
  }
  if (dataChanging && !permission) {
    throw new Error(`Route ${normalizedMethod.toUpperCase()} ${path} changes data but declares no permission`);
  }
  if (dataChanging && !auditEvent) {
    throw new Error(`Route ${normalizedMethod.toUpperCase()} ${path} changes data but declares no auditEvent`);
  }

  const authMiddleware = [];
  if (permission && permission !== 'public') {
    authMiddleware.push(requireSession, requireRole(permission));
  }

  registry.push({ method: normalizedMethod, path, permission, dataChanging, auditEvent });
  router[normalizedMethod](path, ...authMiddleware, ...handlers);
}

function getRegisteredRoutes() {
  return registry.slice();
}

module.exports = { defineRoute, getRegisteredRoutes, VALID_ROLES };
