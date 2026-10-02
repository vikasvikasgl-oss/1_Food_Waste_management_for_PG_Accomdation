import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaint_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  subject: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  description: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

export const Complaint = mongoose.model('Complaint', complaintSchema);
