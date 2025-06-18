import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔧 Firebase real
const firebaseConfig = {
  apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
  authDomain: "mmchat-f4f88.firebaseapp.com",
  databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
  projectId: "mmchat-f4f88",
  storageBucket: "mmchat-f4f88.firebasestorage.app",
  messagingSenderId: "404598754438",
  appId: "1:404598754438:web:6a0892895591430d851507"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔐 Identificação
let nickname = localStorage.getItem("nickname") || "Anônimo";
let userType = localStorage.getItem("userType") || "anonimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

// DOM
const mural = document.getElementById("chat-mural");
const input = document.getElementById("mensagemInput");
const enviarBtn = document.getElementById("enviarBtn");
const usuariosBtn = document.getElementById("usuariosBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const logoutBtn = document.getElementById("logoutBtn");
const imgBtn = document.getElementById("imgBtn");
const audioBtn = document.getElementById("audioBtn");
const configBtn = document.getElementById("configBtn");
const configPainel = document.getElementById("configPainel");

// Configurações personalizadas
const corFonte = document.getElementById("corFonte");
const corNick = document.getElementById("corNick");
const rolagemAuto = document.getElementById("rolagemAuto");
const gradienteNick = document.getElementById("gradienteNick");

corFonte.value = localStorage.getItem("corFonte") || "#333333";
corNick.value = localStorage.getItem("corNick") || "#ff00ff";
rolagemAuto.checked = localStorage.getItem("rolagemAuto") === "true";
gradienteNick.checked = localStorage.getItem("gradienteNick") === "true";

// Online
const userRef = ref(db, "onlineUsers/" + uid);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

// Lista de usuários
onValue(ref(db, "onlineUsers"), (snapshot) => {
  listaUsuarios.innerHTML = "";
  const data = snapshot.val() || {};
  Object.values(data).forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    listaUsuarios.appendChild(li);
  });
});

// Enviar mensagem
enviarBtn.addEventListener("click", () => {
  const texto = input.value.trim();
  if (!texto) return;
  push(ref(db, "mensagens"), {
    nick: nickname,
    uid: uid,
    tipo: "texto",
    conteudo: texto,
    hora: Date.now()
  });
  input.value = "";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enviarBtn.click();
});

// Receber mensagens
onChildAdded(ref(db, "mensagens"), (snapshot) => {
  const msg = snapshot.val();
  const div = document.createElement("div");
  const nickSpan = document.createElement("span");

  nickSpan.textContent = `@${msg.nick}: `;
  nickSpan.style.fontWeight = "bold";
  nickSpan.style.color = msg.uid === uid ? "#00ffff" : corNick.value;

  if (gradienteNick.checked && userType === "premium") {
    nickSpan.style.background = "linear-gradient(90deg, #00f, #0ff)";
    nickSpan.style.webkitBackgroundClip = "text";
    nickSpan.style.webkitTextFillColor = "transparent";
  }

  div.appendChild(nickSpan);

  if (msg.tipo === "texto") {
    const span = document.createElement("span");
    span.textContent = msg.conteudo;
    span.style.color = corFonte.value;
    div.appendChild(span);
  } else if (msg.tipo === "img") {
    const img = document.createElement("img");
    img.src = msg.conteudo;
    img.style.maxWidth = "100%";
    img.style.display = "none";
    img.style.marginTop = "10px";

    const btn = document.createElement("button");
    btn.textContent = "Ver imagem";
    btn.onclick = () => {
      img.style.display = img.style.display === "none" ? "block" : "none";
      btn.textContent = img.style.display === "none" ? "Ver imagem" : "Ocultar";
    };

    div.appendChild(btn);
    div.appendChild(img);
  } else if (msg.tipo === "audio") {
    const audio = document.createElement("audio");
    audio.src = msg.conteudo;
    audio.controls = true;
    div.appendChild(audio);
  }

  mural.appendChild(div);
  if (rolagemAuto.checked) mural.scrollTop = mural.scrollHeight;
});

// Imagem
imgBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid: uid,
        tipo: "img",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(file);
  };
  input.click();
});

// Áudio
audioBtn.addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onloadend = () => {
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid: uid,
        tipo: "audio",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(blob);
  };
  recorder.start();
  alert("Gravando por 60 segundos...");
  setTimeout(() => recorder.stop(), 60000);
});

// Configurações
configBtn.addEventListener("click", () => {
  configPainel.classList.toggle("show");
});

corFonte.addEventListener("input", () => {
  localStorage.setItem("corFonte", corFonte.value);
});

corNick.addEventListener("input", () => {
  localStorage.setItem("corNick", corNick.value);
});

rolagemAuto.addEventListener("change", () => {
  localStorage.setItem("rolagemAuto", rolagemAuto.checked);
});

gradienteNick.addEventListener("change", () => {
  localStorage.setItem("gradienteNick", gradienteNick.checked);
});

// Sair
logoutBtn.addEventListener("click", () => {
  remove(userRef);
  localStorage.clear();
  window.location.href = "index.html";
});
