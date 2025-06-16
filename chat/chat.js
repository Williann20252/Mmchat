// chat.js

// Inicializa Firebase import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; import { getDatabase, ref, push, onChildAdded, remove, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg", authDomain: "mmchat-f4f88.firebaseapp.com", databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com", projectId: "mmchat-f4f88", storageBucket: "mmchat-f4f88.appspot.com", messagingSenderId: "404598754438", appId: "1:404598754438:web:6a0892895591430d851507" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const mensagensRef = ref(db, "mensagens");

const mural = document.getElementById("mural"); const mensagemInput = document.getElementById("mensagem"); const enviarBtn = document.getElementById("enviar"); const sairBtn = document.getElementById("sair");

const nickname = localStorage.getItem("nickname") || "Anônimo"; const userType = localStorage.getItem("userType") || "anonimo";

function adicionarMensagemAoMural(texto, autor) { const msg = document.createElement("div"); msg.classList.add("mensagem"); msg.innerHTML = <strong class="${userType === 'premium' ? 'premium' : 'anonimo'}">@${autor}:</strong> ${texto}; mural.appendChild(msg); mural.scrollTop = mural.scrollHeight; }

enviarBtn.addEventListener("click", () => { const texto = mensagemInput.value.trim(); if (texto) { push(mensagensRef, { autor: nickname, texto }); mensagemInput.value = ""; } });

mensagemInput.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); enviarBtn.click(); } });

onChildAdded(mensagensRef, (data) => { const { autor, texto } = data.val(); adicionarMensagemAoMural(texto, autor); });

sairBtn.addEventListener("click", () => { localStorage.clear(); window.location.href = "../index.html"; });

// Botões de imagem e áudio const imagemInput = document.getElementById("imagemInput"); const imagemBtn = document.getElementById("imagemBtn"); imagemBtn.addEventListener("click", () => imagemInput.click());

imagemInput.addEventListener("change", () => { const file = imagemInput.files[0]; if (file) { const reader = new FileReader(); reader.onload = function (e) { push(mensagensRef, { autor: nickname, texto: <img src='${e.target.result}' class='imagem-enviada' /> }); }; reader.readAsDataURL(file); } });

const audioBtn = document.getElementById("audioBtn"); let mediaRecorder; let audioChunks = [];

audioBtn.addEventListener("click", () => { navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => { mediaRecorder = new MediaRecorder(stream); mediaRecorder.start(); audioBtn.textContent = "Gravando... Clique para parar";

mediaRecorder.addEventListener("dataavailable", (event) => {
  audioChunks.push(event.data);
});

mediaRecorder.addEventListener("stop", () => {
  const audioBlob = new Blob(audioChunks);
  const audioUrl = URL.createObjectURL(audioBlob);
  push(mensagensRef, {
    autor: nickname,
    texto: `<audio controls src='${audioUrl}' class='audio-enviado'></audio>`
  });
  audioChunks = [];
  audioBtn.textContent = "Áudio";
});

setTimeout(() => {
  mediaRecorder.stop();
}, 60000); // Limite de 60 segundos

}); });

// Ver usuários online const verUsuariosBtn = document.getElementById("usuariosBtn"); const usuariosBox = document.getElementById("usuariosBox");

verUsuariosBtn.addEventListener("click", () => { usuariosBox.classList.toggle("ativo"); });

