import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';
import interestRouter from './routes/interest.routes.js';
import groupRouter from './routes/group.routes.js';
import eventRouter from './routes/event.routes.js';
import recommendRouter from './routes/recommend.routes.js';
import chatRouter from './routes/chat.routes.js';
import searchRouter from './routes/search.routes.js';

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
app.use('/api/v1/interests', interestRouter);
app.use('/api/v1/groups', groupRouter); 
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/recommend', recommendRouter);
app.use('/api/v1/chats', chatRouter);
app.use('/api/v1/search', searchRouter);

export default app;
