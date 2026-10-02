import mongoose from 'mongoose';

const logEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  item: { type: String, required: true },
  prepared: { type: Number, required: true },
  consumed: { type: Number, required: true },
  donated: { type: Number, default: 0 },
  wasted: { type: Number, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

export const LogEntry = mongoose.model('LogEntry', logEntrySchema);
