<<<<<<< HEAD
// sockets/index.js
import ticketSocketHandlers from './ticketSocket.js';
// Import other handlers here if you have them, e.g., notificationSocketHandlers

export const socketHandler = (io, socket) => {
    console.log(`⚡ Socket handler initialized for ${socket.id}`);

    // Call handlers for each feature module
    ticketSocketHandlers(io, socket);
    // e.g., notificationSocketHandlers(io, socket);
};
=======
//  socket/index.js
import ticketSocketHandlers from './ticketSocket.js';
import customerSocketHandlers from './customerSocket.js'; // 🆕

export const socketHandler = (io, socket) => {
  console.log(`⚡ Socket handler initialized for ${socket.id}`);

  ticketSocketHandlers(io, socket);
  customerSocketHandlers(io, socket); // 🆕 handle customer-specific sockets
};
>>>>>>> 0338fc4 (Initial commit - updated backend)
