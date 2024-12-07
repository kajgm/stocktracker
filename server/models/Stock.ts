import { Schema, model } from 'mongoose';

const stockSchema = new Schema({
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: false
  },
  changesPercentage: {
    type: Number,
    required: false
  },
  change: {
    type: Number,
    required: false
  },
  dayLow: {
    type: Number,
    required: false
  },
  dayHigh: {
    type: Number,
    required: false
  },
  yearHigh: {
    type: Number,
    required: false
  },
  yearLow: {
    type: Number,
    required: false
  },
  marketCap: {
    type: Number,
    required: false
  },
  priceAvg50: {
    type: Number,
    required: false
  },
  priceAvg200: {
    type: Number,
    required: false
  },
  exchange: {
    type: String,
    required: false
  },
  volume: {
    type: Number,
    required: false
  },
  avgVolume: {
    type: Number,
    required: false
  },
  open: {
    type: Number,
    required: false
  },
  previousClose: {
    type: Number,
    required: false
  },
  eps: {
    type: Number,
    required: false
  },
  pe: {
    type: Number,
    required: false
  },
  earningsAnnouncement: {
    type: String,
    required: false
  },
  sharesOutstanding: {
    type: Number,
    required: false
  },
  timestamp: {
    type: Number,
    required: false
  },
  type: {
    type: String,
    required: false
  }
});

export const Stock = model('Stocks', stockSchema);
