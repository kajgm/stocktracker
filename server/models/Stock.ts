import { Schema, model } from 'mongoose';

const stockSchema = new Schema({
  id: {
    type: String,
    required: true
  }
});

export const Stock = model('Stocks', stockSchema);
