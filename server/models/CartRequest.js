import mongoose from 'mongoose';

const cartItemDetailSchema = new mongoose.Schema({
  food_id: { type: String, required: true },
  title: { type: String },
  category: { type: String },
  quantity: { type: Number, required: true }
});

const cartRequestSchema = new mongoose.Schema({
  cart_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_name: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: String, default: '' },
  frozen: { type: Boolean, default: false },
  date: { type: String, required: true },
  items: [cartItemDetailSchema]
}, { timestamps: true });

export const CartRequest = mongoose.model('CartRequest', cartRequestSchema);
