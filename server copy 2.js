import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import app from './app.js';
import { socketHandler } from './sockets/index.js'; // We'll create this next

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create HTTP server & bind with Express app
const server = http.createServer(app);

// Initialize socket.io server
const io = new SocketServer(server, {
  cors: {
    origin: '*', // Replace with your actual frontend URLs in production
    methods: ['GET', 'POST'],
  },
});

// Attach `io` to app for use in routes/controllers
app.set('io', io);

// Socket handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socketHandler(io, socket);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
