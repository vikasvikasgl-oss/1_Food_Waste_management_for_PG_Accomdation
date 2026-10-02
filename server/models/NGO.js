import mongoose from 'mongoose';

const ngoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact_person: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const NGO = mongoose.model('NGO', ngoSchema);
