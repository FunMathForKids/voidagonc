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
      socket.join(chatCode);
      socket.emit('chat-joined', chat);
    }
  });

  // Handle sending messages
  socket.on('send-message', (messageData) => {
    const chat = activeChats.find(c => c.code === messageData.chatCode);
    if (chat) {
      io.to(messageData.chatCode).emit('new-message', messageData);
    }
  });

  // Handle file sending
  socket.on('send-file', (fileData) => {
    const chat = activeChats.find(c => c.code === fileData.chatCode);
    if (chat) {
      io.to(fileData.chatCode).emit('new-message', {
        username: fileData.username,
        message: `File sent: ${fileData.fileName}`,
        file: {
          name: fileData.fileName,
          type: fileData.fileType,
          data: fileData.fileData  // Send base64 data for file
        }
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
