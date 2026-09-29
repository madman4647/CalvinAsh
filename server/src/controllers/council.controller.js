const { query, pool } = require('../config/db');
const { runAllocation: runAllocationService } = require('../services/allocation.service');
const { generateCouncilExcel, generateFlatExcel } = require('../services/excel.service');
const { sendCredentialEmail } = require('../services/email.service');
const ExcelJS = require('exceljs');

async function getDashboard(req, res) {
  try {
    const result = await query(
      `SELECT c.login, c.name, c.type, c.max_candidates, c.deadline,
              COALESCE(app.app_count, 0) as application_count,
              COALESCE(app.selected_count, 0) as selected_count,
              COALESCE(app.waitlisted_count, 0) as waitlisted_count,
              COALESCE(r.avg_rank, 0) as avg_student_rank
       FROM committees c
       LEFT JOIN (
         SELECT committee_login,
                COUNT(*) as app_count,
                COUNT(*) FILTER (WHERE committee_rank = 0) as selected_count,
                COUNT(*) FILTER (WHERE committee_rank > 0) as waitlisted_count
         FROM applications WHERE is_active = true
         GROUP BY committee_login
       ) app ON c.login = app.committee_login
       LEFT JOIN (
         SELECT committee_login,
                ROUND(AVG(rank)::numeric, 2) as avg_rank
         FROM rankings
         GROUP BY committee_login
       ) r ON c.login = r.committee_login
       ORDER BY c.name`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getCommittees(req, res) {
  try {
    const result = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM applications a WHERE a.committee_login = c.login AND a.is_active = true) as application_count
       FROM committees c
       ORDER BY c.name`
    );
    const committees = result.rows.map((c) => {
      delete c.password_hash;
      return c;
    });
    return res.json(committees);
  } catch (err) {
    console.error('getCommittees error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getCommitteeApplications(req, res) {
  try {
    const { login } = req.params;

    const result = await query(
      `SELECT a.pgpid, a.resume_path, a.task, a.is_selected, a.committee_rank,
              a.applied_at, a.updated_at,
              u.name, u.batch, u.email, u.phone
       FROM applications a
       JOIN users u ON a.pgpid = u.pgpid
       WHERE a.committee_login = $1 AND a.is_active = true
       ORDER BY a.applied_at`,
      [login]
    );

    // Fetch answers for each
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
      applicants.push({ ...app, answers: answersResult.rows });
    }

    return res.json(applicants);
  } catch (err) {
    console.error('getCommitteeApplications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getAllApplications(req, res) {
  try {
    const result = await query(
      `SELECT a.pgpid, a.committee_login, a.resume_path, a.task,
              a.is_selected, a.committee_rank, a.applied_at,
              u.name as student_name, u.batch,
              c.name as committee_name, c.type as committee_type
       FROM applications a
       JOIN users u ON a.pgpid = u.pgpid
       JOIN committees c ON a.committee_login = c.login
       WHERE a.is_active = true
       ORDER BY c.name, a.applied_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllApplications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getStudentOverview(req, res) {
  try {
    const { pgpid } = req.params;

    const userResult = await query('SELECT * FROM users WHERE pgpid = $1', [pgpid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const student = userResult.rows[0];
    delete student.password_hash;

    const appsResult = await query(
      `SELECT a.*, c.name as committee_name, c.type as committee_type
       FROM applications a
       JOIN committees c ON a.committee_login = c.login
       WHERE a.pgpid = $1 AND a.is_active = true
       ORDER BY a.applied_at`,
      [pgpid]
    );

    const rankingsResult = await query(
      `SELECT r.committee_login, r.rank, c.name as committee_name
       FROM rankings r
       JOIN committees c ON r.committee_login = c.login
       WHERE r.pgpid = $1
       ORDER BY r.rank`,
      [pgpid]
    );

    const allocationResult = await query(
      `SELECT al.*, c.name as committee_name
       FROM allocations al
       JOIN committees c ON al.committee_login = c.login
       WHERE al.pgpid = $1`,
      [pgpid]
    );

    return res.json({
      student,
      applications: appsResult.rows,
      rankings: rankingsResult.rows,
      allocation: allocationResult.rows.length > 0 ? allocationResult.rows[0] : null,
    });
  } catch (err) {
    console.error('getStudentOverview error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function overrideSelection(req, res) {
  try {
    const { pgpid, committeeLogin } = req.params;
    const { status, waitlistRank, task } = req.body;

    let committeeRank = -1;
    let isSelected = 0;

    if (status === 'selected') {
      committeeRank = 0;
      isSelected = 1;
    } else if (status === 'waitlist') {
      committeeRank = waitlistRank || 1;
      isSelected = 0;
    }

    const updates = ['committee_rank = $1', 'is_selected = $2', 'updated_at = NOW()'];
    const values = [committeeRank, isSelected];
    let paramIndex = 3;

    if (task !== undefined) {
      updates.push(`task = $${paramIndex++}`);
      values.push(task);
    }

    values.push(pgpid, committeeLogin);

    const sql = `UPDATE applications SET ${updates.join(', ')}
                 WHERE pgpid = $${paramIndex++} AND committee_login = $${paramIndex} AND is_active = true
                 RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('overrideSelection error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function runAllocation(req, res) {
  try {
    const results = await runAllocationService();
    return res.json({
      message: 'Allocation completed successfully.',
      allocations: results,
    });
  } catch (err) {
    console.error('runAllocation error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getAllocations(req, res) {
  try {
    const result = await query(
      `SELECT al.*, u.name as student_name, u.batch,
              c.name as committee_name, c.type as committee_type
       FROM allocations al
       JOIN users u ON al.pgpid = u.pgpid
       JOIN committees c ON al.committee_login = c.login
       ORDER BY c.name, al.student_rank`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllocations error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function clearAllocations(req, res) {
  try {
    await query('DELETE FROM allocations');
    return res.json({ message: 'All allocations cleared.' });
  } catch (err) {
    console.error('clearAllocations error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function exportExcel(req, res) {
  try {
    const buffer = await generateCouncilExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="council_report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('exportExcel error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /common-questions — return all rows from common_questions
async function getCommonQuestions(req, res) {
  try {
    const result = await query('SELECT * FROM common_questions ORDER BY id');
    return res.json(result.rows);
  } catch (err) {
    console.error('council getCommonQuestions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// PUT /common-questions — replace all common questions; body: [{ text }] (max 10)
async function updateCommonQuestions(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { questions } = req.body; // Array of { text }

    if (!questions || !Array.isArray(questions)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Questions array is required.' });
    }

    if (questions.length > 10) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Maximum 10 common questions allowed.' });
    }

    await client.query('DELETE FROM common_questions');

    for (const q of questions) {
      await client.query(
        'INSERT INTO common_questions (text) VALUES ($1)',
        [q.text]
      );
    }

    await client.query('COMMIT');

    const result = await query('SELECT * FROM common_questions ORDER BY id');
    return res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateCommonQuestions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
}

// POST /bulk-mail-credentials — send login IDs to users where credential_sent = false
async function bulkMailCredentials(req, res) {
  try {
    const usersResult = await query(
      "SELECT pgpid, email FROM users WHERE credential_sent = false AND email IS NOT NULL AND email != ''"
    );

    const users = usersResult.rows;
    let sent = 0;
    const failures = [];

    for (const user of users) {
      try {
        await sendCredentialEmail(user.email, user.pgpid);
        await query(
          'UPDATE users SET credential_sent = true WHERE pgpid = $1',
          [user.pgpid]
        );
        sent++;
      } catch (mailErr) {
        console.error(`bulkMailCredentials: failed to send to ${user.email}:`, mailErr.message);
        failures.push({ pgpid: user.pgpid, email: user.email, error: mailErr.message });
      }
    }

    return res.json({
      message: `Credentials sent to ${sent} user(s).`,
      sent,
      failures,
    });
  } catch (err) {
    console.error('bulkMailCredentials error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /export/flat-excel — single sheet: PGP ID | Name | Committee | Rank by Student | Rank by Committee
async function exportFlatExcel(req, res) {
  try {
    const buffer = await generateFlatExcel();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="flat_report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('exportFlatExcel error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getDashboard,
  getCommittees,
  getCommitteeApplications,
  getAllApplications,
  getStudentOverview,
  overrideSelection,
  runAllocation,
  getAllocations,
  clearAllocations,
  exportExcel,
  getCommonQuestions,
  updateCommonQuestions,
  bulkMailCredentials,
  exportFlatExcel,
};
