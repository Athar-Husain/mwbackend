// sockets/ticketSocket.js
export default function ticketSocketHandlers(io, socket) {
  socket.on('join-ticket', (ticketId) => {
    socket.join(`ticket:${ticketId}`);
    console.log(`📥 ${socket.id} joined ticket room: ticket:${ticketId}`);
  });

  socket.on('leave-ticket', (ticketId) => {
    socket.leave(`ticket:${ticketId}`);
    console.log(`📤 ${socket.id} left ticket room: ticket:${ticketId}`);
  });

  // Optional: If frontend wants to emit directly
  socket.on('send-public-comment', ({ ticketId, comment }) => {
    io.to(`ticket:${ticketId}`).emit('public-comment-added', comment);
  });

  socket.on('send-private-comment', ({ ticketId, comment }) => {
    io.to(`ticket:${ticketId}`).emit('private-comment-added', comment);
  });

  socket.on('ticket-updated', ({ ticketId, data }) => {
    io.to(`ticket:${ticketId}`).emit('ticket-update', data);
  });
}
