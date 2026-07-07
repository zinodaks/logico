import mongoose from 'mongoose';
import { ShipmentFile } from '../models/ShipmentFile.js';
import { Payment } from '../models/Payment.js';
import { Client } from '../models/Client.js';
import { Transporter } from '../models/Transporter.js';
import { computeFileProfitability } from './financeService.js';

function addToTotals(totals, currency, amount) {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

export async function buildClientStatementData(clientId) {
  const client = await Client.findById(clientId);
  if (!client) return null;

  const files = await ShipmentFile.find({ client: clientId }).sort({ createdAt: 1 });

  const rows = [];
  const totals = { sellingPrice: {}, collected: {}, balanceDue: {} };

  for (const file of files) {
    const profitability = await computeFileProfitability(file._id);
    rows.push({
      reference: file.reference,
      blNumber: file.blNumber,
      status: file.status,
      currency: profitability.currency,
      sellingPrice: profitability.sellingPrice,
      collected: profitability.collected[profitability.currency] ?? 0,
      balanceDue: profitability.balanceDue,
    });
    addToTotals(totals.sellingPrice, profitability.currency, profitability.sellingPrice);
    addToTotals(totals.collected, profitability.currency, profitability.collected[profitability.currency] ?? 0);
    addToTotals(totals.balanceDue, profitability.currency, profitability.balanceDue);
  }

  return { client, rows, totals };
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
      reference: file.reference,
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
