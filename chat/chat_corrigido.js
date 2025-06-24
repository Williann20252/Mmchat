import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// — Configuração Firebase
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
const db  = getDatabase(app);

// — Identidade do usuário
const nickname = localStorage.getItem("nickname") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

// — Registro de presença
const userRef = ref(db, `onlineUsers/${uid}`);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

// — Referências ao DOM
const mural           = document.getElementById("chat-mural");
const input           = document.getElementById("mensagemInput");
const enviarBtn       = document.getElementById("enviarBtn");
const imgBtn          = document.getElementById("imgBtn");
const audioBtn        = document.getElementById("audioBtn");
const uploadAudioBtn  = document.getElementById("uploadAudioBtn");
const usuariosBtn     = document.getElementById("usuariosBtn");
const configBtn       = document.getElementById("configBtn");
const logoutBtn       = document.getElementById("logoutBtn");
const listaUsuarios   = document.getElementById("listaUsuarios");
const painelUsuarios  = document.getElementById("usuariosOnline");
const painelConfig    = document.getElementById("configPainel");
const fecharUsuarios  = document.getElementById("fecharUsuarios");
const fecharConfig    = document.getElementById("fecharConfig");

// — Toggle dropdowns de Usuários / Configurações
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");

// — Enviar mensagem ao pressionar Enter
input.addEventListener("keydown", e => {
  if (e.key === "Enter") enviarMensagem();
});

// — Função de envio de texto
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

// — Envio de imagem
imgBtn.onclick = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
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
    reader.readAsDataURL(fileInput.files[0]);
  };
  fileInput.click();
};

// — Modal de gravação de áudio
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

recordBtn.onclick = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioUrl  = URL.createObjectURL(audioBlob);
      playBtn.disabled = false;
      sendAudioBtn.disabled = false;
    };
    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
  });
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  stopBtn.disabled = true;
};

playBtn.onclick = () => {
  const audio = new Audio(audioUrl);
  audio.play();
};

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

cancelAudioBtn.onclick = () => {
  audioModal.classList.remove("show");
  audioModal.hidden = true;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

audioModal.onclick = e => {
  if (e.target === audioModal) {
    audioModal.classList.remove("show");
    audioModal.hidden = true;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }
};

// — Upload de arquivo de áudio existente
uploadAudioBtn.onclick = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "audio/*";
  fileInput.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid: uid,
        tipo: "audio",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(fileInput.files[0]);
  };
  fileInput.click();
};

// — Logout
logoutBtn.onclick = () => {
  remove(userRef);
  localStorage.clear();
  window.location.href = "../index.html";
};

// — Lista de usuários online
onValue(ref(db, "onlineUsers"), snapshot => {
  listaUsuarios.innerHTML = "";
  const data = snapshot.val() || {};
  Object.entries(data).forEach(([key, name]) => {
    const li = document.createElement("li");
    li.textContent = name;
    if (key !== uid) {
      li.style.cursor = "pointer";
      li.onclick = () => solicitarPV(key, name);
    }
    listaUsuarios.appendChild(li);
  });
});

// — Solicitar chat privado (PV)
function solicitarPV(destUid, destNick) {
  push(ref(db, "pvSolicitacoes"), {
    deUid: uid,
    deNick: nickname,
    paraUid: destUid,
    paraNick: destNick,
    status: "pendente"
  });
}

// — Receber/aceitar PV
onChildAdded(ref(db, "pvSolicitacoes"), snap => {
  const s = snap.val();
  if (s.paraUid === uid && s.status === "pendente") {
    const div = document.createElement("div");
    div.className = "msg-pv";
    div.innerHTML = `
      <strong>@${s.deNick}</strong> deseja conversar reservadamente.
      <button class="aceitarPV" data-id="${snap.key}">Aceitar</button>
      <button class="recusarPV" data-id="${snap.key}">Recusar</button>
    `;
    mural.appendChild(div);
  }
});

document.addEventListener("click", e => {
  const key = e.target.dataset.id;
  if (e.target.classList.contains("aceitarPV")) {
    update(ref(db, `pvSolicitacoes/${key}`), { status: "aceito" });
  }
  if (e.target.classList.contains("recusarPV")) {
    update(ref(db, `pvSolicitacoes/${key}`), { status: "recusado" });
  }
});

// — Renderizar mensagens no mural
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();
  const div = document.createElement("div");
  div.classList.add("msg-new");
  const html = msg.conteudo.replace(
    /@([A-Za-z0-9_]+)/g,
    `<span class="mention">@$1</span>`
  );
  div.innerHTML = `<strong>@${msg.nick}:</strong> ${html}`;
  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});
