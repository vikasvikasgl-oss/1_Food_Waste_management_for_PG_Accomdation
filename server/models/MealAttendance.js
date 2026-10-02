import mongoose from 'mongoose';

const mealAttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_name: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD
  slot: { type: String, required: true, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
  attending: { type: Boolean, required: true, default: true }
}, { timestamps: true });

// Compound index to ensure uniqueness per resident user, date, and meal slot
mealAttendanceSchema.index({ user_id: 1, date: 1, slot: 1 }, { unique: true });

export const MealAttendance = mongoose.model('MealAttendance', mealAttendanceSchema);
