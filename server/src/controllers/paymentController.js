import { Payment, PAYMENT_DIRECTIONS } from '../models/Payment.js';
import { PaymentType } from '../models/PaymentType.js';
import { ApiError } from '../middleware/errorHandler.js';

const POPULATE = [
  { path: 'file', select: 'blNumber' },
  { path: 'agent', select: 'name' },
  { path: 'transporter', select: 'name' },
  { path: 'paymentType', select: 'name category' },
];

export async function listPayments(req, res) {
  const filter = {};
  if (req.query.file) filter.file = req.query.file;
  if (req.query.direction) filter.direction = req.query.direction;
  if (req.query.agent) filter.agent = req.query.agent;
  if (req.query.transporter) filter.transporter = req.query.transporter;
  if (req.query.currency) filter.currency = req.query.currency;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const payments = await Payment.find(filter).populate(POPULATE).sort({ date: -1 });
  res.json({ items: payments });
}

export async function getPayment(req, res) {
  const payment = await Payment.findById(req.params.id).populate(POPULATE);
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json({ item: payment });
}

function validateDirectionFields(body) {
  const { direction, file, agent, transporter } = body;
  if (!PAYMENT_DIRECTIONS.includes(direction)) throw new ApiError(400, 'Invalid direction');
  if (direction !== 'business_expense' && !file) throw new ApiError(400, 'file is required for this direction');
  if (direction === 'agent_payment' && !agent) throw new ApiError(400, 'agent is required for agent_payment');
  if (direction === 'transporter_payment' && !transporter) {
    throw new ApiError(400, 'transporter is required for transporter_payment');
  }
}

export async function createPayment(req, res) {
  const { file, direction, amount, currency, paymentType, agent, transporter, date, notes } = req.body;

  if (!amount || amount <= 0) throw new ApiError(400, 'amount must be greater than 0');
  if (!currency || !paymentType) throw new ApiError(400, 'currency and paymentType are required');
  validateDirectionFields(req.body);

  const paymentTypeDoc = await PaymentType.findById(paymentType);
  if (!paymentTypeDoc) throw new ApiError(404, 'Payment type not found');
  if (paymentTypeDoc.category !== direction) {
    throw new ApiError(400, 'That payment type does not belong to the selected category');
  }

  const payment = await Payment.create({
    file: direction === 'business_expense' ? undefined : file,
    direction,
    amount,
    currency,
    paymentType,
    agent: direction === 'agent_payment' ? agent : undefined,
    transporter: direction === 'transporter_payment' ? transporter : undefined,
    date,
    notes,
    createdBy: req.user._id,
  });

  const populated = await payment.populate(POPULATE);
  res.status(201).json({ item: populated });
}

export async function updatePayment(req, res) {
  const fields = ['amount', 'currency', 'paymentType', 'date', 'notes'];
  const payload = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }
  const payment = await Payment.findByIdAndUpdate(req.params.id, payload, { new: true }).populate(POPULATE);
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json({ item: payment });
}

export async function deletePayment(req, res) {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.status(204).end();
}
