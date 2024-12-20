import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stocktracker';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB is connected');
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

export default connectDB;
