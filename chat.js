// chat.js - MMChat completo

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
  authDomain: "mmchat-f4f88.firebaseapp.com",
  databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
  projectId: "mmchat-f4f88",
  storageBucket: "mmchat-f4f88.appspot.com",
  messagingSenderId: "404598754438",
  appId: "1:404598754438:web:6a0892895591430d851507"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let nickname = prompt("Escolha seu nickname:");
let uid = localStorage.getItem("uid") || Math.random().toString(36).substring(2);
let isPremium = false;

// Verifica se é Premium (você pode customizar isso)
if (uid.startsWith("prem-")) isPremium = true;

// Registrar presença
const userRef = database.ref("usuarios/" + uid);
userRef.set({ nickname, isPremium });
userRef.onDisconnect().remove();

const chatRef = database.ref("mensagens");

// Limpar mensagens antigas ao entrar (opcional)
chatRef.remove();

// Enviar mensagem
function enviarMensagem(texto) {
  if (!texto.trim()) return;
  chatRef.push({
    uid,
    nickname,
    texto,
    tipo: "texto",
    data: Date.now(),
    isPremium
  });
  document.getElementById("mensagem").value = "";
}

// Exibir mensagens
chatRef.on("child_added", (snapshot) => {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.classList.add("mensagem");
  div.classList.add(msg.uid === uid ? "enviada" : "recebida");

  if (msg.isPremium) {
    const premiumTag = `<div class="nick-premium">@${msg.nickname}</div>`;
    div.innerHTML = premiumTag + formataConteudo(msg);
  } else {
    div.innerHTML = `<strong>@${msg.nickname}</strong><br>${formataConteudo(msg)}`;
  }

  document.getElementById("chat").appendChild(div);
  document.getElementById("chat").scrollTop = chat.scrollHeight;
});

// Conteúdo personalizado
function formataConteudo(msg) {
  if (msg.tipo === "imagem") {
    return `<button onclick="toggleImg(this)">Ver imagem</button><br><img src="${msg.url}" style="max-width:100%;display:none"/>`;
  } else if (msg.tipo === "audio") {
    return `<audio controls src="${msg.url}" style="width:100%"></audio>`;
  }
  return msg.texto;
}

// Enviar imagem
document.getElementById("enviarImagem").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    chatRef.push({
      uid,
      nickname,
      url: reader.result,
      tipo: "imagem",
      data: Date.now(),
      isPremium
    });
  };
  reader.readAsDataURL(file);
});

// Enviar áudio (60s máx)
let mediaRecorder;
let audioChunks = [];
const botaoGravar = document.getElementById("gravarAudio");

botaoGravar.addEventListener("mousedown", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onload = () => {
      chatRef.push({
        uid,
        nickname,
        url: reader.result,
        tipo: "audio",
        data: Date.now(),
        isPremium
      });
    };
    reader.readAsDataURL(audioBlob);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 60000);
});

botaoGravar.addEventListener("mouseup", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
});

// Alternar imagem
function toggleImg(btn) {
  const img = btn.nextElementSibling;
  img.style.display = img.style.display === "none" ? "block" : "none";
}

// Enviar mensagem com Enter
document.getElementById("mensagem").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    enviarMensagem(e.target.value);
  }
});

// Sair
document.getElementById("btnSair").addEventListener("click", () => {
  localStorage.removeItem("uid");
  window.location.reload();
});

// Ver usuários online
const listaUsuarios = document.getElementById("usuarios");
const painelUsuarios = document.getElementById("usuarios-lista");
document.getElementById("btnUsuarios").addEventListener("click", () => {
  painelUsuarios.classList.toggle("hidden");
});

database.ref("usuarios").on("value", (snap) => {
  listaUsuarios.innerHTML = "";
  snap.forEach((child) => {
    const usuario = child.val();
    const li = document.createElement("li");
    li.innerHTML = usuario.isPremium
      ? `<span class="nick-premium">@${usuario.nickname}</span>`
      : `@${usuario.nickname}`;
    listaUsuarios.appendChild(li);
  });
});
