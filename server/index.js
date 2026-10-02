import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { connectDB } from './db.js';
import { User } from './models/User.js';
import { FoodItem } from './models/FoodItem.js';
import { CartRequest } from './models/CartRequest.js';
import { Feedback } from './models/Feedback.js';
import { Complaint } from './models/Complaint.js';
import { LogEntry } from './models/LogEntry.js';
import { MealAttendance } from './models/MealAttendance.js';
import { Donation } from './models/Donation.js';
import { NGO } from './models/NGO.js';
import { Notification } from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food-app';
const JWT_SECRET = process.env.JWT_SECRET || 'pg_food_waste_secret_key_2026_jwt_token_secure';
const JWT_EXPIRES_IN = '7d';

let isDbConnected = false;

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

// -------------------------------------------------------------
// Validation Middleware Helper & Zod Schemas
// -------------------------------------------------------------

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstIssue = err.issues[0];
      const field = firstIssue.path.join('.');
      const msg = field ? `${field}: ${firstIssue.message}` : firstIssue.message;
      return res.status(400).json({ error: msg });
    }
    return res.status(400).json({ error: 'Invalid input data.' });
  }
};

const loginSchema = z.object({
  email: z.string().email('Valid email is required').trim(),
  password: z.string().min(1, 'Password is required')
});

const registerUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Valid email is required').trim(),
  role: z.enum(['resident', 'manager']).default('resident'),
  password: z.string().min(1, 'Password is required')
});

const foodItemSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  quantity_available: z.number({ invalid_type_error: 'Quantity must be a number' }).min(0, 'Quantity must be a non-negative number'),
  cost_per_kg: z.number({ invalid_type_error: 'Cost per kg must be a number' }).min(0, 'Cost per kg must be non-negative').optional(),
  status: z.enum(['available', 'low_stock', 'out_of_stock'])
});

const cartItemDetailSchema = z.object({
  food_id: z.string().min(1, 'Food ID is required'),
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().positive('Quantity must be greater than 0')
});

const cartRequestSchema = z.object({
  items: z.array(cartItemDetailSchema).min(1, 'At least one item is required in cart')
});

const cartStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  approved_by: z.string().optional()
});

const cartFrozenSchema = z.object({
  frozen: z.boolean({ required_error: 'Frozen status (boolean) is required' })
});

const feedbackSchema = z.object({
  target_type: z.enum(['food', 'system', 'cart']),
  target_id: z.string().min(1, 'Target ID is required'),
  target_title: z.string().min(1, 'Target title is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(1, 'Comment is required').trim()
});

const complaintSchema = z.object({
  subject: z.string().min(1, 'Subject is required').trim(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  description: z.string().min(1, 'Description is required').trim()
});

const complaintStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved'])
});

const complaintPrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high'])
});

const logSchema = z.object({
  item: z.string().min(1, 'Food item name is required').trim(),
  prepared: z.number({ invalid_type_error: 'Prepared quantity must be a number' }).min(0, 'Prepared quantity must be a non-negative number'),
  consumed: z.number({ invalid_type_error: 'Consumed quantity must be a number' }).min(0, 'Consumed quantity must be a non-negative number'),
  donated: z.number({ invalid_type_error: 'Donated quantity must be a number' }).min(0, 'Donated quantity must be non-negative').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

const mealAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  slot: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks']),
  attending: z.boolean({ required_error: 'attending is required' })
});

const donationSchema = z.object({
  item: z.string().min(1, 'Food item name is required').trim(),
  quantity_kg: z.number({ invalid_type_error: 'Quantity must be a number' }).positive('Quantity must be greater than 0'),
  recipient_ngo: z.string().min(1, 'Recipient NGO name is required').trim(),
  ngo_id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  notes: z.string().optional()
});

const ngoSchema = z.object({
  name: z.string().min(1, 'NGO name is required').trim(),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional()
});

