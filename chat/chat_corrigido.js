import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

// DOM
const mural = document.getElementById("chat-mural");
const input = document.getElementById("mensagemInput");
const enviarBtn = document.getElementById("enviarBtn");
const imgBtn = document.getElementById("imgBtn");
const audioBtn = document.getElementById("audioBtn");
const usuariosBtn = document.getElementById("usuariosBtn");
const configBtn = document.getElementById("configBtn");
const logoutBtn = document.getElementById("logoutBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const painelUsuarios = document.getElementById("usuariosOnline");
const painelConfig = document.getElementById("configPainel");
const fecharUsuarios = document.getElementById("fecharUsuarios");
const fecharConfig = document.getElementById("fecharConfig");

// Modal de áudio
const audioModal = document.getElementById("audioModal");
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const playBtn = document.getElementById("playBtn");
const sendAudioBtn = document.getElementById("sendAudioBtn");
const cancelAudioBtn = document.getElementById("cancelAudioBtn");

let mediaRecorder, audioChunks, audioBlob, audioUrl;

// Mostrar modal ao clicar no microfone
audioBtn.onclick = () => {
  audioModal.classList.add("show");
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

// Ouvir áudio gravado
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
    audioModal.classList.remove("show");
    audioModal.hidden = true;
  };
  reader.readAsDataURL(audioBlob);
};

// Cancelar envio
cancelAudioBtn.onclick = () => {
  audioModal.classList.remove("show");
  audioModal.hidden = true;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

// Fechar modal ao clicar fora
audioModal.onclick = e => {
  if (e.target === audioModal) {
    audioModal.classList.remove("show");
    audioModal.hidden = true;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }
};

// ... O restante do código do chat permanece igual (PV, mensagens, etc.) ...
