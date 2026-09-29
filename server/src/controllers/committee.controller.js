const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const ExcelJS = require('exceljs');
const { query, pool } = require('../config/db');
const { generateCommitteeExcel } = require('../services/excel.service');

async function getProfile(req, res) {
  try {
    const result = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM applications a WHERE a.committee_login = c.login AND a.is_active = true) as application_count
       FROM committees c
       WHERE c.login = $1`,
      [req.user.loginId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const profile = result.rows[0];
    delete profile.password_hash;
    return res.json(profile);
  } catch (err) {
    console.error('committee getProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateProfile(req, res) {
  try {
    const login = req.user.loginId;
    const { deadline, max_candidates, is_resume_required, name } = req.body;

    let presentationPath = undefined;
    if (req.file) {
      presentationPath = path.join('presentations', req.file.filename);
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (deadline !== undefined) {
      updates.push(`deadline = $${paramIndex++}`);
      values.push(deadline);
    }
    if (max_candidates !== undefined) {
      updates.push(`max_candidates = $${paramIndex++}`);
      values.push(parseInt(max_candidates, 10));
    }
    if (is_resume_required !== undefined) {
      updates.push(`is_resume_required = $${paramIndex++}`);
      values.push(is_resume_required === 'true' || is_resume_required === true);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (presentationPath !== undefined) {
      updates.push(`presentation_path = $${paramIndex++}`);
      values.push(presentationPath);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(login);

    const sql = `UPDATE committees SET ${updates.join(', ')} WHERE login = $${paramIndex} RETURNING *`;
    const result = await query(sql, values);

    const profile = result.rows[0];
    delete profile.password_hash;
    return res.json(profile);
  } catch (err) {
    console.error('committee updateProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getQuestions(req, res) {
  try {
    const result = await query(
      `SELECT id, question_order, question_text
       FROM committee_questions
       WHERE committee_login = $1
       ORDER BY question_order`,
      [req.user.loginId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getQuestions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateQuestions(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const login = req.user.loginId;
    const { questions } = req.body; // Array of { order, text }

    if (!questions || !Array.isArray(questions)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Questions array is required.' });
    }

    if (questions.length > 10) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Maximum 10 questions allowed.' });
    }

    // Delete existing questions
    await client.query('DELETE FROM committee_questions WHERE committee_login = $1', [login]);

    // Insert new questions
    for (const q of questions) {
      await client.query(
        `INSERT INTO committee_questions (committee_login, question_order, question_text)
         VALUES ($1, $2, $3)`,
        [login, q.order, q.text]
      );
    }

    await client.query('COMMIT');
    return res.json({ message: 'Questions updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateQuestions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

async function getApplications(req, res) {
  try {
    const login = req.user.loginId;

    const result = await query(
      `SELECT a.pgpid, a.resume_path, a.task, a.is_selected, a.committee_rank,
              a.applied_at, a.updated_at,
              u.name, u.batch, u.email, u.phone, u.mobile
       FROM applications a
       JOIN users u ON a.pgpid = u.pgpid
       WHERE a.committee_login = $1 AND a.is_active = true
       ORDER BY a.applied_at`,
      [login]
    );

    // Fetch answers for each applicant
    const applicants = [];
    for (const app of result.rows) {
      const answersResult = await query(
        `SELECT aa.question_id, aa.answer, cq.question_text, cq.question_order
         FROM application_answers aa
         JOIN committee_questions cq ON aa.question_id = cq.id
         WHERE aa.pgpid = $1 AND aa.committee_login = $2
         ORDER BY cq.question_order`,
        [app.pgpid, login]
      );
      applicants.push({
        ...app,
        answers: answersResult.rows,
      });
    }

    return res.json(applicants);
  } catch (err) {
    console.error('committee getApplications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getApplicantDetail(req, res) {
  try {
    const login = req.user.loginId;
    const { pgpid } = req.params;

    // Get student profile
    const userResult = await query(
      'SELECT * FROM users WHERE pgpid = $1',
      [pgpid]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const student = userResult.rows[0];
    delete student.password_hash;

    // Get application
    const appResult = await query(
      `SELECT * FROM applications
       WHERE pgpid = $1 AND committee_login = $2 AND is_active = true`,
      [pgpid, login]
    );
    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Get answers
    const answersResult = await query(
      `SELECT aa.question_id, aa.answer, cq.question_text, cq.question_order
       FROM application_answers aa
       JOIN committee_questions cq ON aa.question_id = cq.id
       WHERE aa.pgpid = $1 AND aa.committee_login = $2
       ORDER BY cq.question_order`,
      [pgpid, login]
    );

    return res.json({
      student,
      application: appResult.rows[0],
      answers: answersResult.rows,
    });
  } catch (err) {
    console.error('getApplicantDetail error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateSelection(req, res) {
  try {
    const login = req.user.loginId;
    const { pgpid } = req.params;
    const { status, waitlistRank, task } = req.body;

    let committeeRank = -1;
    let isSelected = 0;

    if (status === 'selected') {
      committeeRank = 0;
      isSelected = 1;
    } else if (status === 'waitlist') {
      committeeRank = waitlistRank || 1;
      isSelected = 0;
    } else if (status === 'rejected') {
      committeeRank = -1;
      isSelected = 0;
    }

    const updates = [
      'committee_rank = $1',
      'is_selected = $2',
      'updated_at = NOW()',
    ];
    const values = [committeeRank, isSelected];
    let paramIndex = 3;

    if (task !== undefined) {
      updates.push(`task = $${paramIndex++}`);
      values.push(task);
    }

    values.push(pgpid, login);

    const sql = `UPDATE applications SET ${updates.join(', ')}
                 WHERE pgpid = $${paramIndex++} AND committee_login = $${paramIndex} AND is_active = true
                 RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('updateSelection error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function bulkSelection(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const login = req.user.loginId;
    const { selections } = req.body; // Array of { pgpid, status, waitlistRank?, task? }

    if (!selections || !Array.isArray(selections)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Selections array is required.' });
    }

    const results = [];
    for (const sel of selections) {
      let committeeRank = -1;
      let isSelected = 0;

      if (sel.status === 'selected') {
        committeeRank = 0;
        isSelected = 1;
      } else if (sel.status === 'waitlist') {
        committeeRank = sel.waitlistRank || 1;
        isSelected = 0;
      }

      const updates = ['committee_rank = $1', 'is_selected = $2', 'updated_at = NOW()'];
      const values = [committeeRank, isSelected];
      let paramIndex = 3;

      if (sel.task !== undefined) {
        updates.push(`task = $${paramIndex++}`);
        values.push(sel.task);
      }

      values.push(sel.pgpid, login);

      const sql = `UPDATE applications SET ${updates.join(', ')}
                   WHERE pgpid = $${paramIndex++} AND committee_login = $${paramIndex} AND is_active = true
                   RETURNING *`;

      const result = await client.query(sql, values);
      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    await client.query('COMMIT');
    return res.json({ updated: results.length, results });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('bulkSelection error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

async function exportExcel(req, res) {
  try {
    const login = req.user.loginId;
    const buffer = await generateCommitteeExcel(login);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${login}_applications.xlsx"`);
    return res.send(buffer);
  } catch (err) {
    console.error('exportExcel error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function exportResumes(req, res) {
  try {
    const login = req.user.loginId;

    const result = await query(
      `SELECT pgpid, resume_path FROM applications
       WHERE committee_login = $1 AND is_active = true AND resume_path IS NOT NULL`,
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No resumes found.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${login}_resumes.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

    for (const row of result.rows) {
      const filePath = path.join(uploadsDir, row.resume_path);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `${row.pgpid}.pdf` });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('exportResumes error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function exportContacts(req, res) {
  try {
    const login = req.user.loginId;

    const result = await query(
      `SELECT u.pgpid, u.name, u.iiml_room, u.mobile
       FROM applications a
       JOIN users u ON a.pgpid = u.pgpid
       WHERE a.committee_login = $1 AND a.is_active = true
       ORDER BY u.name`,
      [login]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Calvin CCA Platform';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Contacts');

    sheet.addRow(['PGP ID', 'Name', 'Room No', 'Mobile']);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    for (const row of result.rows) {
      sheet.addRow([row.pgpid, row.name, row.iiml_room || '', row.mobile || '']);
    }

    sheet.columns.forEach((col) => { col.width = 20; });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${login}_contacts.xlsx"`);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('exportContacts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getQuestions,
  updateQuestions,
  getApplications,
  getApplicantDetail,
  updateSelection,
  bulkSelection,
  exportExcel,
  exportResumes,
  exportContacts,
};
