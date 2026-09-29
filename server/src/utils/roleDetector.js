function detectRole(loginId) {
  if (/^(pgp|abm|fpm)/i.test(loginId)) return 'student';
  if (['council', 'admin', 'senate'].includes(loginId.toLowerCase())) return 'council';
  return 'committee';
}

module.exports = { detectRole };
