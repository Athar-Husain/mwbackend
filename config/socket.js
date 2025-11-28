// config/socket.js
import { Server } from 'socket.io';
import { socketHandler } from '../sockets/index.js';

let io;

export const initSocket = (server) => {
  if (!server) {
    throw new Error('HTTP server instance is required to initialize Socket.IO');
  }
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*', // Use environment variable
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);
    socketHandler(io, socket); // Pass the io instance and the specific socket
    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`);
    });
  });
};

// A better way to get the instance
export const getIo = () => {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized. Call initSocket(server) first.'
    );
  }
  return io;
};
