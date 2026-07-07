import { ProfitTransfer } from '../models/ProfitTransfer.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function listProfitTransfers(req, res) {
  const transfers = await ProfitTransfer.find().sort({ date: -1 });
  res.json({ items: transfers });
}

export async function createProfitTransfer(req, res) {
  const { amount, currency, date, notes } = req.body;
  if (!amount || amount <= 0) throw new ApiError(400, 'amount must be greater than 0');
  if (!['USD', 'CDF'].includes(currency)) throw new ApiError(400, 'currency must be USD or CDF');

  const transfer = await ProfitTransfer.create({ amount, currency, date, notes, createdBy: req.user._id });
  res.status(201).json({ item: transfer });
}

export async function deleteProfitTransfer(req, res) {
  const transfer = await ProfitTransfer.findByIdAndDelete(req.params.id);
  if (!transfer) throw new ApiError(404, 'Profit transfer not found');
  res.status(204).end();
}
