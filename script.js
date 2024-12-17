const socket = io();
let username = '';
let currentChatCode = '';

// Show the username screen
function goToMainMenu() {
  username = document.getElementById('username').value;
  if (username) {
    document.getElementById('username-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('user-name').textContent = username;
  }
}

// Show the create chat screen
function goToCreateChat() {
  if (currentChatCode) return; // Prevent accessing if already in a chat
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('create-chat-screen').classList.remove('hidden');
}

// Show the join chat screen
function goToJoinChat() {
  if (currentChatCode) return; // Prevent accessing if already in a chat
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('join-chat-screen').classList.remove('hidden');
}

// Create a new chat
function createChat() {
  const chatName = document.getElementById('chat-name').value;
  const chatPassword = document.getElementById('chat-password').value;

  if (chatName && chatPassword) {
    const chatDetails = {
      name: chatName,
      password: chatPassword,
      code: Math.random().toString(36).substring(7) // Random chat code
    };

    socket.emit('create-chat', chatDetails);
    alert('Chat Created! Share this code: ' + chatDetails.code);

    // Hide create chat UI and show the chat room
    document.getElementById('create-chat-screen').classList.add('hidden');
    document.getElementById('chat-room').classList.remove('hidden');
    document.getElementById('chat-code-display').textContent = chatDetails.code;
    currentChatCode = chatDetails.code;
  }
}

// Join an existing chat
function joinChat() {
  const chatCode = document.getElementById('chat-code').value;
  if (chatCode) {
    socket.emit('join-chat', chatCode);
  }
}

// Handle chat-joined event
socket.on('chat-joined', (chat) => {
  document.getElementById('chat-code-display').textContent = chat.code;
  currentChatCode = chat.code;
  loadMessages(chat.code);
});

// Handle new message
socket.on('new-message', (messageData) => {
  if (messageData.chatCode === currentChatCode) {
    const messagesDiv = document.getElementById('messages');
    const message = document.createElement('p');
    message.textContent = `${messageData.username}: ${messageData.message}`;
    messagesDiv.appendChild(message);

    // Display images/videos
    if (messageData.file) {
      const media = document.createElement(messageData.file.type.startsWith('image') ? 'img' : 'video');
      media.src = messageData.file.data;
      media.controls = true;
      messagesDiv.appendChild(media);
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});

// Send message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value;

  if (message) {
    const messageData = {
      chatCode: currentChatCode,
      username: username,
      message: message
    };
    socket.emit('send-message', messageData);
    messageInput.value = '';
  }
}

// Send file (image/video)
function sendFile() {
  const fileInput = document.getElementById('file-input');
  const file = fileInput.files[0]; // Get selected file

  if (file) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      const fileData = {
        chatCode: currentChatCode,
        username: username,
        fileName: file.name,
        fileType: file.type,
        fileData: e.target.result // File content (base64)
      };
      socket.emit('send-file', fileData);
    };
    fileReader.readAsDataURL(file); // Read file as base64
  }
}

// Load messages for a specific chat code
function loadMessages(chatCode) {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = ''; // Clear previous messages
}

// Save chat as JSON (optional)
function saveChat() {
  const chatData = {
    code: currentChatCode,
    messages: [] // Collect messages to save
  };

  const messageElements = document.getElementById('messages').children;
  for (let i = 0; i < messageElements.length; i++) {
    const messageText = messageElements[i].textContent.split(": ")[1];
    chatData.messages.push({
      username: messageElements[i].textContent.split(": ")[0],
      message: messageText
    });
  }

  const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `chat_${currentChatCode}.json`;
  link.click();
}
