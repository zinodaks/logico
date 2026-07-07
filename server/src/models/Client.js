import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true },
);

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    rccm: { type: String, trim: true },
    identificationNationale: { type: String, trim: true },
    nif: { type: String, trim: true },
    documents: { type: [documentSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Client = mongoose.model('Client', clientSchema);
