import { Server } from 'socket.io';
import { server } from '../app.js';

import { config } from 'dotenv';
config();

const clientUrl = process.env.CLIENT_URL;

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId as string, socket.id);
    console.log('a user connected', userId);

    // Emit updated online users to all clients when someone connects
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  }

  socket.emit('getOnlineUsers', Array.from(onlineUsers.keys()));

  socket.on('getOnlineUsers', () => {
    socket.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId as string);
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    console.log('a user disconnected', userId);
  });
});

const getReceiverSocketId = (receiverId: string) => {
  const receiverSocketId = onlineUsers.get(receiverId);
  return receiverSocketId;
};

export { io, getReceiverSocketId, server };
