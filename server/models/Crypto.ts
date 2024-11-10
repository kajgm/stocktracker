import { Schema, model } from 'mongoose';

const cryptoSchema = new Schema({
  best_ask: {
    type: String,
    required: true
  },
  best_ask_size: {
    type: String,
    required: true
  },
  best_bid: {
    type: String,
    required: true
  },
  best_bid_size: {
    type: String,
    required: true
  },
  high_24h: {
    type: String,
    required: true
  },
  last_size: {
    type: String,
    required: true
  },
  low_24h: {
    type: String,
    required: true
  },
  open_24h: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  product_id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    required: true
  },
  side: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  trade_id: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  volume_24h: {
    type: String,
    required: true
  },
  volume_30d: {
    type: String,
    required: true
  }
});

export const Crypto = model('Cryptos', cryptoSchema);
