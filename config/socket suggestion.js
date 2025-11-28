// // config/socket.js
// import { Server } from 'socket.io';
// import { socketHandler } from '../sockets/index.js';
// import jwt from 'jsonwebtoken';
// // Import your user models here if you want to perform validation
// // Or, keep the validation in your ticketSocket.js as you currently do, which is fine

// let io;

// export const initSocket = (server) => {
//   // ... (rest of your initSocket function) ...
//   io.on('connection', (socket) => {
//     console.log(`🟢 Socket connected: ${socket.id}`);

//     // A central place to handle user authentication
//     socket.on('auth', async (token) => {
//       try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const { id, userType } = decoded;

//         // Join a room specific to the user's ID
//         socket.join(`user-${id}`);
//         console.log(
//           `✅ Socket ${socket.id} authenticated and joined room: user-${id}`
//         );

//         // Optionally, add a room for their user type (e.g., for broadcast to all admins)
//         socket.join(userType.toLowerCase());
//         console.log(
//           `✅ Socket ${socket.id} also joined room: ${userType.toLowerCase()}`
//         );

//         socket.emit('auth-success', { id, userType });

//         // Attach user info to the socket for later use
//         socket.user = { id, userType };
//       } catch (err) {
//         socket.emit('auth-error', 'Authentication failed');
//       }
//     });

//     socketHandler(io, socket);
//     // ... (rest of the connection handler) ...
//   });
// };

// export const getIo = () => {
//   // ... (Your existing getIo function) ...
//   return io;
// };
