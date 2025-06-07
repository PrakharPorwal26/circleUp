// backend/index.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app.js';

dotenv.config();

// 1. Create HTTP server from Express app
const httpServer = http.createServer(app);

// 2. Attach Socket.io to the HTTP server
export const io = new SocketServer(httpServer, {
  cors: {
    origin: true,           // mirror your express CORS origin: true
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 3. Socket.io connection handlers
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('joinPrivateRoom', ({ conversationId }) => {
    socket.join(`private_${conversationId}`);
  });

  socket.on('joinGroupRoom', ({ groupId }) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// 4. Connect to MongoDB and then start the server
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
