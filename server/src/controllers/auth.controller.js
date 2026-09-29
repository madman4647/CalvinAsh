const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { detectRole } = require('../utils/roleDetector');
const { sendPasswordEmail } = require('../services/email.service');

async function login(req, res) {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Login ID and password are required.' });
    }

    const role = detectRole(loginId);
    let user = null;

    if (role === 'student') {
      const result = await query(
        'SELECT pgpid, password_hash, name FROM users WHERE pgpid = $1',
        [loginId]
      );
      if (result.rows.length > 0) {
        user = {
          loginId: result.rows[0].pgpid,
          passwordHash: result.rows[0].password_hash,
          name: result.rows[0].name,
        };
      }
    } else if (role === 'committee') {
      const result = await query(
        'SELECT login, password_hash, name FROM committees WHERE login = $1',
        [loginId]
      );
      if (result.rows.length > 0) {
        user = {
          loginId: result.rows[0].login,
          passwordHash: result.rows[0].password_hash,
          name: result.rows[0].name,
        };
      }
    } else if (role === 'council') {
      const result = await query(
        'SELECT login, password_hash, name FROM council_users WHERE login = $1',
        [loginId.toLowerCase()]
      );
      if (result.rows.length > 0) {
        user = {
          loginId: result.rows[0].login,
          passwordHash: result.rows[0].password_hash,
          name: result.rows[0].name,
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid login ID or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login ID or password.' });
    }

    const token = jwt.sign(
      { loginId: user.loginId, role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      token,
      role,
      name: user.name,
      loginId: user.loginId,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { pgpid } = req.body;

    if (!pgpid) {
      return res.status(400).json({ error: 'PGP ID is required.' });
    }

    const result = await query(
      'SELECT pgpid, email, name FROM users WHERE pgpid = $1',
      [pgpid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const student = result.rows[0];

    if (!student.email) {
      return res.status(400).json({ error: 'No email address on file for this student.' });
    }

    // Generate random 8-character password
    const newPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE pgpid = $2',
      [hash, pgpid]
    );

    await sendPasswordEmail(student.email, newPassword);

    return res.json({ message: 'A new password has been sent to your registered email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { login, forgotPassword };
