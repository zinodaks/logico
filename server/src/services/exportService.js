import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { formatDate } from '../utils/formatDate.js';

function formatMoney(amount) {
  return amount.toFixed(2);
}

function currencyTotalsLine(totals) {
  return Object.entries(totals)
    .filter(([, amount]) => amount !== 0)
    .map(([currency, amount]) => `${formatMoney(amount)} ${currency}`)
    .join(', ') || '0.00';
}

const TABLE_LEFT = 50;
const TABLE_RIGHT = 545;
const TABLE_BOTTOM_MARGIN = 50;

/**
 * Renders a table with explicit per-column x-positions, breaking to a new
 * page (and repeating the header row) whenever the next row wouldn't fit
 * above the bottom margin. Plain flowing doc.text() calls already paginate
 * correctly on their own, but text drawn at an explicit y does not, so
 * multi-column rows need this manual check or they silently run off the
 * bottom of the page once a statement gets long.
 */
function drawTable(doc, { columns, rows, getCells }) {
  function drawHeader() {
    doc.font('Helvetica-Bold').fontSize(10);
    const headerY = doc.y;
    for (const col of columns) {
      doc.text(col.label, col.x, headerY);
    }
    doc.font('Helvetica');
    doc.moveDown();
    doc.moveTo(TABLE_LEFT, doc.y).lineTo(TABLE_RIGHT, doc.y).stroke();
    doc.moveDown(0.3);
  }

  drawHeader();
  const rowHeight = doc.currentLineHeight(true) + 4;

  for (const row of rows) {
    if (doc.y + rowHeight > doc.page.height - TABLE_BOTTOM_MARGIN) {
      doc.addPage();
      drawHeader();
    }
    const y = doc.y + 4;
    const cells = getCells(row);
    columns.forEach((col, i) => doc.text(cells[i], col.x, y));
    doc.moveDown();
  }

  doc.moveDown();
  doc.moveTo(TABLE_LEFT, doc.y).lineTo(TABLE_RIGHT, doc.y).stroke();
  doc.moveDown();
}

export function streamClientStatementPdf(res, { client, rows, totals }) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${client.name}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Client Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Client: ${client.name}`);
  doc.text(`Address: ${client.address}`);
  if (client.rccm) doc.text(`RCCM: ${client.rccm}`);
  doc.moveDown();

  doc.fontSize(10);
  drawTable(doc, {
    columns: [
      { label: 'BL Number', x: 50 },
      { label: 'Selling Price', x: 170 },
      { label: 'Collected', x: 300 },
      { label: 'Balance Due', x: 400 },
    ],
    rows,
    getCells: (row) => [
      row.blNumber,
      `${formatMoney(row.sellingPrice)} ${row.currency}`,
      `${formatMoney(row.collected)} ${row.currency}`,
      `${formatMoney(row.balanceDue)} ${row.currency}`,
    ],
  });

  doc.fontSize(11).text(`Total selling price: ${currencyTotalsLine(totals.sellingPrice)}`);
  doc.text(`Total collected: ${currencyTotalsLine(totals.collected)}`);
  doc.text(`Total balance due: ${currencyTotalsLine(totals.balanceDue)}`);

  doc.end();
}

export async function streamClientStatementXlsx(res, { client, rows, totals }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statement');

  sheet.addRow([`Client Statement — ${client.name}`]);
  sheet.addRow([`Address: ${client.address}`]);
  sheet.addRow([]);
  sheet.addRow(['BL Number', 'Status', 'Selling Price', 'Collected', 'Balance Due', 'Currency']);

  for (const row of rows) {
    sheet.addRow([row.blNumber, row.status, row.sellingPrice, row.collected, row.balanceDue, row.currency]);
  }

  sheet.addRow([]);
  sheet.addRow(['Total selling price', currencyTotalsLine(totals.sellingPrice)]);
  sheet.addRow(['Total collected', currencyTotalsLine(totals.collected)]);
  sheet.addRow(['Total balance due', currencyTotalsLine(totals.balanceDue)]);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="statement-${client.name}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

export function streamFileStatementPdf(res, { file, currency, rows, totalDebit, totalCredit, balanceDue }) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${file.blNumber}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('File Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Client: ${file.client.name}`);
  doc.text(`BL Number: ${file.blNumber}`);
  doc.moveDown();

  doc.fontSize(10);
  drawTable(doc, {
    columns: [
      { label: 'Date', x: 50 },
      { label: 'Description', x: 220 },
      { label: 'Debit', x: 380 },
      { label: 'Credit', x: 470 },
    ],
    rows,
    getCells: (row) => [
      formatDate(row.date),
      row.description,
      row.debit ? `${formatMoney(row.debit)} ${currency}` : '',
      row.credit ? `${formatMoney(row.credit)} ${currency}` : '',
    ],
  });

  doc.fontSize(11).text(`Total debit: ${formatMoney(totalDebit)} ${currency}`);
  doc.text(`Total credit: ${formatMoney(totalCredit)} ${currency}`);
  doc.text(`Balance due: ${formatMoney(balanceDue)} ${currency}`);

  doc.end();
}

