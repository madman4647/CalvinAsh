const { query } = require('../config/db');

async function getSettings(req, res) {
  try {
    const result = await query('SELECT * FROM admin_settings ORDER BY key');
    return res.json(result.rows);
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateSettings(req, res) {
  try {
    const updates = req.body; // { key: value, ... }

    for (const [key, value] of Object.entries(updates)) {
      await query(
        'UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [String(value), key]
      );
    }

    const result = await query('SELECT * FROM admin_settings ORDER BY key');
    return res.json(result.rows);
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getSettings, updateSettings };
