import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true }, // user_id or 'all' or 'residents' or 'managers'
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['cart_approved', 'cart_rejected', 'complaint_status', 'new_menu', 'leaderboard', 'system'], 
    default: 'system' 
  },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
