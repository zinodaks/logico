import mongoose from 'mongoose';

const containerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['20', '40'], required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const moneySchema = new mongoose.Schema(
  { amount: { type: Number, required: true }, currency: { type: String, enum: ['USD', 'CDF'], required: true } },
  { _id: false },
);

const stepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false },
);

const cautionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['actual', 'interest'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'CDF'], required: true },
  },
  { _id: false },
);

const shipmentFileSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    blNumber: { type: String, required: true, trim: true },
    containers: { type: [containerSchema], default: [] },
    shippingLine: { type: String, required: true, trim: true },
    natureOfGoods: { type: String, required: true, trim: true },
    sellingPrice: { type: moneySchema, required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true },
    transportCost: { type: moneySchema, required: true },
    processType: { type: String, enum: ['IM4', 'TR8'], required: true },
    steps: { type: [stepSchema], default: [] },
    caution: { type: cautionSchema, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const ShipmentFile = mongoose.model('ShipmentFile', shipmentFileSchema);
