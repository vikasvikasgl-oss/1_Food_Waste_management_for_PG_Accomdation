import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  feedback_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  target_type: { type: String, enum: ['food', 'system', 'cart'], required: true },
  target_id: { type: String, required: true },
  target_title: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  date: { type: String, required: true }
}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
