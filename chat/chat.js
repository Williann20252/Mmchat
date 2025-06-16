// Variables
let users = ['Willian', 'Maria', 'João']; // Exemplo de usuários
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// Function to send message
function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();

  if (message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'sent');
    messageDiv.innerHTML = `<span class="user">Você:</span><p class="text">${message}</p>`;
    document.getElementById('messages').appendChild(messageDiv);
    messageInput.value = ''; // Clear the input
    messageDiv.scrollIntoView();
  }
}

// Function to handle Enter key
function checkEnter(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Function to start audio recording
function startRecording() {
  if (isRecording) {
    mediaRecorder.stop();
    document.getElementById('audioBtn').textContent = '🎤';
    isRecording = false;
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        document.getElementById('audioBtn').textContent = '⏸️';
        isRecording = true;

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();

          // Display audio message
          const messageDiv = document.createElement('div');
          messageDiv.classList.add('message', 'sent');
          messageDiv.innerHTML = `<span class="user">Você:</span><p class="text">Áudio gravado</p>`;
          document.getElementById('messages').appendChild(messageDiv);
          messageDiv.scrollIntoView();
        };
      })
      .catch((err) => {
        console.error('Error accessing audio:', err);
      });
  }
}

// Function to upload image
function uploadImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.click();
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', 'sent');
      messageDiv.innerHTML = `<span class="user">Você:</span><p class="text">Imagem enviada: ${file.name}</p>`;
      document.getElementById('messages').appendChild(messageDiv);
      messageDiv.scrollIntoView();
    }
  };
}

// Function to view online users
function viewUsers() {
  alert('Usuários online: ' + users.join(', '));
}

// Function to handle logout
document.getElementById('logout').addEventListener('click', () => {
  window.location.href = '/';
});
