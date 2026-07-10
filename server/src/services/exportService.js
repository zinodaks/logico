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
  const colX = [50, 170, 300, 400, 480];
  doc.text('BL Number', colX[0], doc.y, { continued: false });
  doc.text('Selling Price', colX[1], doc.y - 12);
  doc.text('Collected', colX[2], doc.y - 12);
  doc.text('Balance Due', colX[3], doc.y - 12);
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  for (const row of rows) {
    const y = doc.y + 4;
    doc.text(row.blNumber, colX[0], y);
    doc.text(`${formatMoney(row.sellingPrice)} ${row.currency}`, colX[1], y);
    doc.text(`${formatMoney(row.collected)} ${row.currency}`, colX[2], y);
    doc.text(`${formatMoney(row.balanceDue)} ${row.currency}`, colX[3], y);
    doc.moveDown();
  }

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();
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
  const colX = [50, 220, 380, 470];
  doc.text('Date', colX[0], doc.y);
  doc.text('Description', colX[1], doc.y - 12);
  doc.text('Debit', colX[2], doc.y - 12);
  doc.text('Credit', colX[3], doc.y - 12);
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  for (const row of rows) {
    const y = doc.y + 4;
    doc.text(formatDate(row.date), colX[0], y);
    doc.text(row.description, colX[1], y);
    doc.text(row.debit ? `${formatMoney(row.debit)} ${currency}` : '', colX[2], y);
    doc.text(row.credit ? `${formatMoney(row.credit)} ${currency}` : '', colX[3], y);
    doc.moveDown();
  }

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();
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
  const colX = [50, 190, 300, 380, 460];
  doc.text('Client', colX[0], doc.y);
  doc.text('BL Number', colX[1], doc.y - 12);
  doc.text('Cost', colX[2], doc.y - 12);
  doc.text('Paid', colX[3], doc.y - 12);
  doc.text('Balance Owed', colX[4], doc.y - 12);
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  for (const row of rows) {
    const y = doc.y + 4;
    doc.text(row.client, colX[0], y);
    doc.text(row.blNumber, colX[1], y);
    doc.text(`${formatMoney(row.cost)} ${row.currency}`, colX[2], y);
    doc.text(`${formatMoney(row.paid)} ${row.currency}`, colX[3], y);
    doc.text(`${formatMoney(row.balanceOwed)} ${row.currency}`, colX[4], y);
    doc.moveDown();
  }

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();
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
