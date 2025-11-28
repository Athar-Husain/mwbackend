//  socket/index.js
import ticketSocketHandlers from './ticketSocket.js';
import customerSocketHandlers from './customerSocket.js'; // 🆕

export const socketHandler = (io, socket) => {
  console.log(`⚡ Socket handler initialized for ${socket.id}`);

  ticketSocketHandlers(io, socket);
  customerSocketHandlers(io, socket); // 🆕 handle customer-specific sockets
};
