import { Schema, model } from 'mongoose';

const cryptoSchema = new Schema({
  product_id: {
    type: String,
    required: true
  },
  best_ask: {
    type: String,
    required: false
  },
  best_ask_size: {
    type: String,
    required: false
  },
  best_bid: {
    type: String,
    required: false
  },
  best_bid_size: {
    type: String,
    required: false
  },
  high_24h: {
    type: String,
    required: false
  },
  last_size: {
    type: String,
    required: false
  },
  low_24h: {
    type: String,
    required: false
  },
  open_24h: {
    type: String,
    required: false
  },
  price: {
    type: String,
    required: false
  },
  sequence: {
    type: Number,
    required: false
  },
  side: {
    type: String,
    required: false
  },
  time: {
    type: String,
    required: false
  },
  trade_id: {
    type: Number,
    required: false
  },
  type: {
    type: String,
    required: false
  },
  volume_24h: {
    type: String,
    required: false
  },
  volume_30d: {
    type: String,
    required: false
  }
});

export const CryptoDB = model('Cryptos', cryptoSchema);
