import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { ShipmentFile } from '../models/ShipmentFile.js';
import { ProfitTransfer } from '../models/ProfitTransfer.js';

const INFLOW_DIRECTIONS = ['client_payment', 'caution_refund'];
const OUTFLOW_DIRECTIONS = [
  'agent_payment',
  'transporter_payment',
  'generic_expense',
  'business_expense',
  'caution_deposit',
];
const EXPENSE_DIRECTIONS = ['agent_payment', 'transporter_payment', 'generic_expense'];

function toCurrencyTotals(rows) {
  const totals = { USD: 0, CDF: 0 };
  for (const row of rows) {
    totals[row._id] = row.total;
  }
  return totals;
}

/**
 * Overall cash balance: sums every recorded Payment by direction/currency,
 * then subtracts profit transfers to the owner's personal account —
 * client_payment and caution_refund are inflows; every other Payment
 * direction and every ProfitTransfer are outflows.
 */
export async function computeCashBalance() {
  const rows = await Payment.aggregate([
    {
      $group: {
        _id: { currency: '$currency', direction: '$direction' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const balance = { USD: 0, CDF: 0 };
  for (const row of rows) {
    const sign = INFLOW_DIRECTIONS.includes(row._id.direction)
      ? 1
      : OUTFLOW_DIRECTIONS.includes(row._id.direction)
        ? -1
        : 0;
    balance[row._id.currency] += sign * row.total;
  }

  const transferRows = await ProfitTransfer.aggregate([
    { $group: { _id: '$currency', total: { $sum: '$amount' } } },
  ]);
  for (const row of transferRows) {
    balance[row._id] -= row.total;
  }

  return balance;
}

/**
 * A single file's cash position: every recorded receipt (client_payment,
 * caution_refund) minus every recorded outflow (agent/transporter/generic
 * payments, caution_deposit) for that file — mirrors computeCashBalance's
 * sign convention but scoped to one file. This is a real cash-in-hand
 * figure, distinct from profitability (which compares expenses against the
 * selling price rather than against what's actually been collected).
 */
export async function computeFileCashBalance(fileId) {
  const objectId = new mongoose.Types.ObjectId(fileId);
  const rows = await Payment.aggregate([
    { $match: { file: objectId } },
    { $group: { _id: { currency: '$currency', direction: '$direction' }, total: { $sum: '$amount' } } },
  ]);

  const balance = { USD: 0, CDF: 0 };
  for (const row of rows) {
    const sign = INFLOW_DIRECTIONS.includes(row._id.direction)
      ? 1
      : OUTFLOW_DIRECTIONS.includes(row._id.direction)
        ? -1
        : 0;
    balance[row._id.currency] += sign * row.total;
  }
  return balance;
}

/**
 * Cash-basis profitability for a single file: sellingPrice minus recorded
 * expenses (agent/transporter/generic payments) in the selling price's
 * currency. Caution deposit/refund payments are excluded — they're a
 * refundable deposit, not revenue or cost. Client payments are reported
 * separately as collections against the selling price (receivables), not
 * folded into profit.
 */
export async function computeFileProfitability(fileId) {
  const file = await ShipmentFile.findById(fileId);
  if (!file) return null;

  const objectId = new mongoose.Types.ObjectId(fileId);

  const expenseRows = await Payment.aggregate([
    { $match: { file: objectId, direction: { $in: EXPENSE_DIRECTIONS } } },
    { $group: { _id: '$currency', total: { $sum: '$amount' } } },
  ]);
  const expenses = toCurrencyTotals(expenseRows);

  const collectedRows = await Payment.aggregate([
    { $match: { file: objectId, direction: 'client_payment' } },
    { $group: { _id: '$currency', total: { $sum: '$amount' } } },
  ]);
  const collected = toCurrencyTotals(collectedRows);

  const transportPaidRows = await Payment.aggregate([
    { $match: { file: objectId, direction: 'transporter_payment' } },
    { $group: { _id: '$currency', total: { $sum: '$amount' } } },
  ]);
  const transportPaid = toCurrencyTotals(transportPaidRows);

  const currency = file.sellingPrice.currency;
  const profit = file.sellingPrice.amount - (expenses[currency] ?? 0);
  const balanceDue = file.sellingPrice.amount - (collected[currency] ?? 0);
  const outstandingTransportCost = file.transportCost.amount - (transportPaid[file.transportCost.currency] ?? 0);
  const cashBalance = await computeFileCashBalance(fileId);

  return {
    currency,
    sellingPrice: file.sellingPrice.amount,
    expenses,
    profit,
    realized: file.status === 'closed',
    collected,
    balanceDue,
    transportCost: file.transportCost,
    outstandingTransportCost,
    cashBalance,
  };
}

/**
 * Aggregates profitability across a client's files: realized profit comes
 * only from closed files; projected profit covers all files regardless of
 * status. Reported per currency, never converted/blended.
 */
export async function computeClientProfitability(clientId) {
  const objectId = new mongoose.Types.ObjectId(clientId);
  const files = await ShipmentFile.find({ client: objectId });

  const realized = { USD: 0, CDF: 0 };
  const projected = { USD: 0, CDF: 0 };

  for (const file of files) {
    const profitability = await computeFileProfitability(file._id);
    if (!profitability) continue;
    projected[profitability.currency] += profitability.profit;
    if (file.status === 'closed') {
      realized[profitability.currency] += profitability.profit;
    }
  }

  return { realized, projected, fileCount: files.length };
}
