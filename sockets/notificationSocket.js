// sockets/notificationSocket.js
import { logInfo } from '../utils/logger.js';

export default (io, socket) => {
  // Join personal room for notifications
  socket.on('joinUserRoom', (userId) => {
    socket.join(userId);
    logInfo(`Socket ${socket.id} joined user room: ${userId}`);
  });

  socket.on('leaveUserRoom', (userId) => {
    socket.leave(userId);
    logInfo(`Socket ${socket.id} left user room: ${userId}`);
  });

  // Notifications can be emitted from controllers using io.to(userId).emit('notification', ...)
};
