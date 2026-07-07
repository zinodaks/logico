import mongoose from 'mongoose';

const transporterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fixedTransportCost: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'CDF'], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Transporter = mongoose.model('Transporter', transporterSchema);
