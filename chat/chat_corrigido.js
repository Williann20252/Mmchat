import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue,
  remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ————— Configuração Firebase —————
const firebaseConfig = { /* suas credenciais aqui */ };
const app    = initializeApp(firebaseConfig);
const db     = getDatabase(app);

// ————— Identidade do usuário —————
const nickname = localStorage.getItem("nickname") || prompt("Nickname:") || "Anônimo";
let uid        = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).slice(2,10);
  localStorage.setItem("uid", uid);
}
let isPremium = localStorage.getItem("isPremium")==="true";

// ————— Refs do DOM —————
const mural         = document.getElementById("chat-mural");
const input         = document.getElementById("mensagemInput");
const enviarBtn     = document.getElementById("enviarBtn");
const pvMode        = document.getElementById("pvMode");
const pvSelect      = document.getElementById("pvSelect");
const imgBtn        = document.getElementById("imgBtn");
const audioBtn      = document.getElementById("audioBtn");
const usuariosBtn   = document.getElementById("usuariosBtn");
const configBtn     = document.getElementById("configBtn");
const logoutBtn     = document.getElementById("logoutBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const premiumBtn    = document.getElementById("premiumBtn");

// **Essas é que faltavam na sua última versão** 
const painelUsuarios = document.getElementById("usuariosOnline");
const fecharUsuarios = document.getElementById("fecharUsuarios");
const painelConfig   = document.getElementById("configPainel");
const fecharConfig   = document.getElementById("fecharConfig");

// ————— Registra usuário online —————
set(ref(db, `onlineUsers/${uid}`), {
  nome: nickname,
  premium: isPremium,
  horaEntrada: Date.now()
});
window.addEventListener("beforeunload", () =>
  remove(ref(db, `onlineUsers/${uid}`))
);

// ————— Botão Premium —————
premiumBtn.onclick = () => {
  isPremium = true;
  localStorage.setItem("isPremium","true");
  update(ref(db, `onlineUsers/${uid}`), { premium: true });
  alert("Você agora é Premium! 🎉");
};

// ————— Boas-vindas —————
setTimeout(() => {
  const w = document.createElement("div");
  w.className = "msg-sistema";
  w.innerHTML = `
    👋 Olá, ${nickname}!<br>
    Bem-vindo(a) ao MMChat!<br>
    Considere ativar o <strong>Premium</strong> 💎.
  `;
  mural.appendChild(w);
}, 1000);

// ————— Atualiza lista online + PV dropdown —————
onValue(ref(db, "onlineUsers"), snap => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML = '<option disabled selected>Selecione usuário</option>';
  const data = snap.val()||{};
  Object.entries(data).forEach(([key,user])=>{
    const li = document.createElement("li");
    li.textContent = user.nome + (user.premium?" 💎":"");
    if(key !== uid){
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key; opt.textContent = user.nome;
      pvSelect.appendChild(opt);
    }
    listaUsuarios.appendChild(li);
  });
});

// ————— Envio de mensagens (geral ou PV) —————
function enviarMensagem(){
  const texto = input.value.trim();
  if(!texto) return;

  if(pvMode.checked){
    const dest = pvSelect.value;
    if(!dest){ alert("Selecione usuário para PV."); return; }
    push(ref(db,"mensagens"), {
      nick: nickname, uid,
      tipo:"pv", conteudo:texto, hora:Date.now(),
      privadoPara: dest
    });
  } else {
    push(ref(db,"mensagens"), {
      nick: nickname, uid,
      tipo:"texto", conteudo:texto, hora:Date.now()
    });
  }
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => e.key==="Enter" && enviarMensagem());

// ————— Renderização de mensagens —————
onChildAdded(ref(db,"mensagens"), snap=>{
  const msg = snap.val();
  if(msg.tipo==="pv" && !(msg.uid===uid||msg.privadoPara===uid)) return;
  const div = document.createElement("div");
  if(msg.tipo==="pv") div.className="msg-pv";
  const span = document.createElement("span");
  span.style.fontWeight="bold";
  span.textContent = msg.tipo==="pv"
    ? `🔒 [PV] @${msg.nick}: `
    : `@${msg.nick}: `;
  div.appendChild(span);
  div.appendChild(document.createTextNode(msg.conteudo));
  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});

// ─────── Reativando botões da UI ───────

// Painel Usuários
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");

// Painel Configurações
configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");

// Logout
logoutBtn.onclick      = () => {
  remove(ref(db, `onlineUsers/${uid}`));
  localStorage.clear();
  window.location.reload();
};

// Toggle PV
pvMode.addEventListener("change", ()=>{
  pvSelect.hidden = !pvMode.checked;
});

// Envio de imagem
imgBtn.onclick = () => {
  const fi = document.createElement("input");
  fi.type = "file"; fi.accept = "image/*";
  fi.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => push(ref(db,"mensagens"),{
      nick: nickname, uid,
      tipo:"img", conteudo:reader.result, hora:Date.now()
    });
    reader.readAsDataURL(fi.files[0]);
  };
  fi.click();
};

// Gravação de áudio
audioBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  const rec    = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks,{type:"audio/webm"});
    const r    = new FileReader();
    r.onloadend = () => push(ref(db,"mensagens"),{
      nick: nickname, uid,
      tipo:"audio", conteudo:r.result, hora:Date.now()
    });
    r.readAsDataURL(blob);
  };
  rec.start();
  setTimeout(()=>rec.stop(),60000);
};
