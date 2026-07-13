import mongoose from 'mongoose';
import { ShipmentFile } from '../models/ShipmentFile.js';
import { Payment } from '../models/Payment.js';
import { Client } from '../models/Client.js';
import { Transporter } from '../models/Transporter.js';
import { computeFileProfitability } from './financeService.js';

function addToTotals(totals, currency, amount) {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

/**
 * @param {string} clientId
 * @param {{ detailed?: boolean }} [options] - when detailed, each row also carries its file's
 *   individual client_payment history (date, amount, type) for a payments sub-section.
 */
export async function buildClientStatementData(clientId, { detailed = false } = {}) {
  const client = await Client.findById(clientId);
  if (!client) return null;

  const files = await ShipmentFile.find({ client: clientId });

  const firstEntryRows = await Payment.aggregate([
    { $match: { file: { $in: files.map((f) => f._id) }, direction: 'client_payment' } },
    { $group: { _id: '$file', firstEntryDate: { $min: '$date' } } },
  ]);
  const firstEntryByFile = new Map(firstEntryRows.map((r) => [r._id.toString(), r.firstEntryDate]));

  // Most recent first-entry date first, oldest last; files with no client payments yet sort to the top.
  files.sort((a, b) => {
    const dateA = firstEntryByFile.get(a._id.toString());
    const dateB = firstEntryByFile.get(b._id.toString());
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return dateB - dateA;
  });

  const rows = [];
  const totals = { sellingPrice: {}, collected: {}, balanceDue: {} };

  for (const file of files) {
    const profitability = await computeFileProfitability(file._id);
    const row = {
      blNumber: file.blNumber,
      status: file.status,
      currency: profitability.currency,
      sellingPrice: profitability.sellingPrice,
      collected: profitability.collected[profitability.currency] ?? 0,
      balanceDue: profitability.balanceDue,
    };

    if (detailed) {
      const payments = await Payment.find({ file: file._id, direction: 'client_payment' })
        .populate('paymentType', 'name')
        .sort({ date: 1 });
      row.payments = payments.map((p) => ({
        date: p.date,
        amount: p.amount,
        currency: p.currency,
        paymentType: p.paymentType?.name ?? 'Payment',
      }));
    }

    rows.push(row);
    addToTotals(totals.sellingPrice, profitability.currency, profitability.sellingPrice);
    addToTotals(totals.collected, profitability.currency, profitability.collected[profitability.currency] ?? 0);
    addToTotals(totals.balanceDue, profitability.currency, profitability.balanceDue);
  }

  return { client, rows, totals };
}

/**
 * A single file's client-facing statement: the selling price as a debit
 * (the charge), each client payment as a credit (a receipt), and the
 * running balance due. Expenses are deliberately excluded — this is a
 * statement for the client, not an internal profitability breakdown.
 */
export async function buildFileStatementData(fileId) {
  const file = await ShipmentFile.findById(fileId).populate('client', 'name address');
  if (!file) return null;

  const payments = await Payment.find({ file: fileId, direction: 'client_payment' })
    .populate('paymentType', 'name')
    .sort({ date: 1 });

  const rows = [
    {
      date: file.createdAt,
      description: 'Selling price',
      debit: file.sellingPrice.amount,
      credit: 0,
    },
    ...payments.map((p) => ({
      date: p.date,
      description: p.paymentType?.name ?? 'Payment',
      debit: 0,
      credit: p.amount,
    })),
  ];

  const totalDebit = file.sellingPrice.amount;
  const totalCredit = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = totalDebit - totalCredit;

  return { file, currency: file.sellingPrice.currency, rows, totalDebit, totalCredit, balanceDue };
}

export async function buildTransporterStatementData(transporterId) {
  const transporter = await Transporter.findById(transporterId);
  if (!transporter) return null;

  const objectId = new mongoose.Types.ObjectId(transporterId);
  const files = await ShipmentFile.find({ transporter: transporterId }).populate('client', 'name').sort({ createdAt: 1 });

  const paidRows = await Payment.aggregate([
    { $match: { transporter: objectId, direction: 'transporter_payment' } },
    { $group: { _id: { file: '$file', currency: '$currency' }, total: { $sum: '$amount' } } },
  ]);
  const paidByFile = new Map();
  for (const row of paidRows) {
    const key = `${row._id.file}-${row._id.currency}`;
    paidByFile.set(key, row.total);
  }

  const rows = [];
  const totals = { cost: {}, paid: {}, balanceOwed: {} };

  for (const file of files) {
    const paid = paidByFile.get(`${file._id}-${file.transportCost.currency}`) ?? 0;
    const balanceOwed = file.transportCost.amount - paid;
    rows.push({
      client: file.client.name,
      blNumber: file.blNumber,
      currency: file.transportCost.currency,
      cost: file.transportCost.amount,
      paid,
      balanceOwed,
    });
    addToTotals(totals.cost, file.transportCost.currency, file.transportCost.amount);
    addToTotals(totals.paid, file.transportCost.currency, paid);
    addToTotals(totals.balanceOwed, file.transportCost.currency, balanceOwed);
  }

  return { transporter, rows, totals };
}
