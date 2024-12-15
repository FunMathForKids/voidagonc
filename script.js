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
  if (currentChatCode) return; // Prevent accessing this if already in a chat
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('create-chat-screen').classList.remove('hidden');
}

// Show the join chat screen
function goToJoinChat() {
  if (currentChatCode) return; // Prevent accessing this if already in a chat
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

    // Hide the "Create" and "Join" buttons
    document.getElementById('create-chat-button').style.display = 'none';
    document.getElementById('join-chat-button').style.display = 'none';
  }
}

// Join the chat using the entered code
function joinChat() {
  const chatCode = document.getElementById('chat-code').value;

  if (chatCode) {
    console.log('Attempting to join chat with code: ' + chatCode); // Debugging
    socket.emit('join-chat', chatCode);  // Emit the join chat event with the chat code
  } else {
    alert('Please enter a chat code');
  }
}

// Handle joining chat success
socket.on('chat-joined', (chat) => {
  console.log('Chat joined successfully: ', chat); // Debugging

  // Update the UI: switch to the chat room
  document.getElementById('join-chat-screen').classList.add('hidden');
  document.getElementById('chat-room').classList.remove('hidden');
  document.getElementById('chat-code-display').textContent = chat.code;
  currentChatCode = chat.code;
  loadMessages(chat.code);

  // Optional: Show a "Save Chat" button only for the host
  if (chat.host === username) {
    showSaveButton();
  }
});

// Handle new message
socket.on('new-message', (messageData) => {
  if (messageData.chatCode === currentChatCode) {
    const messagesDiv = document.getElementById('messages');
    const message = document.createElement('p');
    message.textContent = `${messageData.username}: ${messageData.message}`;
    messagesDiv.appendChild(message);
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

// Load existing messages
function loadMessages(chatCode) {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = ''; // Clear previous messages
}

// Save chat as JSON
function saveChat() {
  const chatData = {
    code: currentChatCode,
    messages: []
  };

  // Grab all the messages in the chat window
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

// Show "Save Chat" button only for the host
function showSaveButton() {
  // Assuming only the host can save chat
  const saveButton = document.createElement('button');
  saveButton.textContent = "Save Chat";
  saveButton.onclick = saveChat;
  document.getElementById('chat-controls').appendChild(saveButton);
}

// When the chat room is ready, call this function to show the save button
socket.on('chat-joined', (chat) => {
  if (chat.host === username) {
    showSaveButton(); // Only the host can see this button
  }
});
