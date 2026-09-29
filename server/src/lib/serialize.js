/**
 * INV-01: student/CCA/panelist-facing responses are built from explicit
 * field allowlists, never by passing a DB row straight through. Every
 * response builder for those roles should go through this instead of
 * spreading a row directly into res.json().
 */
function pickFields(row, allowedFields) {
  if (Array.isArray(row)) {
    return row.map((item) => pickFields(item, allowedFields));
  }
  const result = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(row, field)) {
      result[field] = row[field];
    }
  }
  return result;
}

module.exports = { pickFields };
