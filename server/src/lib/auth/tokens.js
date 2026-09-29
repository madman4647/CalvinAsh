const crypto = require('crypto');

/** A raw, URL-safe token to hand to the client (cookie value, or set-password link). */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Only this hash is ever stored - the raw token can't be recovered from a DB leak. */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { generateToken, hashToken };
