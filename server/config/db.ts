import mongoose from 'mongoose';

const connectDB = async (uri: string) => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB is connected');
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

export default connectDB;
