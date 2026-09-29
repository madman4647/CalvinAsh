const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Module-level cache for admin_settings (refreshed every 30 seconds)
const settingsCache = { data: null, ts: 0 };

async function refreshSettingsCache() {
  try {
    const result = await query('SELECT key, value FROM admin_settings');
    const data = {};
    for (const row of result.rows) {
      data[row.key] = row.value;
    }
    settingsCache.data = data;
    settingsCache.ts = Date.now();
  } catch (err) {
    // If admin_settings table is unavailable, keep old cache (or null)
    console.error('auth: failed to refresh admin_settings cache:', err.message);
  }
}

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      loginId: decoded.loginId,
      role: decoded.role,
      name: decoded.name,
    };

    // Council is never blocked; only check for student and committee roles
    if (req.user.role === 'student' || req.user.role === 'committee') {
      // Refresh cache if stale (> 30 seconds old) or empty
      if (!settingsCache.data || (Date.now() - settingsCache.ts) > 30000) {
        await refreshSettingsCache();
      }

      if (settingsCache.data) {
        if (req.user.role === 'student') {
          if (settingsCache.data['student_access_enabled'] === 'false') {
            return res.status(403).json({
              error: 'Access is currently closed for students. Please check back later.',
            });
          }
        } else if (req.user.role === 'committee') {
          if (settingsCache.data['committee_access_enabled'] === 'false') {
            return res.status(403).json({
              error: 'Access is currently closed for committees. Please check back later.',
            });
          }
        }
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { auth };