// -------------------------------------------------------------
// Authentication & Role-Based Authorization Middlewares
// -------------------------------------------------------------

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access forbidden: ${role} role required.` });
    }
    next();
  };
};

const generateToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

// Pre-hashed passwords for seeded accounts
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const studentPasswordHash = bcrypt.hashSync('student123', 10);
const defaultPasswordHash = bcrypt.hashSync('password', 10);

// In-Memory Data Store Fallback
const memoryStore = {
  users: [
    { user_id: 'u-1', name: 'Vikas Manager', email: 'vikas@gmail.com', role: 'manager', password: adminPasswordHash },
    { user_id: 'u-2', name: 'Aarav Kumar', email: 'student@hostel.com', role: 'resident', password: studentPasswordHash },
    { user_id: 'u-3', name: 'Vikas Manager', email: 'manager@hostel.com', role: 'manager', password: adminPasswordHash },
    { user_id: 'u-4', name: 'John Resident', email: 'resident@hostel.com', role: 'resident', password: studentPasswordHash },
    { user_id: 'u-5', name: 'Vikas Admin', email: 'vikasvikasgl@gmail.com', role: 'manager', password: adminPasswordHash },
    { user_id: 'u-6', name: 'Priya Sharma', email: 'priya@hostel.com', role: 'resident', password: studentPasswordHash },
    { user_id: 'u-7', name: 'Rahul Mehta', email: 'rahul@hostel.com', role: 'resident', password: studentPasswordHash },
    { user_id: 'u-8', name: 'Ananya Rao', email: 'ananya@hostel.com', role: 'resident', password: studentPasswordHash }
  ],
  foodItems: [
    { food_id: 'food-1', title: 'Veg Biryani', category: 'Main Course', quantity_available: 100, cost_per_kg: 140, status: 'available' },
    { food_id: 'food-2', title: 'Roti & Mix Veg', category: 'Main Course', quantity_available: 80, cost_per_kg: 90, status: 'available' },
    { food_id: 'food-3', title: 'Paneer Butter Masala', category: 'Side Dish', quantity_available: 45, cost_per_kg: 180, status: 'available' },
    { food_id: 'food-4', title: 'Dal Makhani', category: 'Side Dish', quantity_available: 60, cost_per_kg: 110, status: 'available' },
    { food_id: 'food-5', title: 'Aloo Paratha', category: 'Breakfast', quantity_available: 12, cost_per_kg: 85, status: 'low_stock' },
    { food_id: 'food-6', title: 'Fruit Custard', category: 'Dessert', quantity_available: 0, cost_per_kg: 130, status: 'out_of_stock' }
  ],
  cartRequests: [
    {
      cart_id: 'cart-1',
      user_id: 'u-2',
      user_name: 'John Resident',
      status: 'approved',
      approved_by: 'Vikas Manager',
      frozen: false,
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      items: [
        { food_id: 'food-1', title: 'Veg Biryani', category: 'Main Course', quantity: 2 }
      ]
    },
    {
      cart_id: 'cart-2',
      user_id: 'u-4',
      user_name: 'Priya Sharma',
      status: 'approved',
      approved_by: 'Vikas Manager',
      frozen: false,
      date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
      items: [
        { food_id: 'food-2', title: 'Roti & Mix Veg', category: 'Main Course', quantity: 1 }
      ]
    },
    {
      cart_id: 'cart-3',
      user_id: 'u-5',
      user_name: 'Rahul Mehta',
      status: 'approved',
      approved_by: 'Vikas Manager',
      frozen: false,
      date: new Date(Date.now() - 36 * 3600 * 1000).toISOString().split('T')[0],
      items: [
        { food_id: 'food-3', title: 'Paneer Butter Masala', category: 'Side Dish', quantity: 1 }
      ]
    }
  ],
  feedbacks: [
    {
      feedback_id: 'feed-1',
      user_id: 'u-2',
      user_name: 'John Resident',
      target_type: 'food',
      target_id: 'food-3',
      target_title: 'Paneer Butter Masala',
      rating: 5,
      comment: 'Absolutely delicious Paneer Butter Masala! Rich gravy and tender paneer.',
      resolved: false,
      date: new Date(Date.now() - 12 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-2',
      user_id: 'u-4',
      user_name: 'Priya Sharma',
      target_type: 'food',
      target_id: 'food-3',
      target_title: 'Paneer Butter Masala',
      rating: 5,
      comment: 'Best side dish on the hostel menu. Perfectly spiced and always finished completely.',
      resolved: true,
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-3',
      user_id: 'u-5',
      user_name: 'Rahul Mehta',
      target_type: 'food',
      target_id: 'food-1',
      target_title: 'Veg Biryani',
      rating: 5,
      comment: 'Aromatic biryani with fresh vegetables and fried onions. Authentic flavor!',
      resolved: true,
      date: new Date(Date.now() - 36 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-4',
      user_id: 'u-6',
      user_name: 'Ananya Rao',
      target_type: 'food',
      target_id: 'food-1',
      target_title: 'Veg Biryani',
      rating: 4,
      comment: 'Biryani was tasty, raita on the side made it even better.',
      resolved: true,
      date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-5',
      user_id: 'u-2',
      user_name: 'John Resident',
      target_type: 'food',
      target_id: 'food-6',
      target_title: 'Fruit Custard',
      rating: 4,
      comment: 'Delicious chilled dessert, great mix of pomegranates, apples and bananas.',
      resolved: true,
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-6',
      user_id: 'u-4',
      user_name: 'Priya Sharma',
      target_type: 'food',
      target_id: 'food-6',
      target_title: 'Fruit Custard',
      rating: 5,
      comment: 'Top quality dessert. Sweetness level was balanced.',
      resolved: true,
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-7',
      user_id: 'u-5',
      user_name: 'Rahul Mehta',
      target_type: 'food',
      target_id: 'food-2',
      target_title: 'Roti & Mix Veg',
      rating: 3,
      comment: 'Rotis were soft, but the mix vegetable curry was slightly bland.',
      resolved: false,
      date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-8',
      user_id: 'u-2',
      user_name: 'John Resident',
      target_type: 'food',
      target_id: 'food-5',
      target_title: 'Aloo Paratha',
      rating: 2,
      comment: 'Parathas are too greasy and the potato filling is undercooked in the center. Left half on my plate.',
      resolved: false,
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-9',
      user_id: 'u-6',
      user_name: 'Ananya Rao',
      target_type: 'food',
      target_id: 'food-5',
      target_title: 'Aloo Paratha',
      rating: 2,
      comment: 'Dough was raw inside and stuffing lacked salt and spices. Excessive wastage observed.',
      resolved: false,
      date: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-10',
      user_id: 'u-4',
      user_name: 'Priya Sharma',
      target_type: 'food',
      target_id: 'food-4',
      target_title: 'Dal Makhani',
      rating: 2,
      comment: 'Too watery and lentils were hard/undercooked. Very few students ate it.',
      resolved: false,
      date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-11',
      user_id: 'u-5',
      user_name: 'Rahul Mehta',
      target_type: 'food',
      target_id: 'food-4',
      target_title: 'Dal Makhani',
      rating: 2,
      comment: 'Lacks butter and slow-simmered flavor. Needs a recipe rework.',
      resolved: false,
      date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      feedback_id: 'feed-12',
      user_id: 'u-2',
      user_name: 'John Resident',
      target_type: 'system',
      target_id: 'system',
      target_title: 'Global System',
      rating: 5,
      comment: 'The dashboard works smoothly and waste tracking is transparent. Excellent UI!',
      resolved: true,
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0]
    }
  ],
  complaints: [
    {
      complaint_id: 'comp-1',
      user_id: 'u-2',
      user_name: 'John Resident',
      subject: 'Slow Service during dinner hours',
      priority: 'medium',
      status: 'open',
      description: 'Between 8:30 PM and 9:00 PM, the lines are extremely long and food items are slow to be refilled.',
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0]
    },
    {
      complaint_id: 'comp-2',
      user_id: 'u-2',
      user_name: 'John Resident',
      subject: 'Fruit custard was out of stock too early',
      priority: 'low',
      status: 'resolved',
      description: 'Last Thursday, the fruit custard dessert ran out within the first 30 minutes of lunchtime.',
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
    }
  ],
  logs: [
    { id: "log-1", item: "Veg Biryani", prepared: 120, consumed: 105, donated: 0, wasted: 15, date: "2026-06-18" },
    { id: "log-2", item: "Paneer Butter Masala", prepared: 80, consumed: 76, donated: 0, wasted: 4, date: "2026-06-19" },
    { id: "log-3", item: "Dal Makhani", prepared: 95, consumed: 60, donated: 0, wasted: 35, date: "2026-06-20" },
    { id: "log-4", item: "Aloo Paratha", prepared: 80, consumed: 50, donated: 0, wasted: 30, date: "2026-06-21" },
    { id: "log-5", item: "Fruit Custard", prepared: 60, consumed: 56, donated: 0, wasted: 4, date: "2026-06-22" },
    { id: "log-6", item: "Roti & Mix Veg", prepared: 100, consumed: 88, donated: 0, wasted: 12, date: "2026-06-23" }
  ],
  mealAttendances: [
    {
      id: "att-1",
      user_id: "u-2",
      user_name: "John Resident",
      date: new Date().toISOString().split('T')[0],
      slot: "Lunch",
      attending: false
    },
    {
      id: "att-2",
      user_id: "u-4",
      user_name: "Priya Sharma",
      date: new Date().toISOString().split('T')[0],
      slot: "Dinner",
      attending: false
    },
    {
      id: "att-3",
      user_id: "u-4",
      user_name: "Priya Sharma",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      slot: "Lunch",
      attending: false
    },
    {
      id: "att-4",
      user_id: "u-4",
      user_name: "Priya Sharma",
      date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
      slot: "Breakfast",
      attending: false
    },
    {
      id: "att-5",
      user_id: "u-5",
      user_name: "Rahul Mehta",
      date: new Date().toISOString().split('T')[0],
      slot: "Breakfast",
      attending: false
    },
    {
      id: "att-6",
      user_id: "u-5",
      user_name: "Rahul Mehta",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      slot: "Dinner",
      attending: false
    },
    {
      id: "att-7",
      user_id: "u-6",
      user_name: "Ananya Rao",
      date: new Date().toISOString().split('T')[0],
      slot: "Lunch",
      attending: true
    }
  ],
  ngos: [
    {
      id: "ngo-1",
      name: "Robin Hood Army - Bangalore Chapter",
      contact_person: "Ananya Sharma",
      phone: "+91 98765 43210",
      email: "ananya@robinhoodarmy.com",
      address: "Koramangala 5th Block, Bangalore",
      active: true
    },
    {
      id: "ngo-2",
      name: "Feeding India (Zomato)",
      contact_person: "Rahul Verma",
      phone: "+91 98123 45678",
      email: "rahul@feedingindia.org",
      address: "Indiranagar 100ft Road, Bangalore",
      active: true
    },
    {
      id: "ngo-3",
      name: "Roti Bank Foundation",
      contact_person: "Suresh Patil",
      phone: "+91 97654 32109",
      email: "contact@rotibank.org",
      address: "BTM Layout 2nd Stage, Bangalore",
      active: true
    }
  ],
  donations: [
    {
      id: "don-1",
      item: "Veg Biryani",
      quantity_kg: 10,
      recipient_ngo: "Robin Hood Army - Bangalore Chapter",
      ngo_id: "ngo-1",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      notes: "Surplus fresh lunch batch packed safely in food-grade containers.",
      logged_by: "Vikas Manager"
    }
  ],
  notifications: [
    {
      id: "notif-1",
      user_id: "all",
      title: "New Menu Item Published",
      message: "Chef's Special Veg Biryani & Paneer Masala has been added to today's menu!",
      type: "new_menu",
      read: false,
      link: "order",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: "notif-2",
      user_id: "u-2",
      title: "Cart Request Approved",
      message: "Your meal cart request #cart-1 was approved by Vikas Manager.",
      type: "cart_approved",
      read: false,
      link: "my_requests",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "notif-3",
      user_id: "u-2",
      title: "Complaint Status Changed",
      message: "Your complaint 'Fruit custard was out of stock too early' was marked as resolved.",
      type: "complaint_status",
      read: true,
      link: "contact",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: "notif-4",
      user_id: "all",
      title: "Zero Waste Hero Leaderboard Updated",
      message: "Check out this week's top Eco Champions on the new Zero Waste Hero Leaderboard!",
      type: "leaderboard",
      read: false,
      link: "leaderboard",
      createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    }
  ]
};

// Helper function to create in-app notifications
export const createInAppNotification = async ({ user_id = 'all', title, message, type = 'system', link = '' }) => {
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const notif = {
    id: notifId,
    user_id,
    title,
    message,
    type,
    read: false,
    link,
    createdAt: new Date().toISOString()
  };

  if (isDbConnected) {
    try {
      const doc = new Notification(notif);
      await doc.save();
      return doc;
    } catch (e) {
      console.error('Error saving notification in MongoDB:', e.message);
    }
  }

  memoryStore.notifications.unshift(notif);
  return notif;
};

// Seeding function for MongoDB if connected
const seedDatabase = async () => {
  try {
    const foodCount = await FoodItem.countDocuments();
    if (foodCount === 0) {
      await FoodItem.insertMany(memoryStore.foodItems);
      console.log('Seeded default food items in MongoDB.');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(memoryStore.users);
      console.log('Seeded default users with bcrypt hashes in MongoDB.');
    }

    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      await Complaint.insertMany(memoryStore.complaints);
      console.log('Seeded default complaints in MongoDB.');
    }

    const feedbackCount = await Feedback.countDocuments();
    if (feedbackCount === 0) {
      await Feedback.insertMany(memoryStore.feedbacks);
      console.log('Seeded default feedbacks in MongoDB.');
    }

    const logsCount = await LogEntry.countDocuments();
    if (logsCount === 0) {
      await LogEntry.insertMany(memoryStore.logs);
      console.log('Seeded default daily logs in MongoDB.');
    }

    const attendanceCount = await MealAttendance.countDocuments();
    if (attendanceCount === 0) {
      await MealAttendance.insertMany(memoryStore.mealAttendances);
      console.log('Seeded default meal attendances in MongoDB.');
    }

    const ngoCount = await NGO.countDocuments();
    if (ngoCount === 0) {
      await NGO.insertMany(memoryStore.ngos);
      console.log('Seeded default NGOs in MongoDB.');
    }

    const donationCount = await Donation.countDocuments();
    if (donationCount === 0) {
      await Donation.insertMany(memoryStore.donations);
      console.log('Seeded default donations in MongoDB.');
    }

    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.insertMany(memoryStore.notifications);
      console.log('Seeded default in-app notifications in MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let foundUser = null;

    if (isDbConnected) {
      foundUser = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      foundUser = memoryStore.users.find(
        u => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = sanitizeUser(foundUser);
    const token = generateToken(safeUser);

    res.json({
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res, next) => {
  try {
    let foundUser = null;
    if (isDbConnected) {
      foundUser = await User.findOne({ user_id: req.user.user_id });
    } else {
      foundUser = memoryStore.users.find(u => u.user_id === req.user.user_id);
    }
    if (!foundUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(sanitizeUser(foundUser));
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// User Management Endpoints
// -------------------------------------------------------------

app.get('/api/users', async (req, res, next) => {
  try {
    if (isDbConnected) {
      const users = await User.find({}).select('-password');
      return res.json(users);
    }
    const safeUsers = memoryStore.users.map(sanitizeUser);
    res.json(safeUsers);
  } catch (error) {
    next(error);
  }
});

const handleRegisterUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user_id = `user-${Date.now()}`;

    if (isDbConnected) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const newUser = new User({
        user_id,
        name: name.trim(),
        email: normalizedEmail,
        role: role || 'resident',
        password
      });
      await newUser.save();

      const safeUser = sanitizeUser(newUser);
      const token = generateToken(safeUser);
      return res.status(201).json({ token, user: safeUser });
    }

    const existingMem = memoryStore.users.find(u => u.email.toLowerCase().trim() === normalizedEmail);
    if (existingMem) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newMemUser = {
      user_id,
      name: name.trim(),
      email: normalizedEmail,
      role: role || 'resident',
      password: hashedPassword
    };
    memoryStore.users.push(newMemUser);

    const safeUser = sanitizeUser(newMemUser);
    const token = generateToken(safeUser);
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    next(error);
  }
};

app.post('/api/users', validate(registerUserSchema), handleRegisterUser);
app.post('/api/auth/register', validate(registerUserSchema), handleRegisterUser);

// -------------------------------------------------------------
// FoodItem Endpoints
// -------------------------------------------------------------

app.get('/api/food-items', async (req, res, next) => {
  try {
    if (isDbConnected) {
      const items = await FoodItem.find({});
      return res.json(items);
    }
    res.json(memoryStore.foodItems);
  } catch (error) {
    next(error);
  }
});

app.post('/api/food-items', authMiddleware, requireRole('manager'), validate(foodItemSchema), async (req, res, next) => {
  try {
    const { title, category, quantity_available, status } = req.body;
    const food_id = `food-${Date.now()}`;
    const newItem = { food_id, title, category, quantity_available, status };

    if (isDbConnected) {
      const dbItem = new FoodItem(newItem);
      await dbItem.save();
      await createInAppNotification({
        user_id: 'all',
        title: 'New Menu Item Published',
        message: `Fresh dish added: ${title} (${category}) with ${quantity_available} kg available!`,
        type: 'new_menu',
        link: 'order'
      });
      return res.status(201).json(dbItem);
    }

    memoryStore.foodItems.push(newItem);
    await createInAppNotification({
      user_id: 'all',
      title: 'New Menu Item Published',
      message: `Fresh dish added: ${title} (${category}) with ${quantity_available} kg available!`,
      type: 'new_menu',
      link: 'order'
    });
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

app.put('/api/food-items/:food_id', authMiddleware, requireRole('manager'), validate(foodItemSchema), async (req, res, next) => {
  try {
    const { food_id } = req.params;
    const { title, category, quantity_available, status } = req.body;

    if (isDbConnected) {
      const updated = await FoodItem.findOneAndUpdate(
        { food_id },
        { title, category, quantity_available, status },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Food item not found.' });
      return res.json(updated);
    }

    const index = memoryStore.foodItems.findIndex(i => i.food_id === food_id);
    if (index === -1) return res.status(404).json({ error: 'Food item not found.' });
    memoryStore.foodItems[index] = {
      ...memoryStore.foodItems[index],
      title,
      category,
      quantity_available,
      status
    };
    res.json(memoryStore.foodItems[index]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/food-items/:food_id', authMiddleware, requireRole('manager'), async (req, res, next) => {
  try {
    const { food_id } = req.params;
    if (isDbConnected) {
      const deleted = await FoodItem.findOneAndDelete({ food_id });
      if (!deleted) return res.status(404).json({ error: 'Food item not found.' });
      return res.json({ success: true });
    }

    const index = memoryStore.foodItems.findIndex(i => i.food_id === food_id);
    if (index === -1) return res.status(404).json({ error: 'Food item not found.' });
    memoryStore.foodItems.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// CartRequest Endpoints
// -------------------------------------------------------------

app.get('/api/cart-requests', authMiddleware, async (req, res, next) => {
  try {
    const isManager = req.user.role === 'manager';

    if (isDbConnected) {
      const query = isManager ? {} : { user_id: req.user.user_id };
      const requests = await CartRequest.find(query).sort({ createdAt: -1 });
      return res.json(requests);
    }

    const requests = isManager 
      ? memoryStore.cartRequests 
      : memoryStore.cartRequests.filter(r => r.user_id === req.user.user_id);
    
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

const computeFoodStatus = (qty) => {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= 15) return 'low_stock';
  return 'available';
};

app.post('/api/cart-requests', authMiddleware, validate(cartRequestSchema), async (req, res, next) => {
  try {
    const { items } = req.body;
    const user_id = req.user.user_id;
    const user_name = req.user.name || req.body.user_name || 'Resident';

    // Validate that items are available in stock and quantity requested does not exceed available
    if (isDbConnected) {
      for (const item of items) {
        const food = await FoodItem.findOne({ food_id: item.food_id });
        if (!food) {
          return res.status(400).json({ error: `Food item '${item.title}' not found.` });
        }
        if (food.status === 'out_of_stock' || food.quantity_available <= 0) {
          return res.status(400).json({ error: `'${food.title}' is currently out of stock.` });
        }
        if (item.quantity > food.quantity_available) {
          return res.status(400).json({ 
            error: `Cannot request ${item.quantity} kg of '${food.title}'. Only ${food.quantity_available} kg available.` 
          });
        }
      }
    } else {
      for (const item of items) {
        const food = memoryStore.foodItems.find(f => f.food_id === item.food_id);
        if (!food) {
          return res.status(400).json({ error: `Food item '${item.title}' not found.` });
        }
        if (food.status === 'out_of_stock' || food.quantity_available <= 0) {
          return res.status(400).json({ error: `'${food.title}' is currently out of stock.` });
        }
        if (item.quantity > food.quantity_available) {
          return res.status(400).json({ 
            error: `Cannot request ${item.quantity} kg of '${food.title}'. Only ${food.quantity_available} kg available.` 
          });
        }
      }
    }

    const cart_id = `cart-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const newRequest = {
      cart_id,
      user_id,
      user_name,
      status: 'pending',
      approved_by: '',
      frozen: false,
      date,
      items
    };

    if (isDbConnected) {
      const dbRequest = new CartRequest(newRequest);
      await dbRequest.save();
      return res.status(201).json(dbRequest);
    }

    memoryStore.cartRequests.unshift(newRequest);
    res.status(201).json(newRequest);
  } catch (error) {
    next(error);
  }
});

