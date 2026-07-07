import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Agent = mongoose.model('Agent', agentSchema);
