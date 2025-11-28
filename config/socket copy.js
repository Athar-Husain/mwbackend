// config/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // configure this properly for your clients
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  return io;
};

export { io };

//     import { Server } from 'socket.io';

// let io = null;

// export const initSocket = (server) => {
//   if (io) {
//     // Already initialized
//     return io;
//   }

//   io = new Server(server, {
//     cors: {
//       origin: '*', // Change this to your frontend URL in production
//       methods: ['GET', 'POST'],
//     },
//   });

//   io.on('connection', (socket) => {
//     console.log(`Client connected: ${socket.id}`);

//     // Example: Listen for client events here
//     socket.on('disconnect', () => {
//       console.log(`Client disconnected: ${socket.id}`);
//     });
//   });

//   return io;
// };

// export { io };
