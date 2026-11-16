import mongoose from 'mongoose';
import { PAYMENT_CATEGORIES } from './paymentCategories.js';

const DIRECTIONS = PAYMENT_CATEGORIES;

const paymentSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShipmentFile',
      required: function () {
        return this.direction !== 'business_expense';
      },
    },
    direction: { type: String, enum: DIRECTIONS, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'CDF'], required: true },
    paymentType: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentType', required: true },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: function () {
        return this.direction === 'agent_payment';
      },
    },
    transporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transporter',
      required: function () {
        return this.direction === 'transporter_payment';
      },
    },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Nearly every financial aggregation (file profitability, cash balance,
// client/file statements) matches payments by file — most also by direction,
// and the per-file payment history is sorted by date. This compound index
// turns those from full-collection scans into index lookups. The `file` and
// `file + direction` prefixes are served by the same index.
paymentSchema.index({ file: 1, direction: 1, date: 1 });

// The transporter statement groups a transporter's payments by file/currency.
paymentSchema.index({ transporter: 1, direction: 1 });

export const PAYMENT_DIRECTIONS = DIRECTIONS;
export const Payment = mongoose.model('Payment', paymentSchema);
