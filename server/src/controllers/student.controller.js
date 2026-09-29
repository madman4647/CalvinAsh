const path = require('path');
const { query, pool } = require('../config/db');

// Helper: fetch a single admin_settings value
async function getAdminSetting(client, key, defaultValue) {
  try {
    const result = client
      ? await client.query('SELECT value FROM admin_settings WHERE key = $1', [key])
      : await query('SELECT value FROM admin_settings WHERE key = $1', [key]);
    return result.rows.length > 0 ? result.rows[0].value : defaultValue;
  } catch (_err) {
    return defaultValue;
  }
}

async function getProfile(req, res) {
  try {
    const result = await query(
      'SELECT * FROM users WHERE pgpid = $1',
      [req.user.loginId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    const profile = result.rows[0];
    delete profile.password_hash;
    return res.json(profile);
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateProfile(req, res) {
  try {
    const allowedFields = [
      'fname', 'mname', 'lname', 'name', 'gender', 'dob', 'marital_status',
      'about_me', 'address', 'city', 'pincode', 'state', 'country',
      'phone', 'mobile', 'email', 'iiml_room',
      'cat_score', 'tenth_cgpa', 'twelfth_cgpa',
      'grad_college', 'grad_degree', 'grad_specialization', 'grad_cgpa',
      'postgrad_college', 'postgrad_degree', 'postgrad_specialization', 'postgrad_cgpa',
      'workex_duration', 'workex_functional_area', 'workex_awards',
      'area_of_interest', 'certification',
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.loginId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE pgpid = $${paramIndex} RETURNING *`;
    const result = await query(sql, values);

    const profile = result.rows[0];
    delete profile.password_hash;
    return res.json(profile);
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /ccas — excludes hostel type
async function getCCAs(req, res) {
  try {
    const result = await query(
      `SELECT login, name, type, is_resume_required, deadline,
              presentation_path, max_candidates
       FROM committees
       WHERE type != 'hostel'
       ORDER BY name`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getCCAs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /hostel/ccas — returns only hostel type committees
async function getHostelCCAs(req, res) {
  try {
    const result = await query(
      `SELECT login, name, type, is_resume_required, deadline,
              presentation_path, max_candidates
       FROM committees
       WHERE type = 'hostel'
       ORDER BY name`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getHostelCCAs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getCCADetail(req, res) {
  try {
    const { login } = req.params;

    const committeeResult = await query(
      `SELECT login, name, type, is_resume_required, deadline,
              presentation_path, max_candidates
       FROM committees WHERE login = $1`,
      [login]
    );

    if (committeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const questionsResult = await query(
      `SELECT id, question_order, question_text
       FROM committee_questions
       WHERE committee_login = $1
       ORDER BY question_order`,
      [login]
    );

    return res.json({
      ...committeeResult.rows[0],
      questions: questionsResult.rows,
    });
  } catch (err) {
    console.error('getCCADetail error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /apply/:committeeLogin — apply to a regular (non-hostel) CCA
async function apply(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pgpid = req.user.loginId;
    const { committeeLogin } = req.params;
    const { answers } = req.body;

    // Read admin settings
    const maxApplications = parseInt(await getAdminSetting(client, 'max_applications', '4'), 10);
    const graceSeconds = parseInt(await getAdminSetting(client, 'deadline_grace_seconds', '0'), 10);

    // Check committee exists and deadline
    const committeeResult = await client.query(
      'SELECT login, name, type, deadline, is_resume_required FROM committees WHERE login = $1',
      [committeeLogin]
    );
    if (committeeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const committee = committeeResult.rows[0];

    // Check deadline with grace period
    if (committee.deadline) {
      const effectiveDeadline = new Date(committee.deadline).getTime() + graceSeconds * 1000;
      if (effectiveDeadline < Date.now()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Application deadline has passed.' });
      }
    }

    // Check max applications (non-hostel only)
    const appCountResult = await client.query(
      `SELECT COUNT(*) as count FROM applications a
       JOIN committees c ON a.committee_login = c.login
       WHERE a.pgpid = $1 AND a.is_active = true AND c.type != 'hostel'`,
      [pgpid]
    );
    if (parseInt(appCountResult.rows[0].count, 10) >= maxApplications) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Maximum of ${maxApplications} applications allowed.` });
    }

    // Check duplicate application
    const existingApp = await client.query(
      'SELECT id FROM applications WHERE pgpid = $1 AND committee_login = $2 AND is_active = true',
      [pgpid, committeeLogin]
    );
    if (existingApp.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already applied to this committee.' });
    }

    // Committee-or-AIG exclusivity check
    if (committee.type === 'committee' || committee.type === 'aig') {
      const exclusiveType = committee.type === 'committee' ? 'aig' : 'committee';
      const exclusiveCheck = await client.query(
        `SELECT a.id FROM applications a
         JOIN committees c ON a.committee_login = c.login
         WHERE a.pgpid = $1 AND a.is_active = true AND c.type = $2`,
        [pgpid, exclusiveType]
      );
      if (exclusiveCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `You cannot apply to a ${committee.type} because you have already applied to a ${exclusiveType}. Clubs are unrestricted.`,
        });
      }
    }

    // Handle resume path
    let resumePath = null;
    if (req.file) {
      resumePath = path.join('resumes', committeeLogin, req.file.filename);
    }

    // Insert application
    const appResult = await client.query(
      `INSERT INTO applications (pgpid, committee_login, resume_path, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [pgpid, committeeLogin, resumePath]
    );

    // Insert answers
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
    if (parsedAnswers && Array.isArray(parsedAnswers)) {
      for (const ans of parsedAnswers) {
        await client.query(
          `INSERT INTO application_answers (pgpid, committee_login, question_id, answer)
           VALUES ($1, $2, $3, $4)`,
          [pgpid, committeeLogin, ans.questionId, ans.answer]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json(appResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('apply error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

// POST /hostel/apply/:committeeLogin — apply to a hostel committee
async function applyToHostel(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pgpid = req.user.loginId;
    const { committeeLogin } = req.params;
    const { answers } = req.body;

    // Read admin settings
    const maxHostelApplications = parseInt(
      await getAdminSetting(client, 'max_hostel_applications', '10'), 10
    );
    const graceSeconds = parseInt(await getAdminSetting(client, 'deadline_grace_seconds', '0'), 10);

    // Check committee exists and is hostel type
    const committeeResult = await client.query(
      'SELECT login, name, type, deadline, is_resume_required FROM committees WHERE login = $1',
      [committeeLogin]
    );
    if (committeeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const committee = committeeResult.rows[0];

    if (committee.type !== 'hostel') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This endpoint is only for hostel applications.' });
    }

    // Check deadline with grace period
    if (committee.deadline) {
      const effectiveDeadline = new Date(committee.deadline).getTime() + graceSeconds * 1000;
      if (effectiveDeadline < Date.now()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Application deadline has passed.' });
      }
    }

    // Check max hostel applications
    const appCountResult = await client.query(
      `SELECT COUNT(*) as count FROM applications a
       JOIN committees c ON a.committee_login = c.login
       WHERE a.pgpid = $1 AND a.is_active = true AND c.type = 'hostel'`,
      [pgpid]
    );
    if (parseInt(appCountResult.rows[0].count, 10) >= maxHostelApplications) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Maximum of ${maxHostelApplications} hostel applications allowed.`,
      });
    }

    // Check duplicate application
    const existingApp = await client.query(
      'SELECT id FROM applications WHERE pgpid = $1 AND committee_login = $2 AND is_active = true',
      [pgpid, committeeLogin]
    );
    if (existingApp.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already applied to this hostel.' });
    }

    // Handle resume path
    let resumePath = null;
    if (req.file) {
      resumePath = path.join('resumes', committeeLogin, req.file.filename);
    }

    // Insert application
    const appResult = await client.query(
      `INSERT INTO applications (pgpid, committee_login, resume_path, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [pgpid, committeeLogin, resumePath]
    );

    // Insert answers
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
    if (parsedAnswers && Array.isArray(parsedAnswers)) {
      for (const ans of parsedAnswers) {
        await client.query(
          `INSERT INTO application_answers (pgpid, committee_login, question_id, answer)
           VALUES ($1, $2, $3, $4)`,
          [pgpid, committeeLogin, ans.questionId, ans.answer]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json(appResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('applyToHostel error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

// GET /applications — returns { regular: [...], hostel: [...] }
async function getApplications(req, res) {
  try {
    const result = await query(
      `SELECT a.*, c.name as committee_name, c.type as committee_type
       FROM applications a
       JOIN committees c ON a.committee_login = c.login
       WHERE a.pgpid = $1 AND a.is_active = true
       ORDER BY a.applied_at DESC`,
      [req.user.loginId]
    );

    const regular = result.rows.filter((r) => r.committee_type !== 'hostel');
    const hostel = result.rows.filter((r) => r.committee_type === 'hostel');

    return res.json({ regular, hostel });
  } catch (err) {
    console.error('getApplications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getApplicationDetail(req, res) {
  try {
    const { committeeLogin } = req.params;

    const appResult = await query(
      `SELECT a.*, c.name as committee_name, c.type as committee_type
       FROM applications a
       JOIN committees c ON a.committee_login = c.login
       WHERE a.pgpid = $1 AND a.committee_login = $2 AND a.is_active = true`,
      [req.user.loginId, committeeLogin]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const answersResult = await query(
      `SELECT aa.question_id, aa.answer, cq.question_text, cq.question_order
       FROM application_answers aa
       JOIN committee_questions cq ON aa.question_id = cq.id
       WHERE aa.pgpid = $1 AND aa.committee_login = $2
       ORDER BY cq.question_order`,
      [req.user.loginId, committeeLogin]
    );

    return res.json({
      ...appResult.rows[0],
      answers: answersResult.rows,
    });
  } catch (err) {
    console.error('getApplicationDetail error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateApplication(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { committeeLogin } = req.params;
    const { answers } = req.body;
    const pgpid = req.user.loginId;

    // Check app exists
    const appResult = await client.query(
      'SELECT id FROM applications WHERE pgpid = $1 AND committee_login = $2 AND is_active = true',
      [pgpid, committeeLogin]
    );
    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Update answers
    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        await client.query(
          `INSERT INTO application_answers (pgpid, committee_login, question_id, answer)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (pgpid, committee_login, question_id)
           DO UPDATE SET answer = $4`,
          [pgpid, committeeLogin, ans.questionId, ans.answer]
        );
      }
    }

    await client.query(
      'UPDATE applications SET updated_at = NOW() WHERE pgpid = $1 AND committee_login = $2',
      [pgpid, committeeLogin]
    );

    await client.query('COMMIT');
    return res.json({ message: 'Application updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateApplication error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

// PUT /applications/:committeeLogin/resume — update resume for an existing application
async function updateApplicationResume(req, res) {
  try {
    const { committeeLogin } = req.params;
    const pgpid = req.user.loginId;

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided.' });
    }

    // Read deadline with grace period
    const graceSeconds = parseInt(await getAdminSetting(null, 'deadline_grace_seconds', '0'), 10);

    const committeeResult = await query(
      'SELECT deadline FROM committees WHERE login = $1',
      [committeeLogin]
    );
    if (committeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const { deadline } = committeeResult.rows[0];
    if (deadline) {
      const effectiveDeadline = new Date(deadline).getTime() + graceSeconds * 1000;
      if (effectiveDeadline < Date.now()) {
        return res.status(400).json({ error: 'Application deadline has passed.' });
      }
    }

    const resumePath = path.join('resumes', committeeLogin, req.file.filename);

    const result = await query(
      `UPDATE applications SET resume_path = $1, updated_at = NOW()
       WHERE pgpid = $2 AND committee_login = $3 AND is_active = true
       RETURNING *`,
      [resumePath, pgpid, committeeLogin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateApplicationResume error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function withdrawApplication(req, res) {
  try {
    const { committeeLogin } = req.params;

    const result = await query(
      `UPDATE applications SET is_active = false, updated_at = NOW()
       WHERE pgpid = $1 AND committee_login = $2 AND is_active = true
       RETURNING *`,
      [req.user.loginId, committeeLogin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json({ message: 'Application withdrawn successfully.' });
  } catch (err) {
    console.error('withdrawApplication error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getRankings(req, res) {
  try {
    // Check ranking_enabled setting
    const rankingEnabled = await getAdminSetting(null, 'ranking_enabled', 'true');
    if (rankingEnabled === 'false') {
      return res.status(403).json({ error: 'Ranking is not yet open.' });
    }

    const result = await query(
      `SELECT r.committee_login, r.rank, c.name as committee_name, c.type as committee_type
       FROM rankings r
       JOIN committees c ON r.committee_login = c.login
       WHERE r.pgpid = $1
       ORDER BY r.rank`,
      [req.user.loginId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getRankings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateRankings(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check ranking_enabled setting
    const rankingEnabled = await getAdminSetting(client, 'ranking_enabled', 'true');
    if (rankingEnabled === 'false') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Ranking is not yet open.' });
    }

    const pgpid = req.user.loginId;
    const { rankings } = req.body;

    if (!rankings || !Array.isArray(rankings)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Rankings array is required.' });
    }

    // Delete existing rankings
    await client.query('DELETE FROM rankings WHERE pgpid = $1', [pgpid]);

    // Insert new rankings
    for (const r of rankings) {
      await client.query(
        'INSERT INTO rankings (pgpid, committee_login, rank) VALUES ($1, $2, $3)',
        [pgpid, r.committeeLogin, r.rank]
      );
    }

    await client.query('COMMIT');
    return res.json({ message: 'Rankings updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateRankings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

async function getCommonQuestions(req, res) {
  try {
    const questionsResult = await query('SELECT * FROM common_questions ORDER BY id');

    const answersResult = await query(
      'SELECT question_id, answer FROM common_answers WHERE pgpid = $1',
      [req.user.loginId]
    );

    const answersMap = {};
    for (const a of answersResult.rows) {
      answersMap[a.question_id] = a.answer;
    }

    const questions = questionsResult.rows.map((q) => ({
      ...q,
      answer: answersMap[q.id] || null,
    }));

    return res.json(questions);
  } catch (err) {
    console.error('getCommonQuestions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// PUT /common-answers — also handles general_resume_path upload if file provided
async function updateCommonAnswers(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pgpid = req.user.loginId;
    const { answers } = req.body;

    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        await client.query(
          `INSERT INTO common_answers (pgpid, question_id, answer)
           VALUES ($1, $2, $3)
           ON CONFLICT (pgpid, question_id)
           DO UPDATE SET answer = $3`,
          [pgpid, ans.questionId, ans.answer]
        );
      }
    }

    // Handle general resume upload
    if (req.file) {
      const generalResumePath = path.join('resumes', 'general', req.file.filename);
      await client.query(
        'UPDATE users SET general_resume_path = $1, updated_at = NOW() WHERE pgpid = $2',
        [generalResumePath, pgpid]
      );
    }

    await client.query('COMMIT');
    return res.json({ message: 'Common answers updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateCommonAnswers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

async function getAllocation(req, res) {
  try {
    const result = await query(
      `SELECT al.*, c.name as committee_name, c.type as committee_type
       FROM allocations al
       JOIN committees c ON al.committee_login = c.login
       WHERE al.pgpid = $1`,
      [req.user.loginId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('getAllocation error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getCCAs,
  getHostelCCAs,
  getCCADetail,
  apply,
  applyToHostel,
  getApplications,
  getApplicationDetail,
  updateApplication,
  updateApplicationResume,
  withdrawApplication,
  getRankings,
  updateRankings,
  getCommonQuestions,
  updateCommonAnswers,
  getAllocation,
};
