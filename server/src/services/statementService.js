import mongoose from 'mongoose';
import { ShipmentFile } from '../models/ShipmentFile.js';
import { Payment } from '../models/Payment.js';
import { Client } from '../models/Client.js';
import { Transporter } from '../models/Transporter.js';

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
  const fileIds = files.map((f) => f._id);

  const firstEntryRows = await Payment.aggregate([
    { $match: { file: { $in: fileIds }, direction: 'client_payment' } },
    { $group: { _id: '$file', firstEntryDate: { $min: '$date' } } },
  ]);
  const firstEntryByFile = new Map(firstEntryRows.map((r) => [r._id.toString(), r.firstEntryDate]));

  // Total client payments per file, split by currency. A client statement only
  // ever needs the selling price and what's been collected against it, so a
  // single grouped aggregation over all the client's receipts replaces the old
  // per-file computeFileProfitability loop (which also computed expenses,
  // caution and cash-balance figures this statement never uses).
  const collectedRows = await Payment.aggregate([
    { $match: { file: { $in: fileIds }, direction: 'client_payment' } },
    { $group: { _id: { file: '$file', currency: '$currency' }, total: { $sum: '$amount' } } },
  ]);
  const collectedByFile = new Map();
  for (const r of collectedRows) {
    collectedByFile.set(`${r._id.file}-${r._id.currency}`, r.total);
  }

  // Full client-payment history per file for detailed statements, fetched in a
  // single date-sorted query and grouped in memory. Filtering a globally
  // date-ascending list preserves each file's payments in ascending date order,
  // matching the old per-file sort({ date: 1 }).
  const paymentsByFile = new Map();
  if (detailed) {
    const allPayments = await Payment.find({ file: { $in: fileIds }, direction: 'client_payment' })
      .populate('paymentType', 'name')
      .sort({ date: 1 });
    for (const p of allPayments) {
      const key = p.file.toString();
      if (!paymentsByFile.has(key)) paymentsByFile.set(key, []);
      paymentsByFile.get(key).push({
        date: p.date,
        amount: p.amount,
        currency: p.currency,
        paymentType: p.paymentType?.name ?? 'Payment',
      });
    }
  }

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
    const currency = file.sellingPrice.currency;
    const sellingPrice = file.sellingPrice.amount;
    const collected = collectedByFile.get(`${file._id}-${currency}`) ?? 0;
    const balanceDue = sellingPrice - collected;

    const row = {
      blNumber: file.blNumber,
      status: file.status,
      currency,
      sellingPrice,
      collected,
      balanceDue,
    };

    if (detailed) {
      row.payments = paymentsByFile.get(file._id.toString()) ?? [];
    }

    rows.push(row);
    addToTotals(totals.sellingPrice, currency, sellingPrice);
    addToTotals(totals.collected, currency, collected);
    addToTotals(totals.balanceDue, currency, balanceDue);
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
