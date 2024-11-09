import { config } from 'dotenv';
config();

const PORT = process.env.PORT || 3000;

import express from 'express';
import morgan from 'morgan';
import tickerRoutes from './routes/tickerRoutes';
import connectDB from './config/db';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/api', tickerRoutes);

app.listen(PORT, () => {
  if (process.env.DB) {
    connectDB().then(() => {
      console.log(`Stocktracker server listening on port ${PORT}`);
    });
  } else {
    console.log('Database disabled, running express server only');
  }
});
