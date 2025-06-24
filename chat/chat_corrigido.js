import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// — Firebase
const firebaseConfig = { /* suas credenciais */ };
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// — Identidade
const nickname = localStorage.getItem("nickname") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

// — DOM
const mural          = document.getElementById("chat-mural");
const input          = document.getElementById("mensagemInput");
const enviarBtn      = document.getElementById("enviarBtn");
const imgBtn         = document.getElementById("imgBtn");
const audioBtn       = document.getElementById("audioBtn");
const uploadAudioBtn = document.getElementById("uploadAudioBtn");
const usuariosBtn    = document.getElementById("usuariosBtn");
const configBtn      = document.getElementById("configBtn");
const logoutBtn      = document.getElementById("logoutBtn");
const listaUsuarios  = document.getElementById("listaUsuarios");
const painelUsuarios = document.getElementById("usuariosOnline");
const painelConfig   = document.getElementById("configPainel");
const fecharUsuarios = document.getElementById("fecharUsuarios");
const fecharConfig   = document.getElementById("fecharConfig");

// — Presença
set(ref(db, `onlineUsers/${uid}`), nickname);
window.addEventListener("beforeunload", () => remove(ref(db, `onlineUsers/${uid}`)));

// — Dropdowns Usuários / Config
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");

// — Enviar com Enter
input.addEventListener("keydown", e => {
  if (e.key === "Enter") enviarMensagem();
});

// — Enviar texto
function enviarMensagem() {
  const txt = input.value.trim();
  if (!txt) return;
  push(ref(db, "mensagens"), {
    nick: nickname,
    uid,
    tipo: "texto",
    conteudo: txt,
    hora: Date.now()
  });
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;

// — Enviar imagem
imgBtn.onclick = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid,
        tipo: "img",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(fileInput.files[0]);
  };
  fileInput.click();
};

// — Gravação de áudio (modal já implementado)
// — veja seu código de modal aqui, mas garanta estes handlers:
const audioModal     = document.getElementById("audioModal");
const recordBtn      = document.getElementById("recordBtn");
const stopBtn        = document.getElementById("stopBtn");
const playBtn        = document.getElementById("playBtn");
const sendAudioBtn   = document.getElementById("sendAudioBtn");
const cancelAudioBtn = document.getElementById("cancelAudioBtn");
let mediaRecorder, audioChunks, audioBlob, audioUrl;

audioBtn.onclick = () => {
  audioModal.classList.add("show");
  audioModal.hidden = false;
  audioChunks = [];
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  playBtn.disabled = true;
  sendAudioBtn.disabled = true;
};
recordBtn.onclick = () => {/* ...seu código de gravação... */};
stopBtn.onclick   = () => {/* ...parar gravação... */};
playBtn.onclick   = () => {/* ...tocar áudio... */};
sendAudioBtn.onclick = () => {/* ...enviar áudio via push... */};
cancelAudioBtn.onclick = () => {
  audioModal.classList.remove("show");
  audioModal.hidden = true;
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
};

// — Upload de arquivo de áudio
uploadAudioBtn.onclick = () => {
  const fi = document.createElement("input");
  fi.type = "file";
  fi.accept = "audio/*";
  fi.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid,
        tipo: "audio",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(fi.files[0]);
  };
  fi.click();
};

// — Lista de usuários
onValue(ref(db, "onlineUsers"), snap => {
  listaUsuarios.innerHTML = "";
  const data = snap.val() || {};
  Object.entries(data).forEach(([key, name]) => {
    const li = document.createElement("li");
    li.textContent = name;
    if (key !== uid) li.onclick = () => solicitarPV(key, name);
    listaUsuarios.appendChild(li);
  });
});

// — PV
function solicitarPV(destUid, destNick) {
  push(ref(db, "pvSolicitacoes"), {
    deUid: uid,
    deNick: nickname,
    paraUid: destUid,
    paraNick: destNick,
    status: "pendente"
  });
}

// — Renderizar mensagens e PV (como antes)
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();
  // highlight de menções e animação de nova mensagem
  const div = document.createElement("div");
  div.classList.add("msg-new");
  const text = msg.conteudo.replace(
    /@([A-Za-z0-9_]+)/g,
    `<span class="mention">@$1</span>`
  );
  div.innerHTML = `<strong>@${msg.nick}:</strong> ${text}`;
  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});