app.put('/api/cart-requests/:cart_id/status', authMiddleware, requireRole('manager'), validate(cartStatusSchema), async (req, res, next) => {
  try {
    const { cart_id } = req.params;
    const { status, approved_by } = req.body;

    if (isDbConnected) {
      const cart = await CartRequest.findOne({ cart_id });
      if (!cart) return res.status(404).json({ error: 'Cart request not found.' });

      const currentStatus = cart.status;
      const newStatus = status;

      if (newStatus === 'approved' && currentStatus !== 'approved') {
        // 1. Check all items for sufficient stock
        for (const item of cart.items) {
          const food = await FoodItem.findOne({ food_id: item.food_id });
          if (!food) {
            return res.status(400).json({ error: `Food item '${item.title}' not found in inventory.` });
          }
          if (food.quantity_available < item.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for '${food.title}'. Available: ${food.quantity_available} kg, Requested: ${item.quantity} kg.`
            });
          }
        }
        // 2. Deduct quantities and recompute statuses
        for (const item of cart.items) {
          const food = await FoodItem.findOne({ food_id: item.food_id });
          const newQty = Math.max(0, food.quantity_available - item.quantity);
          food.quantity_available = newQty;
          food.status = computeFoodStatus(newQty);
          await food.save();
        }
      } else if (newStatus === 'rejected' && currentStatus === 'approved') {
        // Restore stock when an approved cart is rejected
        for (const item of cart.items) {
          const food = await FoodItem.findOne({ food_id: item.food_id });
          if (food) {
            const newQty = food.quantity_available + item.quantity;
            food.quantity_available = newQty;
            food.status = computeFoodStatus(newQty);
            await food.save();
          }
        }
      }

      cart.status = newStatus;
      cart.approved_by = approved_by || req.user.name;
      await cart.save();

      // Trigger notification to resident
      await createInAppNotification({
        user_id: cart.user_id,
        title: newStatus === 'approved' ? 'Cart Request Approved' : 'Cart Request Rejected',
        message: newStatus === 'approved' 
          ? `Your meal request #${cart.cart_id} has been approved by ${cart.approved_by}.` 
          : `Your meal request #${cart.cart_id} was rejected by management.`,
        type: newStatus === 'approved' ? 'cart_approved' : 'cart_rejected',
        link: 'my_requests'
      });

      return res.json(cart);
    }

    // In-Memory Fallback
    const cart = memoryStore.cartRequests.find(r => r.cart_id === cart_id);
    if (!cart) return res.status(404).json({ error: 'Cart request not found.' });

    const currentStatus = cart.status;
    const newStatus = status;

    if (newStatus === 'approved' && currentStatus !== 'approved') {
      // 1. Check all items for sufficient stock
      for (const item of cart.items) {
        const food = memoryStore.foodItems.find(f => f.food_id === item.food_id);
        if (!food) {
          return res.status(400).json({ error: `Food item '${item.title}' not found in inventory.` });
        }
        if (food.quantity_available < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for '${food.title}'. Available: ${food.quantity_available} kg, Requested: ${item.quantity} kg.`
          });
        }
      }
      // 2. Deduct quantities and recompute statuses
      for (const item of cart.items) {
        const food = memoryStore.foodItems.find(f => f.food_id === item.food_id);
        const newQty = Math.max(0, food.quantity_available - item.quantity);
        food.quantity_available = newQty;
        food.status = computeFoodStatus(newQty);
      }
    } else if (newStatus === 'rejected' && currentStatus === 'approved') {
      // Restore stock when an approved cart is rejected
      for (const item of cart.items) {
        const food = memoryStore.foodItems.find(f => f.food_id === item.food_id);
        if (food) {
          const newQty = food.quantity_available + item.quantity;
          food.quantity_available = newQty;
          food.status = computeFoodStatus(newQty);
        }
      }
    }

    cart.status = newStatus;
    cart.approved_by = approved_by || req.user.name;

    // Trigger notification to resident in-memory
    await createInAppNotification({
      user_id: cart.user_id,
      title: newStatus === 'approved' ? 'Cart Request Approved' : 'Cart Request Rejected',
      message: newStatus === 'approved' 
        ? `Your meal request #${cart.cart_id} has been approved by ${cart.approved_by}.` 
        : `Your meal request #${cart.cart_id} was rejected by management.`,
      type: newStatus === 'approved' ? 'cart_approved' : 'cart_rejected',
      link: 'my_requests'
    });

    res.json(cart);
  } catch (error) {
    next(error);
  }
});

app.put('/api/cart-requests/:cart_id/frozen', authMiddleware, requireRole('manager'), validate(cartFrozenSchema), async (req, res, next) => {
  try {
    const { cart_id } = req.params;
    const { frozen } = req.body;

    if (isDbConnected) {
      const updated = await CartRequest.findOneAndUpdate(
        { cart_id },
        { frozen },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Cart request not found.' });
      return res.json(updated);
    }

    const reqItem = memoryStore.cartRequests.find(r => r.cart_id === cart_id);
    if (!reqItem) return res.status(404).json({ error: 'Cart request not found.' });
    reqItem.frozen = frozen;
    res.json(reqItem);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Feedbacks Endpoints
// -------------------------------------------------------------

app.get('/api/feedbacks', async (req, res, next) => {
  try {
    if (isDbConnected) {
      const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
      return res.json(feedbacks);
    }
    res.json(memoryStore.feedbacks);
  } catch (error) {
    next(error);
  }
});

app.post('/api/feedbacks', authMiddleware, validate(feedbackSchema), async (req, res, next) => {
  try {
    const { target_type, target_id, target_title, rating, comment } = req.body;
    const user_id = req.user.user_id;
    const user_name = req.user.name || req.body.user_name || 'Resident';
    const feedback_id = `feed-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const newFeedback = {
      feedback_id,
      user_id,
      user_name,
      target_type,
      target_id,
      target_title,
      rating,
      comment,
      resolved: false,
      date
    };

    if (isDbConnected) {
      const dbFeedback = new Feedback(newFeedback);
      await dbFeedback.save();
      return res.status(201).json(dbFeedback);
    }

    memoryStore.feedbacks.unshift(newFeedback);
    res.status(201).json(newFeedback);
  } catch (error) {
    next(error);
  }
});

app.put('/api/feedbacks/:feedback_id/resolve', authMiddleware, requireRole('manager'), async (req, res, next) => {
  try {
    const { feedback_id } = req.params;

    if (isDbConnected) {
      const updated = await Feedback.findOneAndUpdate(
        { feedback_id },
        { resolved: true },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Feedback not found.' });
      return res.json(updated);
    }

    const item = memoryStore.feedbacks.find(f => f.feedback_id === feedback_id);
    if (!item) return res.status(404).json({ error: 'Feedback not found.' });
    item.resolved = true;
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Complaints Endpoints
// -------------------------------------------------------------

app.get('/api/complaints', async (req, res, next) => {
  try {
    if (isDbConnected) {
      const complaints = await Complaint.find({}).sort({ createdAt: -1 });
      return res.json(complaints);
    }
    res.json(memoryStore.complaints);
  } catch (error) {
    next(error);
  }
});

app.post('/api/complaints', authMiddleware, validate(complaintSchema), async (req, res, next) => {
  try {
    const { subject, priority, description } = req.body;
    const user_id = req.user.user_id;
    const user_name = req.user.name || req.body.user_name || 'Resident';
    const complaint_id = `comp-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const newComplaint = {
      complaint_id,
      user_id,
      user_name,
      subject,
      priority: priority || 'medium',
      status: 'open',
      description,
      date
    };

    if (isDbConnected) {
      const dbComplaint = new Complaint(newComplaint);
      await dbComplaint.save();
      return res.status(201).json(dbComplaint);
    }

    memoryStore.complaints.unshift(newComplaint);
    res.status(201).json(newComplaint);
  } catch (error) {
    next(error);
  }
});

app.put('/api/complaints/:complaint_id/status', authMiddleware, requireRole('manager'), validate(complaintStatusSchema), async (req, res, next) => {
  try {
    const { complaint_id } = req.params;
    const { status } = req.body;

    if (isDbConnected) {
      const updated = await Complaint.findOneAndUpdate(
        { complaint_id },
        { status },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Complaint not found.' });
      
      // Trigger notification to resident
      await createInAppNotification({
        user_id: updated.user_id,
        title: 'Complaint Status Updated',
        message: `Your complaint "${updated.subject}" status has been changed to "${status.replace('_', ' ')}".`,
        type: 'complaint_status',
        link: 'contact'
      });

      return res.json(updated);
    }

    const item = memoryStore.complaints.find(c => c.complaint_id === complaint_id);
    if (!item) return res.status(404).json({ error: 'Complaint not found.' });
    item.status = status;

    // Trigger notification to resident in-memory
    await createInAppNotification({
      user_id: item.user_id,
      title: 'Complaint Status Updated',
      message: `Your complaint "${item.subject}" status has been changed to "${status.replace('_', ' ')}".`,
      type: 'complaint_status',
      link: 'contact'
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/api/complaints/:complaint_id/priority', authMiddleware, requireRole('manager'), validate(complaintPrioritySchema), async (req, res, next) => {
  try {
    const { complaint_id } = req.params;
    const { priority } = req.body;

    if (isDbConnected) {
      const updated = await Complaint.findOneAndUpdate(
        { complaint_id },
        { priority },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Complaint not found.' });
      return res.json(updated);
    }

    const item = memoryStore.complaints.find(c => c.complaint_id === complaint_id);
    if (!item) return res.status(404).json({ error: 'Complaint not found.' });
    item.priority = priority;
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Logs Endpoints
// -------------------------------------------------------------

app.get('/api/logs', async (req, res, next) => {
  try {
    if (isDbConnected) {
      const logs = await LogEntry.find({}).sort({ date: -1, createdAt: -1 });
      return res.json(logs);
    }
    res.json(memoryStore.logs);
  } catch (error) {
    next(error);
  }
});

app.post('/api/logs', authMiddleware, requireRole('manager'), validate(logSchema), async (req, res, next) => {
  try {
    const { item, prepared, consumed, donated = 0, date } = req.body;
    const id = `log-${Date.now()}`;
    const donatedKg = Number(donated) || 0;
    // Count donated food separately from wasted: Wasted = Prepared - Consumed - Donated
    const wasted = Math.max(0, prepared - consumed - donatedKg);
    const finalDate = date || new Date().toISOString().split('T')[0];
    const newLog = {
      id,
      item,
      prepared,
      consumed,
      donated: donatedKg,
      wasted,
      date: finalDate
    };

    if (isDbConnected) {
      const dbLog = new LogEntry(newLog);
      await dbLog.save();
      return res.status(201).json(dbLog);
    }

    memoryStore.logs.unshift(newLog);
    res.status(201).json(newLog);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/logs/:id', authMiddleware, requireRole('manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      const deleted = await LogEntry.findOneAndDelete({ id });
      if (!deleted) return res.status(404).json({ error: 'Log entry not found.' });
      return res.json({ success: true });
    }

    const index = memoryStore.logs.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ error: 'Log entry not found.' });
    memoryStore.logs.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Meal Attendance & Headcount Endpoints
// -------------------------------------------------------------

// GET /api/meal-attendance
// Residents can fetch their own attendance or specific dates; Managers can query all
app.get('/api/meal-attendance', authMiddleware, async (req, res, next) => {
  try {
    const { date, slot, user_id } = req.query;
    const filter = {};

    // If resident and not explicitly querying with manager role, default/restrict to own user_id
    if (req.user.role === 'resident') {
      filter.user_id = req.user.user_id;
    } else if (user_id) {
      filter.user_id = user_id;
    }

    if (date) filter.date = date;
    if (slot) filter.slot = slot;

    if (isDbConnected) {
      const records = await MealAttendance.find(filter).sort({ date: 1, slot: 1 });
      return res.json(records);
    }

    let results = [...memoryStore.mealAttendances];
    if (filter.user_id) results = results.filter(r => r.user_id === filter.user_id);
    if (filter.date) results = results.filter(r => r.date === filter.date);
    if (filter.slot) results = results.filter(r => r.slot === filter.slot);

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// POST /api/meal-attendance (Upsert attendance status for logged-in resident/user)
app.post('/api/meal-attendance', authMiddleware, validate(mealAttendanceSchema), async (req, res, next) => {
  try {
    const { date, slot, attending } = req.body;
    const user_id = req.user.user_id;
    const user_name = req.user.name || 'Resident';

    if (isDbConnected) {
      const record = await MealAttendance.findOneAndUpdate(
        { user_id, date, slot },
        {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user_id,
          user_name,
          date,
          slot,
          attending
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json(record);
    }

    const existingIndex = memoryStore.mealAttendances.findIndex(
      r => r.user_id === user_id && r.date === date && r.slot === slot
    );

    if (existingIndex >= 0) {
      memoryStore.mealAttendances[existingIndex].attending = attending;
      memoryStore.mealAttendances[existingIndex].user_name = user_name;
      return res.json(memoryStore.mealAttendances[existingIndex]);
    }

    const newRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id,
      user_name,
      date,
      slot,
      attending
    };

    memoryStore.mealAttendances.push(newRecord);
    res.status(201).json(newRecord);
  } catch (error) {
    next(error);
  }
});

// GET /api/meal-attendance/summary (Aggregates headcount for a slot/date)
app.get('/api/meal-attendance/summary', authMiddleware, async (req, res, next) => {
  try {
    const { date, slot } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetSlot = slot || 'Lunch';

    let totalResidents = 50; // Baseline PG hostel capacity
    if (isDbConnected) {
      const residentCount = await User.countDocuments({ role: 'resident' });
      if (residentCount > 0) totalResidents = Math.max(residentCount, 50);

      const skipCount = await MealAttendance.countDocuments({
        date: targetDate,
        slot: targetSlot,
        attending: false
      });
      const attendingCount = await MealAttendance.countDocuments({
        date: targetDate,
        slot: targetSlot,
        attending: true
      });

      const expectedHeadcount = Math.max(1, totalResidents - skipCount);

      return res.json({
        date: targetDate,
        slot: targetSlot,
        totalResidents,
        attendingCount,
        skippedCount: skipCount,
        expectedHeadcount
      });
    }

    const memoryResidents = memoryStore.users.filter(u => u.role === 'resident').length;
    if (memoryResidents > 0) totalResidents = Math.max(memoryResidents, 50);

    const skipped = memoryStore.mealAttendances.filter(
      r => r.date === targetDate && r.slot === targetSlot && r.attending === false
    ).length;
    const attending = memoryStore.mealAttendances.filter(
      r => r.date === targetDate && r.slot === targetSlot && r.attending === true
    ).length;

    const expectedHeadcount = Math.max(1, totalResidents - skipped);

    res.json({
      date: targetDate,
      slot: targetSlot,
      totalResidents,
      attendingCount: attending,
      skippedCount: skipped,
      expectedHeadcount
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// NGOs & Surplus Food Donations Endpoints
// -------------------------------------------------------------

// GET /api/ngos
app.get('/api/ngos', authMiddleware, async (req, res, next) => {
  try {
    if (isDbConnected) {
      const ngos = await NGO.find({ active: true }).sort({ name: 1 });
      return res.json(ngos);
    }
    res.json(memoryStore.ngos.filter(n => n.active !== false));
  } catch (error) {
    next(error);
  }
});

// POST /api/ngos (Manager creates/saves a recipient NGO)
app.post('/api/ngos', authMiddleware, requireRole('manager'), validate(ngoSchema), async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    const newNgo = {
      id: `ngo-${Date.now()}`,
      name,
      contact_person: contact_person || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      active: true
    };

    if (isDbConnected) {
      const doc = new NGO(newNgo);
      await doc.save();
      return res.status(201).json(doc);
    }

    memoryStore.ngos.push(newNgo);
    res.status(201).json(newNgo);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ngos/:id
app.delete('/api/ngos/:id', authMiddleware, requireRole('manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      const deleted = await NGO.findOneAndDelete({ id });
      if (!deleted) return res.status(404).json({ error: 'NGO not found.' });
      return res.json({ success: true });
    }

    const index = memoryStore.ngos.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'NGO not found.' });
    memoryStore.ngos.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/donations
app.get('/api/donations', authMiddleware, async (req, res, next) => {
  try {
    if (isDbConnected) {
      const donations = await Donation.find({}).sort({ date: -1, createdAt: -1 });
      return res.json(donations);
    }
    res.json(memoryStore.donations);
  } catch (error) {
    next(error);
  }
});

// POST /api/donations (Manager logs surplus food donation)
app.post('/api/donations', authMiddleware, requireRole('manager'), validate(donationSchema), async (req, res, next) => {
  try {
    const { item, quantity_kg, recipient_ngo, ngo_id, date, notes } = req.body;
    const newDonation = {
      id: `don-${Date.now()}`,
      item,
      quantity_kg,
      recipient_ngo,
      ngo_id: ngo_id || '',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      logged_by: req.user.name || 'Manager'
    };

    if (isDbConnected) {
      const doc = new Donation(newDonation);
      await doc.save();
      return res.status(201).json(doc);
    }

    memoryStore.donations.unshift(newDonation);
    res.status(201).json(newDonation);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/donations/:id
app.delete('/api/donations/:id', authMiddleware, requireRole('manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      const deleted = await Donation.findOneAndDelete({ id });
      if (!deleted) return res.status(404).json({ error: 'Donation record not found.' });
      return res.json({ success: true });
    }

    const index = memoryStore.donations.findIndex(d => d.id === id);
    if (index === -1) return res.status(404).json({ error: 'Donation record not found.' });
    memoryStore.donations.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Notifications Endpoints
// -------------------------------------------------------------

// GET /api/notifications (Fetch relevant notifications for current user, polled every 30s)
app.get('/api/notifications', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role; // 'resident' or 'manager'
    const roleAudience = userRole === 'manager' ? 'managers' : 'residents';

    if (isDbConnected) {
      const notifications = await Notification.find({
        $or: [
          { user_id: userId },
          { user_id: 'all' },
          { user_id: roleAudience }
        ]
      }).sort({ createdAt: -1 }).limit(50);
      return res.json(notifications);
    }

    const filtered = memoryStore.notifications.filter(n => 
      n.user_id === userId || n.user_id === 'all' || n.user_id === roleAudience
    );
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read (Mark a single notification as read)
app.put('/api/notifications/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      const updated = await Notification.findOneAndUpdate(
        { id },
        { read: true },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Notification not found.' });
      return res.json(updated);
    }

    const notif = memoryStore.notifications.find(n => n.id === id);
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });
    notif.read = true;
    res.json(notif);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all (Mark all notifications for current user as read)
app.put('/api/notifications/read-all', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    const roleAudience = userRole === 'manager' ? 'managers' : 'residents';

    if (isDbConnected) {
      await Notification.updateMany(
        {
          $or: [
            { user_id: userId },
            { user_id: 'all' },
            { user_id: roleAudience }
          ]
        },
        { read: true }
      );
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    memoryStore.notifications.forEach(n => {
      if (n.user_id === userId || n.user_id === 'all' || n.user_id === roleAudience) {
        n.read = true;
      }
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id (Delete notification)
app.delete('/api/notifications/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      const deleted = await Notification.findOneAndDelete({ id });
      if (!deleted) return res.status(404).json({ error: 'Notification not found.' });
      return res.json({ success: true });
    }

    const index = memoryStore.notifications.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'Notification not found.' });
    memoryStore.notifications.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Zero Waste Hero Leaderboard Endpoints
// -------------------------------------------------------------

// GET /api/leaderboard
// Computes and returns rankings and gamified stats for residents based on:
// 1. Meals reliably skipped in advance (attending === false) -> saves prep waste!
// 2. High ratio of approved vs rejected cart orders
// 3. Positive system & food feedback contributions
app.get('/api/leaderboard', authMiddleware, async (req, res, next) => {
  try {
    let residents = [];
    let attendances = [];
    let cartRequests = [];
    let feedbacks = [];

    if (isDbConnected) {
      residents = await User.find({ role: 'resident' }).select('-password');
      attendances = await MealAttendance.find({});
      cartRequests = await CartRequest.find({});
      feedbacks = await Feedback.find({});
    } else {
      residents = memoryStore.users.filter(u => u.role === 'resident').map(sanitizeUser);
      attendances = memoryStore.mealAttendances;
      cartRequests = memoryStore.cartRequests;
      feedbacks = memoryStore.feedbacks;
    }

    // Aggregate statistics per resident
    const leaderboard = residents.map((resident) => {
      const userAtts = attendances.filter(a => a.user_id === resident.user_id);
      const userCarts = cartRequests.filter(c => c.user_id === resident.user_id);
      const userFeeds = feedbacks.filter(f => f.user_id === resident.user_id);

      const meals_skipped = userAtts.filter(a => a.attending === false).length;
      const meals_attended = userAtts.filter(a => a.attending === true).length;
      const approved_carts = userCarts.filter(c => c.status === 'approved').length;
      const rejected_carts = userCarts.filter(c => c.status === 'rejected').length;
      const total_carts = approved_carts + rejected_carts;
      const feedbacks_count = userFeeds.length;

      // Reliability rate (%)
      const reliability_rate = total_carts > 0 
        ? Math.round((approved_carts / total_carts) * 100) 
        : 100;

      // Zero Waste Eco Score Calculation:
      // +35 pts per meal skip notice given in advance (prevents mess overcooking)
      // +5 pts per attended meal marked
      // +20 pts per approved order
      // -35 pts per rejected order (penalty for unfulfilled or unreasonable requests)
      // +15 pts per feedback submitted
      // +100 baseline eco points
      const score = Math.max(
        0, 
        100 + 
        (meals_skipped * 35) + 
        (meals_attended * 5) + 
        (approved_carts * 20) - 
        (rejected_carts * 35) + 
        (feedbacks_count * 15)
      );

      // Estimated food saved from skipped meals (approx 0.35 kg per meal skipped)
      const food_saved_kg = Number((meals_skipped * 0.35).toFixed(1));
      // CO2 saved = food_saved_kg * 2.5 kg CO2e / kg
      const co2_saved_kg = Number((food_saved_kg * 2.5).toFixed(1));

      return {
        user_id: resident.user_id,
        name: resident.name,
        email: resident.email,
        score,
        meals_skipped,
        meals_attended,
        approved_carts,
        rejected_carts,
        total_carts,
        reliability_rate,
        feedbacks_count,
        food_saved_kg,
        co2_saved_kg,
        rank: 0,
        tier: 'Bronze',
        badge: 'Eco Scout 🥉'
      };
    });

    // Sort by score descending, then by reliability rate, then by meals_skipped
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.reliability_rate !== a.reliability_rate) return b.reliability_rate - a.reliability_rate;
      return b.meals_skipped - a.meals_skipped;
    });

    // Assign rank, tier, and badges
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
      if (entry.rank === 1) {
        entry.tier = 'Platinum';
        entry.badge = '👑 Platinum Eco Champion';
      } else if (entry.rank === 2) {
        entry.tier = 'Gold';
        entry.badge = '🥇 Gold Waste Warrior';
      } else if (entry.rank === 3) {
        entry.tier = 'Silver';
        entry.badge = '🥈 Silver Guardian';
      } else {
        entry.tier = 'Bronze';
        entry.badge = '🥉 Bronze Eco Scout';
      }
    });

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Dish Quality & Waste Correlation Analytics Endpoints
// -------------------------------------------------------------

// GET /api/analytics/dish-quality (Computes dish ratings, top/worst, and rating-to-waste correlation)
app.get('/api/analytics/dish-quality', authMiddleware, async (req, res, next) => {
  try {
    let foodItems = [];
    let feedbacks = [];
    let logs = [];

    if (isDbConnected) {
      foodItems = await FoodItem.find({});
      feedbacks = await Feedback.find({ target_type: 'food' });
      logs = await LogEntry.find({});
    } else {
      foodItems = memoryStore.foodItems;
      feedbacks = memoryStore.feedbacks.filter(f => f.target_type === 'food');
      logs = memoryStore.logs;
    }

    const dishes = foodItems.map(item => {
      // Find all feedback matching this dish by target_id or title
      const itemFeeds = feedbacks.filter(f => 
        f.target_id === item.food_id || 
        f.target_title.toLowerCase().trim() === item.title.toLowerCase().trim()
      );

      const review_count = itemFeeds.length;
      const average_rating = review_count > 0 
        ? Math.round((itemFeeds.reduce((sum, f) => sum + f.rating, 0) / review_count) * 10) / 10 
        : 0;

      // Find all waste log entries for this item
      const itemLogs = logs.filter(l => 
        l.item.toLowerCase().trim() === item.title.toLowerCase().trim()
      );

      const prepared_kg = itemLogs.reduce((sum, l) => sum + l.prepared, 0);
      const consumed_kg = itemLogs.reduce((sum, l) => sum + l.consumed, 0);
      const wasted_kg = itemLogs.reduce((sum, l) => {
        const netWasted = typeof l.wasted === 'number' ? l.wasted : Math.max(0, l.prepared - l.consumed - (l.donated || 0));
        return sum + netWasted;
      }, 0);

      const waste_percent = prepared_kg > 0 
        ? Math.round((wasted_kg / prepared_kg) * 100 * 10) / 10 
        : 0;

      // Flag rule: rating < 3.0 AND waste > 25.0%
      const flag_review_recipe = review_count > 0 && average_rating < 3.0 && waste_percent > 25.0;

      let rating_tier = 'Unrated';
      if (average_rating >= 4.5) rating_tier = 'Excellent';
      else if (average_rating >= 3.5) rating_tier = 'Good';
      else if (average_rating >= 2.5) rating_tier = 'Needs Improvement';
      else if (average_rating > 0) rating_tier = 'Poor';

      return {
        food_id: item.food_id,
        title: item.title,
        category: item.category,
        quantity_available: item.quantity_available,
        cost_per_kg: item.cost_per_kg || 120,
        status: item.status,
        average_rating,
        review_count,
        prepared_kg,
        consumed_kg,
        wasted_kg,
        waste_percent,
        flag_review_recipe,
        rating_tier,
        recent_comments: itemFeeds.map(f => ({
          user_name: f.user_name,
          rating: f.rating,
          comment: f.comment,
          date: f.date
        }))
      };
    });

    // Top 3 Best Rated (must have reviews)
    const ratedDishes = dishes.filter(d => d.review_count > 0);
    const top3Best = [...ratedDishes]
      .sort((a, b) => b.average_rating - a.average_rating || a.waste_percent - b.waste_percent)
      .slice(0, 3);

    // Top 3 Worst Rated (must have reviews)
    const top3Worst = [...ratedDishes]
      .sort((a, b) => a.average_rating - b.average_rating || b.waste_percent - a.waste_percent)
      .slice(0, 3);

    // Dishes flagged for recipe review
    const reviewRecipeDishes = dishes.filter(d => d.flag_review_recipe);

    // Correlation analysis
    const lowRated = ratedDishes.filter(d => d.average_rating < 3.0 && d.prepared_kg > 0);
    const highRated = ratedDishes.filter(d => d.average_rating >= 4.0 && d.prepared_kg > 0);

    const lowRatedWasteAvg = lowRated.length > 0
      ? Math.round((lowRated.reduce((sum, d) => sum + d.waste_percent, 0) / lowRated.length) * 10) / 10
      : 0;

    const highRatedWasteAvg = highRated.length > 0
      ? Math.round((highRated.reduce((sum, d) => sum + d.waste_percent, 0) / highRated.length) * 10) / 10
      : 0;

    const ratioMultiplier = highRatedWasteAvg > 0 
      ? (lowRatedWasteAvg / highRatedWasteAvg).toFixed(1) 
      : '3.5';

    res.json({
      dishes,
      top3Best,
      top3Worst,
      reviewRecipeDishes,
      correlationSummary: {
        lowRatedWasteAvg,
        highRatedWasteAvg,
        ratioMultiplier,
        insightText: `Dishes with ratings below 3.0 have an average waste rate of ${lowRatedWasteAvg}%, compared to ${highRatedWasteAvg}% for highly-rated dishes (~${ratioMultiplier}x higher waste due to resident dissatisfaction).`
      }
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Catch-All 404 & Global Error Handling
// -------------------------------------------------------------

// 404 handler for undefined API routes (must be before frontend static catch-all)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found.` });
});

// Serve static assets in production or monolithic deployment if dist directory exists
const distPath = path.resolve(__dirname, '../dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

// Global Express Error Handler
app.use((err, req, res, _next) => {
  console.error('Express Error Handler caught:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

const start = async () => {
  isDbConnected = await connectDB(MONGO_URI);
  if (isDbConnected) {
    await seedDatabase();
    console.log('MongoDB connected and active.');
  } else {
    console.log('Running in offline/in-memory data mode (ready to use immediately).');
  }
  return app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app, start };
export default app;