import { Schema, model } from 'mongoose';

const configSchema = new Schema({
  user: {
    type: String,
    required: true
  },
  stockTickers: {
    type: [String],
    required: true
  },
  cryptoTickers: {
    type: [String],
    required: true
  }
});

export const ConfigDB = model('Config', configSchema);
