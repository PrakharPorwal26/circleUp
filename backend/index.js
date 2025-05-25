import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI,{
    dbName: process.env.DB_NAME
  })
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('Error, DB connection failed:', err);
    process.exit(1);
  });
