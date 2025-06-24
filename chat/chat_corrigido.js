import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
  authDomain: "mmchat-f4f88.firebaseapp.com",
  databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
  projectId: "mmchat-f4f88",
  storageBucket: "mmchat-f4f88.appspot.com",
  messagingSenderId: "404598754438",
  appId: "1:404598754438:web:6089280d851507"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// Identificação do usuário
const nickname = localStorage.getItem("nickname") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substr(2, 10);
  localStorage.setItem("uid", uid);
}

// DOM
const mural = document.getElementById("chat-mural");
const input = document.getElementById("mensagemInput");
const enviarBtn = document.getElementById("enviarBtn");
const usuariosBtn = document.getElementById("usuariosBtn");
const configBtn = document.getElementById("configBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const logoutBtn = document.getElementById("logoutBtn");
const imgBtn = document.getElementById("imgBtn");
const audioBtn = document.getElementById("audioBtn");
const painelUsuarios = document.getElementById("usuariosOnline");
const painelConfig = document.getElementById("configPainel");
const fecharUsuarios = document.getElementById("fecharUsuarios");
const fecharConfig = document.getElementById("fecharConfig");

// Painel de gravação
const audioModal = document.getElementById("audioModal");
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const playBtn = document.getElementById("playBtn");
const sendAudioBtn = document.getElementById("sendAudioBtn");
const cancelAudioBtn = document.getElementById("cancelAudioBtn");

let mediaRecorder, audioChunks, audioBlob, audioUrl;

// Abrir painel de áudio
audioBtn.onclick = () => {
  audioModal.hidden = false;
  audioChunks = [];
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  playBtn.disabled = true;
  sendAudioBtn.disabled = true;
};

// Gravar áudio
recordBtn.onclick = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioUrl = URL.createObjectURL(audioBlob);
      playBtn.disabled = false;
      sendAudioBtn.disabled = false;
    };
    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
  });
};

// Parar gravação
stopBtn.onclick = () => {
  mediaRecorder.stop();
  stopBtn.disabled = true;
};

// Reproduzir
playBtn.onclick = () => {
  const audio = new Audio(audioUrl);
  audio.play();
};

// Enviar áudio
sendAudioBtn.onclick = () => {
  const reader = new FileReader();
  reader.onloadend = () => {
    push(ref(db, "mensagens"), {
      nick: nickname,
      uid: uid,
      tipo: "audio",
      conteudo: reader.result,
      hora: Date.now()
    });
    audioModal.hidden = true;
  };
  reader.readAsDataURL(audioBlob);
};

// Cancelar
cancelAudioBtn.onclick = () => {
  audioModal.hidden = true;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

// ... restante do seu código original ...
