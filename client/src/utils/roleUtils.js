/**
 * Detect user role from loginId format.
 * - Council: starts with 'council' (case-insensitive)
 * - Committee: starts with 'comm' (case-insensitive)
 * - Student: PGP ID format (e.g., PGP40001) or default
 */
export function detectRole(loginId) {
  if (!loginId) return 'student';
  const id = loginId.toLowerCase();
  if (id.startsWith('council')) return 'council';
  if (id.startsWith('comm')) return 'committee';
  return 'student';
}

/**
 * Get the base path for a given role.
 */
export function getRoleBasePath(role) {
  switch (role) {
    case 'council':
      return '/council';
    case 'committee':
      return '/committee';
    case 'student':
    default:
      return '/student';
  }
}
