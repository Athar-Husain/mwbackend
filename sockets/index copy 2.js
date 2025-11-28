// sockets/index.js
import ticketSocketHandlers from './ticketSocket.js';
// import notificationSocketHandlers from './notificationSocket.js';

export const socketHandler = (io, socket) => {
  console.log(`⚡ Socket handler initialized for ${socket.id}`);

  // Handle each feature module
  ticketSocketHandlers(io, socket);
  notificationSocketHandlers(io, socket);

  // You can add more handlers easily
  // e.g., chatSocketHandlers(io, socket);
};
