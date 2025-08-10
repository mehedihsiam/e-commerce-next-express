// connect mongo DB by mongoose
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🛢️ MongoDB connected successfully');
  } catch (error) {
    console.error('🚨 MongoDB connection failed:', error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
