export const socketHandler = (io, socket) => {
  // Join a ticket room
  socket.on('joinTicketRoom', (ticketId) => {
    socket.join(`ticket-${ticketId}`);
    console.log(`Socket ${socket.id} joined room: ticket-${ticketId}`);
  });

  // Leave a ticket room (optional)
  socket.on('leaveTicketRoom', (ticketId) => {
    socket.leave(`ticket-${ticketId}`);
    console.log(`Socket ${socket.id} left room: ticket-${ticketId}`);
  });
};
