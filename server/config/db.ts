import { config } from 'dotenv';
config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb-server/stocktracker';

const connectDB = async () => {
  try {
    console.log('Connecting to: ' + MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB is connected');
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

export default connectDB;
