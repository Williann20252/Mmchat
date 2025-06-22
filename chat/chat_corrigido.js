import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onChildAdded,
  onValue,
  remove,
  update,
  get
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
const mural = document.getElementById("chat-mural");
const input = document.getElementById("mensagemInput");
const enviarBtn = document.getElementById("enviarBtn");
const pvMode = document.getElementById("pvMode");
const pvSelect = document.getElementById("pvSelect");
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
const premiumBtn = document.getElementById("premiumBtn");

// ————— Registra usuário online —————
const horaEntradaLocal = Date.now();
set(
  ref(db, `onlineUsers/${uid}`),
  { nome: nickname, premium: isPremium, horaEntrada: horaEntradaLocal }
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

// ————— Mensagem de boas-vindas —————
setTimeout(() => {
  const welcomeDiv = document.createElement("div");
  welcomeDiv.className = "msg-sistema";
  welcomeDiv.innerHTML = `
    👋 Olá, ${nickname}!<br>
    Bem-vindo(a) ao MMChat!<br>
    Considere ativar o <strong>Premium</strong> 💎 para manter este chat online.
  `;
  mural.appendChild(welcomeDiv);
}, 1000);

// ————— Lista de usuários + PV dropdown —————
onValue(ref(db, "onlineUsers"), (snapshot) => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML =
    '<option value="" disabled selected>Selecione usuário</option>';
  const data = snapshot.val() || {};
  Object.entries(data).forEach(([key, user]) => {
    const li = document.createElement("li");
    const displayName = user.nome;
    const badge = user.premium
      ? `<span class='premium-badge' title='Premium'>💎</span>`
      : "";
    li.innerHTML = `${displayName} ${badge}`;
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = displayName;
      pvSelect.appendChild(opt);
    }
    listaUsuarios.appendChild(li);
  });
});

// ————— Envio de mensagem (geral ou PV) —————
function enviarMensagem() {
  let texto = input.value.trim();
  if (!texto) return;

  if (pvMode.checked) {
    const destUid = pvSelect.value;
    const destNick = pvSelect.options[pvSelect.selectedIndex].text;
    if (!destUid) {
      alert("Selecione um usuário para PV.");
      return;
    }
    push(ref(db, "mensagens"), {
      nick: nickname,
      uid,
      tipo: "pv",
      conteudo: texto,
      hora: Date.now(),
      privadoPara: destUid,
      privadoNick: destNick
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
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enviarMensagem();
});

// ————— Renderização de mensagens —————
onChildAdded(ref(db, "mensagens"), (snap) => {
  const msg = snap.val();
  // filtra PV para quem não participa
  if (msg.tipo === "pv" && !(msg.uid === uid || msg.privadoPara === uid))
    return;

  const div = document.createElement("div");
  if (msg.tipo === "pv") div.className = "msg-pv";

  const nickSpan = document.createElement("span");
  nickSpan.textContent =
    msg.tipo === "pv"
      ? `🔒 [PV] @${msg.nick}: `
      : `@${msg.nick}: `;
  nickSpan.style.fontWeight = "bold";
  div.appendChild(nickSpan);
  div.appendChild(document.createTextNode(msg.conteudo));

  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});

// ────── Reativando botões da interface ──────

// Abre/fecha painel de usuários
usuariosBtn.onclick = () =>
  painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () =>
  painelUsuarios.classList.remove("show");

// Abre/fecha painel de configurações
configBtn.onclick = () =>
  painelConfig.classList.toggle("show");
fecharConfig.onclick = () =>
  painelConfig.classList.remove("show");

// Logout
logoutBtn.onclick = () => {
  remove(ref(db, `onlineUsers/${uid}`));
  localStorage.clear();
  window.location.reload();
};

// Toggle PV
pvMode.addEventListener("change", () => {
  pvSelect.hidden = !pvMode.checked;
});

// Envio de imagem
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
        uid,
        tipo: "img",
        conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
};

// Gravação de áudio
audioBtn.onclick = async () => {
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
