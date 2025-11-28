// server.js
import 'dotenv/config';
import http from 'http';
// import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

// dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server); // Handles and attaches global `io`

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
