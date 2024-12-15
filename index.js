const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the current directory
app.use(express.static('.'));

// Store active chats
let activeChats = [];  // Store active chats

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle chat creation
  socket.on('create-chat', (chatDetails) => {
    activeChats.push({ ...chatDetails, users: [socket.id] });
    socket.join(chatDetails.code);  // Join the chat room immediately after creation
    io.emit('chat-created', chatDetails);
    socket.emit('chat-joined', chatDetails);  // Send the chat info back to the user
  });

  // Handle joining a chat
  socket.on('join-chat', (chatCode) => {
    const chat = activeChats.find(c => c.code === chatCode);
    if (chat) {
      chat.users.push(socket.id);
      socket.join(chatCode);  // Join the chat room
      socket.emit('chat-joined', chat);
      io.to(chatCode).emit('user-joined', socket.id);  // Notify others when a user joins
    } else {
      socket.emit('error', 'Chat not found');
    }
  });

  // Handle sending messages
  socket.on('send-message', (messageData) => {
    const chat = activeChats.find(c => c.code === messageData.chatCode);
    if (chat) {
      io.to(chat.code).emit('new-message', messageData);  // Broadcast the message to the chat room
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