export async function streamFileStatementXlsx(res, { file, currency, rows, totalDebit, totalCredit, balanceDue }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statement');

  sheet.addRow([`File Statement — ${file.blNumber}`]);
  sheet.addRow([`Client: ${file.client.name}`]);
  sheet.addRow([]);
  sheet.addRow(['Date', 'Description', 'Debit', 'Credit']);

  for (const row of rows) {
    sheet.addRow([formatDate(row.date), row.description, row.debit || '', row.credit || '']);
  }

  sheet.addRow([]);
  sheet.addRow(['Total debit', `${formatMoney(totalDebit)} ${currency}`]);
  sheet.addRow(['Total credit', `${formatMoney(totalCredit)} ${currency}`]);
  sheet.addRow(['Balance due', `${formatMoney(balanceDue)} ${currency}`]);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${file.blNumber}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

export function streamTransporterStatementPdf(res, { transporter, rows, totals }) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${transporter.name}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Transporter Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Transporter: ${transporter.name}`);
  doc.moveDown();

  doc.fontSize(10);
  drawTable(doc, {
    columns: [
      { label: 'Client', x: 50 },
      { label: 'BL Number', x: 190 },
      { label: 'Cost', x: 300 },
      { label: 'Paid', x: 380 },
      { label: 'Balance Owed', x: 460 },
    ],
    rows,
    getCells: (row) => [
      row.client,
      row.blNumber,
      `${formatMoney(row.cost)} ${row.currency}`,
      `${formatMoney(row.paid)} ${row.currency}`,
      `${formatMoney(row.balanceOwed)} ${row.currency}`,
    ],
  });

  doc.fontSize(11).text(`Total cost: ${currencyTotalsLine(totals.cost)}`);
  doc.text(`Total paid: ${currencyTotalsLine(totals.paid)}`);
  doc.text(`Total balance owed: ${currencyTotalsLine(totals.balanceOwed)}`);

  doc.end();
}

export async function streamTransporterStatementXlsx(res, { transporter, rows, totals }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statement');

  sheet.addRow([`Transporter Statement — ${transporter.name}`]);
  sheet.addRow([]);
  sheet.addRow(['Client', 'BL Number', 'Cost', 'Paid', 'Balance Owed', 'Currency']);

  for (const row of rows) {
    sheet.addRow([row.client, row.blNumber, row.cost, row.paid, row.balanceOwed, row.currency]);
  }

  sheet.addRow([]);
  sheet.addRow(['Total cost', currencyTotalsLine(totals.cost)]);
  sheet.addRow(['Total paid', currencyTotalsLine(totals.paid)]);
  sheet.addRow(['Total balance owed', currencyTotalsLine(totals.balanceOwed)]);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="statement-${transporter.name}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}
