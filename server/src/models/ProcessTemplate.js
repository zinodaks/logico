import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const processTemplateSchema = new mongoose.Schema(
  {
    processType: { type: String, enum: ['IM4', 'TR8'], required: true, unique: true },
    steps: { type: [stepSchema], default: [] },
  },
  { timestamps: true },
);

export const ProcessTemplate = mongoose.model('ProcessTemplate', processTemplateSchema);
