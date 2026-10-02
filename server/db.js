import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.log(`MongoDB not found or offline (${error.message}). Using built-in persistent in-memory store.`);
    return false;
  }
};
