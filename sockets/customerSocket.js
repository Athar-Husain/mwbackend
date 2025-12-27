export default function customerSocketHandlers(io, socket) {
  // console.log(`⚡ Customer socket initialized for ${socket.id}`);

  // Join customer-specific room
  socket.on('joinCustomerRoom', (customerId) => {
    if (!customerId) return console.error('Invalid customerId provided');
    socket.join(customerId);
    console.log(`✅ Socket ${socket.id} joined customer room ${customerId}`);
  });

  // Leave customer room
  socket.on('leaveCustomerRoom', (customerId) => {
    if (!customerId) return console.error('Invalid customerId provided');
    socket.leave(customerId);
    console.log(`❌ Socket ${socket.id} left customer room ${customerId}`);
  });
}
