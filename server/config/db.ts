import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  // Log the host only: the URI may carry credentials.
  const host = uri.replace(/^mongodb(\+srv)?:\/\/([^@]*@)?/, '').split('/')[0];
  console.log(`Connecting to MongoDB at ${host}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
