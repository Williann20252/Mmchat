import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue,
  remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ————— Configuração Firebase —————
const firebaseConfig = { /* suas credenciais aqui */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ————— Identidade do usuário —————
const nickname =
  localStorage.getItem("nickname") ||
  prompt("Digite seu nickname:") ||
  "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

// ————— Premium —————
let isPremium = localStorage.getItem("isPremium") === "true";

// ————— Referências DOM —————
const mural           = document.getElementById("chat-mural");
const input           = document.getElementById("mensagemInput");
const enviarBtn       = document.getElementById("enviarBtn");
const pvMode          = document.getElementById("pvMode");
const pvSelect        = document.getElementById("pvSelect");
const usuariosBtn     = document.getElementById("usuariosBtn");
const configBtn       = document.getElementById("configBtn");
const listaUsuarios   = document.getElementById("listaUsuarios");
const logoutBtn       = document.getElementById("logoutBtn");
const imgBtn          = document.getElementById("imgBtn");
const audioBtn        = document.getElementById("audioBtn");
const premiumBtn      = document.getElementById("premiumBtn");
// **FALTAVAM ESTAS**:
const painelUsuarios  = document.getElementById("usuariosOnline");
const painelConfig    = document.getElementById("configPainel");
const fecharUsuarios  = document.getElementById("fecharUsuarios");
const fecharConfig    = document.getElementById("fecharConfig");

// ————— Registra usuário online —————
set(
  ref(db, `onlineUsers/${uid}`),
  { nome: nickname, premium: isPremium, horaEntrada: Date.now() }
);
window.addEventListener("beforeunload", () =>
  remove(ref(db, `onlineUsers/${uid}`))
);

// ————— Botão Premium —————
premiumBtn.onclick = () => {
  isPremium = true;
  localStorage.setItem("isPremium", "true");
  update(ref(db, `onlineUsers/${uid}`), { premium: true });
  alert("Parabéns! Você agora é Premium. 👍");
};

// ————— Boas-vindas —————
setTimeout(() => {
  const w = document.createElement("div");
  w.className = "msg-sistema";
  w.innerHTML = `
    👋 Olá, ${nickname}!<br>
    Bem-vindo(a) ao MMChat!<br>
    Considere ativar o <strong>Premium</strong> 💎 para manter este chat online.
  `;
  mural.appendChild(w);
}, 1000);

// ————— Lista de usuários + PV dropdown —————
onValue(ref(db, "onlineUsers"), (snap) => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML = '<option disabled selected>Selecione usuário</option>';
  const data = snap.val() || {};
  for (let [key, user] of Object.entries(data)) {
    const li = document.createElement("li");
    const badge = user.premium ? " 💎" : "";
    li.textContent = user.nome + badge;
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = user.nome;
      pvSelect.appendChild(opt);
    }
    listaUsuarios.appendChild(li);
  }
});

// ————— Envio de mensagem (geral ou PV) —————
function enviarMensagem() {
  const texto = input.value.trim();
  if (!texto) return;

  if (pvMode.checked) {
    const destUid = pvSelect.value;
    if (!destUid) { alert("Selecione um usuário para PV."); return; }
    push(ref(db, "mensagens"), {
      nick: nickname,
      uid,
      tipo: "pv",
      conteudo: texto,
      hora: Date.now(),
      privadoPara: destUid
    });
  } else {
    push(ref(db, "mensagens"), {
      nick: nickname,
      uid,
      tipo: "texto",
      conteudo: texto,
      hora: Date.now()
    });
  }
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => e.key === "Enter" && enviarMensagem());

// ————— Renderização de mensagens —————
onChildAdded(ref(db, "mensagens"), (snap) => {
  const msg = snap.val();
  if (msg.tipo === "pv" && !(msg.uid === uid || msg.privadoPara === uid))
    return;

  const div = document.createElement("div");
  if (msg.tipo === "pv") div.className = "msg-pv";

  const span = document.createElement("span");
  span.textContent =
    msg.tipo === "pv"
      ? `🔒 [PV] @${msg.nick}: `
      : `@${msg.nick}: `;
  span.style.fontWeight = "bold";
  div.appendChild(span);
  div.appendChild(document.createTextNode(msg.conteudo));

  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});

// ────── Reativando botões da interface ──────
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");

configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");

logoutBtn.onclick      = () => {
  remove(ref(db, `onlineUsers/${uid}`));
  localStorage.clear();
  window.location.reload();
};

pvMode.addEventListener("change", () => {
  pvSelect.hidden = !pvMode.checked;
});

imgBtn.onclick = () => {
  const fi = document.createElement("input");
  fi.type = "file";
  fi.accept = "image/*";
  fi.onchange = () => {
    const file = fi.files[0];
    const reader = new FileReader();
    reader.onload = () =>
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid,
        tipo: "img",
        conteudo: reader.result,
        hora: Date.now()
      });
    reader.readAsDataURL(file);
  };
  fi.click();
};

audioBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const r = new FileReader();
    r.onloadend = () =>
      push(ref(db, "mensagens"), {
        nick: nickname,
        uid,
        tipo: "audio",
        conteudo: r.result,
        hora: Date.now()
      });
    r.readAsDataURL(blob);
  };
  rec.start();
  setTimeout(() => rec.stop(), 60000);
};
