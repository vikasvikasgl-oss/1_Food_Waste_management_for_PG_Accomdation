import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  item: { type: String, required: true },
  quantity_kg: { type: Number, required: true },
  recipient_ngo: { type: String, required: true },
  ngo_id: { type: String, default: '' },
  date: { type: String, required: true },
  notes: { type: String, default: '' },
  logged_by: { type: String, default: 'Manager' }
}, { timestamps: true });

export const Donation = mongoose.model('Donation', donationSchema);
