import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';

const app = express();

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Healthcheck
app.get('/api/v1/healthcheck', (req, res) =>
  res.status(200).json({ status: 'ok', message: 'CircleUp API live' })
);


app.use('/api/v1/users', userRouter);
// (Later) mount your routers:
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/groups', groupRouter);
// ...

export default app;
