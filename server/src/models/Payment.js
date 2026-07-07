import mongoose from 'mongoose';

const DIRECTIONS = [
  'client_payment',
  'agent_payment',
  'transporter_payment',
  'generic_expense',
  'business_expense',
  'caution_deposit',
  'caution_refund',
];

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

export const PAYMENT_DIRECTIONS = DIRECTIONS;
export const Payment = mongoose.model('Payment', paymentSchema);
