// backend/index.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app.js';

dotenv.config();

// 1. Create an HTTP server from your Express app
const httpServer = http.createServer(app);

// 2. Initialize Socket.io on that server
export const io = new SocketServer(httpServer, {
  cors: {
    origin: true,           // allow whatever your Express CORS allows
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 3. Handle socket connections
io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);

  socket.on('joinPrivateRoom', ({ conversationId }) => {
    socket.join(`private_${conversationId}`);
  });
  socket.on('leavePrivateRoom', ({ conversationId }) => {
    socket.leave(`private_${conversationId}`);
  });
  socket.on('joinGroupRoom', ({ groupId }) => {
    socket.join(`group_${groupId}`);
  });
  socket.on('leaveGroupRoom', ({ groupId }) => {
    socket.leave(`group_${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// 4. Connect to MongoDB and then start listening
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME
  })
  .then(() => {
    console.log('MongoDB connected successfully');
    httpServer.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
