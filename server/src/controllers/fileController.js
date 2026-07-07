import { ShipmentFile } from '../models/ShipmentFile.js';
import { ProcessTemplate } from '../models/ProcessTemplate.js';
import { Transporter } from '../models/Transporter.js';
import { getSettings } from '../models/Settings.js';
import { getNextSequence } from '../models/Counter.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../middleware/errorHandler.js';

function computeCautionAmount(containers, settings) {
  return containers.reduce((total, c) => {
    const rate = c.type === '20' ? settings.caution20Rate : settings.caution40Rate;
    return total + rate * c.quantity;
  }, 0);
}

export async function listFiles(req, res) {
  const filter = {};
  if (req.query.client) filter.client = req.query.client;
  if (req.query.agent) filter.agent = req.query.agent;
  if (req.query.transporter) filter.transporter = req.query.transporter;
  if (req.query.processType) filter.processType = req.query.processType;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.cautionType) filter['caution.type'] = req.query.cautionType;

  const files = await ShipmentFile.find(filter)
    .populate('client', 'name')
    .populate('agent', 'name')
    .populate('transporter', 'name')
    .sort({ createdAt: -1 });
  res.json({ items: files });
}

export async function getFile(req, res) {
  const file = await ShipmentFile.findById(req.params.id)
    .populate('client', 'name')
    .populate('agent', 'name')
    .populate('transporter', 'name');
  if (!file) throw new ApiError(404, 'File not found');
  res.json({ item: file });
}

export async function createFile(req, res) {
  const {
    client,
    blNumber,
    containers,
    shippingLine,
    natureOfGoods,
    sellingPrice,
    agent,
    transporter,
    processType,
    cautionType,
  } = req.body;

  if (!client || !blNumber || !Array.isArray(containers) || containers.length === 0) {
    throw new ApiError(400, 'client, blNumber, and at least one container are required');
  }
  if (!shippingLine || !natureOfGoods || !sellingPrice?.amount || !sellingPrice?.currency) {
    throw new ApiError(400, 'shippingLine, natureOfGoods, and sellingPrice are required');
  }
  if (sellingPrice.amount <= 0) throw new ApiError(400, 'sellingPrice must be greater than 0');
  if (!agent || !transporter) throw new ApiError(400, 'agent and transporter are required');
  if (!['IM4', 'TR8'].includes(processType)) throw new ApiError(400, 'processType must be IM4 or TR8');
  if (!['actual', 'interest'].includes(cautionType)) throw new ApiError(400, 'cautionType must be actual or interest');

  const transporterDoc = await Transporter.findById(transporter);
  if (!transporterDoc) throw new ApiError(404, 'Transporter not found');

  const template = await ProcessTemplate.findOne({ processType });
  const steps = (template?.steps ?? []).map((step) => ({
    name: step.name,
    order: step.order,
    completed: false,
  }));

  const settings = await getSettings();
  const cautionAmount = computeCautionAmount(containers, settings);

  const year = new Date().getFullYear();
  const seq = await getNextSequence(`file-${year}`);
  const reference = `F-${year}-${String(seq).padStart(4, '0')}`;

  const file = await ShipmentFile.create({
    reference,
    client,
    blNumber,
    containers,
    shippingLine,
    natureOfGoods,
    sellingPrice,
    agent,
    transporter,
    transportCost: { amount: transporterDoc.fixedTransportCost, currency: transporterDoc.currency },
    processType,
    steps,
    caution: { type: cautionType, amount: cautionAmount, currency: settings.cautionCurrency },
    createdBy: req.user._id,
  });

  res.status(201).json({ item: file });
}

export async function updateFile(req, res) {
  const fields = ['blNumber', 'containers', 'shippingLine', 'natureOfGoods', 'sellingPrice', 'agent'];
  const payload = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }
  const file = await ShipmentFile.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!file) throw new ApiError(404, 'File not found');
  res.json({ item: file });
}

export async function toggleStep(req, res) {
  const { stepIndex } = req.params;
  const file = await ShipmentFile.findById(req.params.id);
  if (!file) throw new ApiError(404, 'File not found');

  const step = file.steps[Number(stepIndex)];
  if (!step) throw new ApiError(404, 'Step not found');

  step.completed = !step.completed;
  step.completedAt = step.completed ? new Date() : undefined;
  await file.save();

  res.json({ item: file });
}

export async function updateStatus(req, res) {
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) throw new ApiError(400, 'status must be open or closed');

  const file = await ShipmentFile.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!file) throw new ApiError(404, 'File not found');
  res.json({ item: file });
}

export async function deleteFile(req, res) {
  const paymentCount = await Payment.countDocuments({ file: req.params.id });
  if (paymentCount > 0) {
    throw new ApiError(409, 'Cannot delete a file that has payments recorded against it. Close it instead.');
  }
  const file = await ShipmentFile.findByIdAndDelete(req.params.id);
  if (!file) throw new ApiError(404, 'File not found');
  res.status(204).end();
}
