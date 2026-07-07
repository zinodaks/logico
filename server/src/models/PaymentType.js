import mongoose from 'mongoose';

const paymentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PaymentType = mongoose.model('PaymentType', paymentTypeSchema);
