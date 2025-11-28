// sockets/ticketSocket.js
export default (io, socket) => {
  /**
   * @description A client joins a specific ticket room to receive real-time updates for that ticket.
   * @param {string} ticketId - The ID of the ticket to join.
   */
  socket.on('joinTicketRoom', (ticketId) => {
    socket.join(ticketId);
    console.log(`Socket ${socket.id} joined room for ticket ${ticketId}`);
  });

  /**
   * @description A client leaves a ticket room.
   * @param {string} ticketId - The ID of the ticket to leave.
   */
  socket.on('leaveTicketRoom', (ticketId) => {
    socket.leave(ticketId);
    console.log(`Socket ${socket.id} left room for ticket ${ticketId}`);
  });
};

// // socketHandlers/ticketSocket.js
// import { logInfo } from '../utils/logger.js';

// export default (io, socket) => {
//   // Join specific ticket room
//   socket.on('joinTicketRoom', (ticketId) => {
//     socket.join(ticketId);
//     logInfo(`Socket ${socket.id} joined ticket room: ${ticketId}`);
//   });

//   socket.on('leaveTicketRoom', (ticketId) => {
//     socket.leave(ticketId);
//     logInfo(`Socket ${socket.id} left ticket room: ${ticketId}`);
//   });

//   // Optionally handle other real-time events here
// };
