import mongoose from 'mongoose';
import { PAYMENT_CATEGORIES } from './paymentCategories.js';

const paymentTypeSchema = new mongoose.Schema(
  {
    category: { type: String, enum: PAYMENT_CATEGORIES, required: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

paymentTypeSchema.index({ category: 1, name: 1 }, { unique: true });

export const PaymentType = mongoose.model('PaymentType', paymentTypeSchema);
