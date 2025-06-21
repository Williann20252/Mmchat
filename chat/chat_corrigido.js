
 // Teste visual

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
  authDomain: "mmchat-f4f88.firebaseapp.com",
  databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
  projectId: "mmchat-f4f88",
  storageBucket: "mmchat-f4f88.appspot.com",
  messagingSenderId: "404598754438",
  appId: "1:404598754438:web:6a0892895591430d851507"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const nickname = localStorage.getItem("nickname") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

const mural = document.getElementById("chat-mural");

setTimeout(() => {
  const div = document.createElement("div");
  div.innerHTML = `
    👋 Olá, ${nickname}!<br>
    Este chat é mantido com a ajuda dos <strong>usuários Premium</strong> 💎.<br>
    Considere apoiar o projeto para garantir que ele continue online. 🙌
  `;
  div.style.background = "linear-gradient(to right, #6a11cb, #2575fc)";
  div.style.color = "#fff";
  div.style.padding = "12px";
  div.style.margin = "10px 0";
  div.style.borderRadius = "12px";
  div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  div.style.fontSize = "0.95rem";
  div.style.lineHeight = "1.4";
  div.style.fontWeight = "500";
  div.style.textAlign = "center";
  mural.appendChild(div);
}, 600);

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

const userRef = ref(db, "onlineUsers/" + uid);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

onValue(ref(db, "onlineUsers"), (snapshot) => {
  listaUsuarios.innerHTML = "";
  const data = snapshot.val() || {};
  Object.entries(data).forEach(([key, name]) => {
    const li = document.createElement("li");
    li.textContent = name;
    if (key !== uid) {
      li.addEventListener("click", () => solicitarPV(key, name));
    }
    listaUsuarios.appendChild(li);
  });
});

function solicitarPV(destUid, destNick) {
  push(ref(db, "pvSolicitacoes"), {
    deUid: uid,
    deNick: nickname,
    paraUid: destUid,
    paraNick: destNick,
    status: "pendente"
  });
}

onChildAdded(ref(db, "pvSolicitacoes"), (snap) => {
  const s = snap.val();
  if (s.paraUid === uid && s.status === "pendente") {
    const div = document.createElement("div");
    div.className = "msg-pv";
    div.innerHTML = `<strong>@${s.deNick}</strong> deseja conversar reservadamente.
      <button class='aceitarPV' data-id='${snap.key}'>Aceitar</button> 
      <button class='recusarPV' data-id='${snap.key}'>Recusar</button>`;
    mural.appendChild(div);
  }
});

document.addEventListener("click", (e) => {
  const key = e.target.dataset?.id;
  if (e.target.classList.contains("aceitarPV")) {
    update(ref(db, `pvSolicitacoes/${key}`), { status: "aceito" });
  }
  if (e.target.classList.contains("recusarPV")) {
    update(ref(db, `pvSolicitacoes/${key}`), { status: "recusado" });
  }
});

function enviarMensagem() {
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
}

enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enviarMensagem();
});

onChildAdded(ref(db, "mensagens"), (snap) => {
  const msg = snap.val();
  const div = document.createElement("div");
  const nickSpan = document.createElement("span");
  nickSpan.textContent = `@${msg.nick}: `;
  nickSpan.style.fontWeight = "bold";
  nickSpan.style.color = msg.uid === uid ? "#00ffff" : "#ff00ff";
  div.appendChild(nickSpan);

  if (msg.tipo === "texto") {
    div.innerHTML += msg.conteudo;
  } else if (msg.tipo === "img") {
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Ver imagem";
    const img = document.createElement("img");
    img.src = msg.conteudo;
    img.style.maxWidth = "100%";
    img.style.display = "none";
    toggleBtn.onclick = () => {
      img.style.display = img.style.display === "none" ? "block" : "none";
      toggleBtn.textContent = img.style.display === "none" ? "Ver imagem" : "Ocultar";
    };
    div.appendChild(toggleBtn);
    div.appendChild(img);
  } else if (msg.tipo === "audio") {
    const audio = document.createElement("audio");
    audio.src = msg.conteudo;
    audio.controls = true;
    div.appendChild(audio);
  }

  mural.appendChild(div);
  if (document.getElementById("rolagemAuto")?.checked ?? true) {
    mural.scrollTop = mural.scrollHeight;
  }
});

imgBtn.onclick = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
    const file = fileInput.files[0];
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
  fileInput.click();
};


let mediaRecorder;
let audioChunks = [];

audioBtn.onclick = async () => {
  document.getElementById("audioModal").classList.add("show");
};

document.getElementById("gravarBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    const preview = document.getElementById("previewAudio");
    preview.innerHTML = "";
    preview.appendChild(audio);

    document.getElementById("enviarAudio").disabled = false;
  };

  mediaRecorder.start();
  document.getElementById("gravarBtn").disabled = true;
  document.getElementById("pararBtn").disabled = false;
};

document.getElementById("pararBtn").onclick = () => {
  mediaRecorder.stop();
  document.getElementById("gravarBtn").disabled = false;
  document.getElementById("pararBtn").disabled = true;
};

document.getElementById("cancelarAudio").onclick = () => {
  document.getElementById("audioModal").classList.remove("show");
  document.getElementById("previewAudio").innerHTML = "";
  document.getElementById("enviarAudio").disabled = true;
};

document.getElementById("enviarAudio").onclick = () => {
  const blob = new Blob(audioChunks, { type: "audio/webm" });
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

  document.getElementById("audioModal").classList.remove("show");
  document.getElementById("previewAudio").innerHTML = "";
  document.getElementById("enviarAudio").disabled = true;
};


usuariosBtn.onclick = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
configBtn.onclick = () => painelConfig.classList.toggle("show");
fecharConfig.onclick = () => painelConfig.classList.remove("show");

logoutBtn.onclick = () => {
  remove(userRef);
  localStorage.clear();
  window.location.href = "../index.html";
};
