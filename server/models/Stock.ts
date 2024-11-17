import { Schema, model } from 'mongoose';

const stockSchema = new Schema({
  symbol: {
    type: String,
    required: true
  },
  curPrice: {
    type: String,
    required: false
  },
  volume: {
    type: Number,
    required: false
  },
  dayPercentage: {
    type: Number,
    required: false
  },
  type: {
    type: String,
    required: false
  }
});

export const Stock = model('Stocks', stockSchema);
