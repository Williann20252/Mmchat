import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update, get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = { /* suas credenciais */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const nickname = localStorage.getItem("nickname") || prompt("Digite seu nickname:") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}

let isPremium = localStorage.getItem("isPremium") === "true";

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

const horaEntradaLocal = Date.now();
set(ref(db, `onlineUsers/${uid}`), { nome: nickname, premium: isPremium, horaEntrada: horaEntradaLocal });
window.addEventListener("beforeunload", () => remove(ref(db, `onlineUsers/${uid}`)));

premiumBtn.onclick = () => {
  isPremium = true;
  localStorage.setItem("isPremium", "true");
  update(ref(db, `onlineUsers/${uid}`), { premium: true });
  alert("Parabéns! Você agora é Premium.👍");
};

// Mensagem de boas-vindas
setTimeout(() => {
  const welcomeDiv = document.createElement('div');
  welcomeDiv.className = 'msg-sistema';
  welcomeDiv.innerHTML = `
    👋 Olá, ${nickname}!<br>
    Bem-vindo(a) ao MMChat!<br>
    Considere ativar o <strong>Premium</strong> 💎 para manter este chat online.
  `;
  mural.appendChild(welcomeDiv);
}, 1000);

onValue(ref(db, "onlineUsers"), (snapshot) => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML = '<option value="" disabled selected>Selecione usuário</option>';
  const data = snapshot.val() || {};
  Object.entries(data).forEach(([key, user]) => {
    const li = document.createElement("li");
    const displayName = user.nome;
    const badge = user.premium ? `<span class='premium-badge' title='Premium'>💎</span>` : "";
    li.innerHTML = `${displayName} ${badge}`;
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option"); opt.value = key; opt.textContent = displayName;
      pvSelect.appendChild(opt);
    }
    listaUsuarios.appendChild(li);
  });
});

function enviarMensagem() {
  let texto = input.value.trim(); if (!texto) return;
  if (pvMode.checked) {
    const destUid = pvSelect.value; const destNick = pvSelect.options[pvSelect.selectedIndex].text;
    if (!destUid) { alert("Selecione um usuário para PV."); return; }
    push(ref(db, "mensagens"), { nick: nickname, uid, tipo: "pv", conteudo: texto, hora: Date.now(), privadoPara: destUid, privadoNick: destNick });
  } else {
    push(ref(db, "mensagens"), { nick: nickname, uid, tipo: "texto", conteudo: texto, hora: Date.now() });
  }
  input.value = "";
}

enviarBtn.onclick = enviarMensagem;

onChildAdded(ref(db, "mensagens"), (snap) => {
  const msg = snap.val();
  if (msg.tipo === "pv" && !(msg.uid === uid || msg.privadoPara === uid)) return;
  const div = document.createElement("div");
  if (msg.tipo === "pv") div.className = "msg-pv";
  const nickSpan = document.createElement("span");
  nickSpan.textContent = msg.tipo === "pv" ? `🔒 [PV] @${msg.nick}: ` : `@${msg.nick}: `;
  div.appendChild(nickSpan); div.appendChild(document.createTextNode(msg.conteudo));
  mural.appendChild(div); mural.scrollTop = mural.scrollHeight;
});