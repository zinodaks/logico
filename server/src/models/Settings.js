import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    caution20Rate: { type: Number, required: true, default: 1000 },
    caution40Rate: { type: Number, required: true, default: 2000 },
    cautionCurrency: { type: String, enum: ['USD', 'CDF'], required: true, default: 'USD' },
  },
  { timestamps: true },
);

export const Settings = mongoose.model('Settings', settingsSchema);

export async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}
