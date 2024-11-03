import { Schema, model } from 'mongoose';

const cryptoSchema = new Schema({
  crypto: {
    type: String,
    required: true
  }
});

const stockSchema = new Schema({
  stock: {
    type: String,
    required: true
  }
});

export const Cryptos = model('Cryptos', cryptoSchema);
export const Stocks = model('Stocks', stockSchema);
