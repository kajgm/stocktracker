import { Schema, model } from 'mongoose';

const logSchema = new Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});

export const Log = model('Logs', logSchema);
