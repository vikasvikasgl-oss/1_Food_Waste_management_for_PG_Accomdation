import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  food_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  quantity_available: { type: Number, required: true },
  cost_per_kg: { type: Number, default: 120 },
  status: { type: String, enum: ['available', 'low_stock', 'out_of_stock'], required: true }
}, { timestamps: true });

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
