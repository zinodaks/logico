import mongoose from 'mongoose';

const profitTransferSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ['USD', 'CDF'], required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const ProfitTransfer = mongoose.model('ProfitTransfer', profitTransferSchema);
