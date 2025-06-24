import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onChildAdded,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ————— Configuração Firebase —————
const firebaseConfig = {
  apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
  authDomain: "mmchat-f4f88.firebaseapp.com",
  databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
  projectId: "mmchat-f4f88",
  storageBucket: "mmchat-f4f88.appspot.com",
  messagingSenderId: "404598754438",
  appId: "1:404598754438:web:60892895591430d851507"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ————— Identidade do usuário —————
const nickname = localStorage.getItem("nickname") || prompt("Digite seu nickname:") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

// ————— Início da sessão —————
const sessionStart = Date.now();

// ————— Referências ao DOM —————
const mural          = document.getElementById("chat-mural");
const input          = document.getElementById("mensagemInput");
const enviarBtn      = document.getElementById("enviarBtn");
const usuariosBtn    = document.getElementById("usuariosBtn");
const configBtn      = document.getElementById("configBtn");
const listaUsuarios  = document.getElementById("listaUsuarios");
const logoutBtn      = document.getElementById("logoutBtn");
const imgBtn         = document.getElementById("imgBtn");
const audioBtn       = document.getElementById("audioBtn");
const painelUsuarios = document.getElementById("usuariosOnline");
const painelConfig   = document.getElementById("configPainel");
const fecharUsuarios = document.getElementById("fecharUsuarios");
const fecharConfig   = document.getElementById("fecharConfig");

// ————— Presença online —————
const userRef = ref(db, `onlineUsers/${uid}`);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

// ————— Atualiza lista de usuários online —————
onValue(ref(db, "onlineUsers"), snapshot => {
  listaUsuarios.innerHTML = "";
  const data = snapshot.val() || {};
  Object.entries(data).forEach(([key, name]) => {
    const li = document.createElement("li");
    li.textContent = name;
    listaUsuarios.appendChild(li);
  });
});

// ————— Solicitação de PV —————
function solicitarPV(destUid, destNick) {
  push(ref(db, "pvSolicitacoes"), {
    deUid: uid,
    deNick: nickname,
    paraUid: destUid,
    paraNick: destNick,
    status: "pendente",
    hora: Date.now()
  });
}

// ————— Exibe pedidos de PV —————
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
  const key = e.target.dataset?.id;
  if (!key) return;
  if (e.target.classList.contains("aceitarPV")) {
    update(ref(db, `pvSolicitacoes/${key}`), { status: "aceito" });
  }
  if (e.target.classList.contains("recusarPV")) {
    update(ref(db, `pvSolicitacoes/${key}`), { status: "recusado" });
  }
});

// ————— Envio de mensagens públicas —————
function enviarMensagem() {
  const texto = input.value.trim();
  if (!texto) return;
  push(ref(db, "mensagens"), {
    nick: nickname,
    uid,
    tipo: "texto",
    conteudo: texto,
    hora: Date.now()
  });
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => {
  if (e.key === "Enter") enviarMensagem();
});

// ————— Renderização de mensagens com limpeza de histórico —————
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();
  // filtra mensagens anteriores ao início da sessão
  if (msg.hora < sessionStart) return;

  const div = document.createElement("div");
  const span = document.createElement("span");
  span.textContent = `@${msg.nick}: `;
  span.style.fontWeight = "bold";
  div.appendChild(span);

  if (msg.tipo === "texto") {
    div.appendChild(document.createTextNode(msg.conteudo));
  } else if (msg.tipo === "img") {
    const btn = document.createElement("button");
    btn.textContent = "Ver imagem";
    const img = document.createElement("img");
    img.src = msg.conteudo;
    img.style.maxWidth = "100%";
    img.style.display = "none";
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
  mural.scrollTop = mural.scrollHeight;
});

// ————— Upload de mídia —————
imgBtn.onclick = () => {
  const fi = document.createElement("input");
  fi.type = "file";
  fi.accept = "image/*";
  fi.onchange = () => {
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
    reader.readAsDataURL(fi.files[0]);
  };
  fi.click();
};

audioBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onloadend = () => {
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid,
        tipo: "audio",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(blob);
  };
  recorder.start();
  setTimeout(() => recorder.stop(), 60000);
};

// ————— Controles de UI —————
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");

configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");

logoutBtn.onclick      = () => {
  remove(userRef);
  localStorage.clear();
  window.location.reload();
};
