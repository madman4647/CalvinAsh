const ExcelJS = require('exceljs');

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };
const DEFAULT_COLUMN_WIDTH = 22;

/**
 * Ported from the old excel.service.js. Only the schema-agnostic workbook-construction
 * pattern (header styling, column widths) survived the teardown — the three functions
 * that queried the old schema directly were dropped. Loop 3/10 rebuild the query side
 * against the new schema and call this with their own rows.
 */
function buildWorkbook({ creator = 'Calvin CCA Platform', sheets }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = creator;
  workbook.created = new Date();

  for (const { name, headers, rows, columnWidth = DEFAULT_COLUMN_WIDTH } of sheets) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = HEADER_FONT;
    headerRow.fill = HEADER_FILL;

    for (const row of rows) {
      sheet.addRow(row);
    }

    sheet.columns.forEach((column) => {
      column.width = columnWidth;
    });
  }

  return workbook;
}

async function workbookBuffer(workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { buildWorkbook, workbookBuffer };
