const ExcelJS = require('exceljs');
const { query } = require('../config/db');

async function generateCommitteeExcel(committeeLogin) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Calvin CCA Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Applicants');

  // Get committee questions to build dynamic headers
  const questionsResult = await query(
    `SELECT id, question_order, question_text
     FROM committee_questions
     WHERE committee_login = $1
     ORDER BY question_order`,
    [committeeLogin]
  );

  const questions = questionsResult.rows;

  // Build header row
  const headers = [
    'Student ID', 'Name', 'Batch', 'Email', 'Phone',
  ];
  for (const q of questions) {
    headers.push(`Q${q.question_order}`);
  }
  headers.push('Task', 'Selection Status', 'Committee Rank');

  sheet.addRow(headers);

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Get applications
  const appsResult = await query(
    `SELECT a.pgpid, a.task, a.is_selected, a.committee_rank,
            u.name, u.batch, u.email, u.phone
     FROM applications a
     JOIN users u ON a.pgpid = u.pgpid
     WHERE a.committee_login = $1 AND a.is_active = true
     ORDER BY u.name`,
    [committeeLogin]
  );

  for (const app of appsResult.rows) {
    // Get answers for this applicant
    const answersResult = await query(
      `SELECT question_id, answer
       FROM application_answers
       WHERE pgpid = $1 AND committee_login = $2`,
      [app.pgpid, committeeLogin]
    );

    const answersMap = {};
    for (const a of answersResult.rows) {
      answersMap[a.question_id] = a.answer;
    }

    const row = [
      app.pgpid,
      app.name,
      app.batch,
      app.email,
      app.phone,
    ];

    for (const q of questions) {
      row.push(answersMap[q.id] || '');
    }

    let status = 'Pending';
    if (app.committee_rank === 0) status = 'Selected';
    else if (app.committee_rank > 0) status = `Waitlist (${app.committee_rank})`;
    else if (app.committee_rank === -1) status = 'Pending';

    row.push(app.task || '', status, app.committee_rank);
    sheet.addRow(row);
  }

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    column.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateCouncilExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Calvin CCA Platform';
  workbook.created = new Date();

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
  };

  function applyHeaderStyle(row) {
    row.font = headerStyle.font;
    row.fill = headerStyle.fill;
  }

  // ---- Sheet 1: Selected Applications ----
  // S.No | PGP ID | Name | Committee | Rank by Student | Rank by Committee
  // Filter: active applications with committee_rank > -1, grouped by committee then student
  const sheet1 = workbook.addWorksheet('Selected Applications');
  sheet1.addRow(['S.No', 'PGP ID', 'Name', 'Committee', 'Rank by Student', 'Rank by Committee']);
  applyHeaderStyle(sheet1.getRow(1));

  const selectedResult = await query(
    `SELECT a.pgpid, a.committee_login, a.committee_rank,
            u.name, c.name as committee_name,
            r.rank as student_rank
     FROM applications a
     JOIN users u ON a.pgpid = u.pgpid
     JOIN committees c ON a.committee_login = c.login
     LEFT JOIN rankings r ON r.pgpid = a.pgpid AND r.committee_login = a.committee_login
     WHERE a.is_active = true AND a.committee_rank > -1
     ORDER BY c.name, u.name`
  );

  let sno = 1;
  for (const row of selectedResult.rows) {
    sheet1.addRow([
      sno++,
      row.pgpid,
      row.name,
      row.committee_name,
      row.student_rank || '',
      row.committee_rank,
    ]);
  }

  // ---- Sheet 2: Students who have ranked ----
  // PGP ID | Name | Committee 1 | Student Rank 1 | Committee Rank 1 | ... (up to 5)
  // Only students who are selected (is_selected=1) with rankings
  const MAX_COLS = 5;
  const sheet2 = workbook.addWorksheet('Students who have ranked');
  const s2Headers = ['PGP ID', 'Name'];
  for (let i = 1; i <= MAX_COLS; i++) {
    s2Headers.push(`Committee ${i}`, `Student Rank ${i}`, `Committee Rank ${i}`);
  }
  sheet2.addRow(s2Headers);
  applyHeaderStyle(sheet2.getRow(1));

  // Get selected students (is_selected=1) who have ranked
  const selectedStudentsResult = await query(
    `SELECT DISTINCT u.pgpid, u.name
     FROM applications a
     JOIN users u ON a.pgpid = u.pgpid
     WHERE a.is_active = true AND a.is_selected = 1
     AND EXISTS (SELECT 1 FROM rankings r WHERE r.pgpid = a.pgpid)
     ORDER BY u.name`
  );

  for (const student of selectedStudentsResult.rows) {
    const appsResult = await query(
      `SELECT a.committee_login, a.committee_rank, r.rank as student_rank,
              c.name as committee_name
       FROM applications a
       JOIN committees c ON a.committee_login = c.login
       LEFT JOIN rankings r ON r.pgpid = a.pgpid AND r.committee_login = a.committee_login
       WHERE a.pgpid = $1 AND a.is_active = true
       ORDER BY r.rank NULLS LAST, c.name`,
      [student.pgpid]
    );

    const rowData = [student.pgpid, student.name];
    for (let i = 0; i < MAX_COLS; i++) {
      const app = appsResult.rows[i];
      if (app) {
        rowData.push(app.committee_name, app.student_rank || '', app.committee_rank);
      } else {
        rowData.push('', '', '');
      }
    }
    sheet2.addRow(rowData);
  }

  // ---- Sheet 3: Applications grouped by student ----
  // PGP ID | Name | Committee 1 | Student Rank 1 | Committee Rank 1 | ... (up to 5)
  // ALL active applications, one row per student
  const sheet3 = workbook.addWorksheet('Applications grouped by student');
  const s3Headers = ['PGP ID', 'Name'];
  for (let i = 1; i <= MAX_COLS; i++) {
    s3Headers.push(`Committee ${i}`, `Student Rank ${i}`, `Committee Rank ${i}`);
  }
  sheet3.addRow(s3Headers);
  applyHeaderStyle(sheet3.getRow(1));

  const allStudentsResult = await query(
    `SELECT DISTINCT u.pgpid, u.name
     FROM applications a
     JOIN users u ON a.pgpid = u.pgpid
     WHERE a.is_active = true
     ORDER BY u.name`
  );

  for (const student of allStudentsResult.rows) {
    const appsResult = await query(
      `SELECT a.committee_login, a.committee_rank, r.rank as student_rank,
              c.name as committee_name
       FROM applications a
       JOIN committees c ON a.committee_login = c.login
       LEFT JOIN rankings r ON r.pgpid = a.pgpid AND r.committee_login = a.committee_login
       WHERE a.pgpid = $1 AND a.is_active = true
       ORDER BY r.rank NULLS LAST, c.name`,
      [student.pgpid]
    );

    const rowData = [student.pgpid, student.name];
    for (let i = 0; i < MAX_COLS; i++) {
      const app = appsResult.rows[i];
      if (app) {
        rowData.push(app.committee_name, app.student_rank || '', app.committee_rank);
      } else {
        rowData.push('', '', '');
      }
    }
    sheet3.addRow(rowData);
  }

  // Auto-fit columns on all sheets
  [sheet1, sheet2, sheet3].forEach((sheet) => {
    sheet.columns.forEach((column) => {
      column.width = 22;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Flat export: PGP ID | Name | Committee | Rank by Student | Rank by Committee
// Joins allocations with users and committees
async function generateFlatExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Calvin CCA Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Flat Report');
  sheet.addRow(['PGP ID', 'Name', 'Committee', 'Rank by Student', 'Rank by Committee']);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  const result = await query(
    `SELECT al.pgpid, u.name, c.name as committee_name,
            al.student_rank, al.committee_rank
     FROM allocations al
     JOIN users u ON al.pgpid = u.pgpid
     JOIN committees c ON al.committee_login = c.login
     ORDER BY c.name, al.student_rank`
  );

  for (const row of result.rows) {
    sheet.addRow([
      row.pgpid,
      row.name,
      row.committee_name,
      row.student_rank || '',
      row.committee_rank || '',
    ]);
  }

  sheet.columns.forEach((col) => { col.width = 22; });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { generateCommitteeExcel, generateCouncilExcel, generateFlatExcel };
