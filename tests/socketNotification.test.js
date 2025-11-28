import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import http from 'http';
import { Server } from 'socket.io';
import { notifyUsers } from '../utils/notifyUsers.js';

let io, serverSocket, clientSocket, httpServer;

beforeAll((done) => {
  httpServer = http.createServer();
  io = new Server(httpServer);

  io.on('connection', (socket) => {
    serverSocket = socket;

    // Simulate user joining their own room by _id
    socket.on('joinRoom', (room) => {
      socket.join(room);
    });
  });

  httpServer.listen(() => {
    const port = httpServer.address().port;
    clientSocket = new Client(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Make client join the room named after the user id
      clientSocket.emit('joinRoom', '12345');
      done();
    });
  });
});

afterAll(() => {
  io.close();
  clientSocket.close();
  httpServer.close();
});

test('should receive newNotification event', (done) => {
  const fakeUser = {
    _id: new mongoose.Types.ObjectId(),
    userType: 'Customer',
    fcmTokens: ['fakeToken1', 'fakeToken2'],
  };

  clientSocket.on('newNotification', (data) => {
    expect(data.notification).toBeDefined();
    expect(data.payload).toEqual({ test: 'data' });
    done();
  });

  notifyUsers({
    io,
    recipients: [fakeUser],
    title: 'Test Title',
    message: 'Test message',
    payload: { test: 'data' },
  });
}, 10000);
