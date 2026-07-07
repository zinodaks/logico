import { computeCashBalance, computeFileProfitability, computeClientProfitability } from '../services/financeService.js';
import { ShipmentFile } from '../models/ShipmentFile.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function getBalance(req, res) {
  const balance = await computeCashBalance();
  res.json({ balance });
}

export async function getFileProfitability(req, res) {
  const profitability = await computeFileProfitability(req.params.id);
  if (!profitability) throw new ApiError(404, 'File not found');
  res.json({ item: profitability });
}

export async function getClientProfitability(req, res) {
  const profitability = await computeClientProfitability(req.params.id);
  res.json({ item: profitability });
}

export async function getActualCautionsReport(req, res) {
  const files = await ShipmentFile.find({ 'caution.type': 'actual' })
    .populate('client', 'name')
    .sort({ createdAt: -1 });

  const fileIds = files.map((f) => f._id);
  const deposits = await Payment.find({ file: { $in: fileIds }, direction: 'caution_deposit' });
  const refunds = await Payment.find({ file: { $in: fileIds }, direction: 'caution_refund' });

  const depositedFileIds = new Set(deposits.map((p) => p.file.toString()));
  const refundedFileIds = new Set(refunds.map((p) => p.file.toString()));

  const items = files.map((file) => ({
    file: { _id: file._id, blNumber: file.blNumber, client: file.client },
    cautionAmount: file.caution.amount,
    currency: file.caution.currency,
    paid: depositedFileIds.has(file._id.toString()),
    refunded: refundedFileIds.has(file._id.toString()),
  }));

  res.json({ items });
}
