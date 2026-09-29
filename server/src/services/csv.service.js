const { parse } = require('csv-parse/sync');

const REQUIRED_COLUMNS = ['login_id', 'name', 'email', 'batch'];

/**
 * Parses a student-import CSV (N10: login ID, name, email, batch). Column
 * names are matched case-insensitively; extra columns are ignored.
 */
function parseStudentCsv(buffer) {
  const records = parse(buffer, {
    columns: (header) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    throw new Error('CSV has no data rows');
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !(col in records[0]));
  if (missing.length > 0) {
    throw new Error(`CSV is missing column(s): ${missing.join(', ')}`);
  }

  return records.map((row) => ({
    loginId: row.login_id,
    name: row.name,
    email: row.email,
    batch: row.batch,
  }));
}

module.exports = { parseStudentCsv };
