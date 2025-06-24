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
const nickname = localStorage.getItem("nickname") || prompt("Digite seu nickname:") || "Anônimo";
let   uid      = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", uid);
}
// marca o início da sessão para filtrar histórico
const sessionStart = Date.now();

// ————— Referências DOM —————
const mural           = document.getElementById("chat-mural");
const input           = document.getElementById("mensagemInput");
const enviarBtn       = document.getElementById("enviarBtn");
const pvMode          = document.getElementById("pvMode");
const pvSelect        = document.getElementById("pvSelect");
const imgBtn          = document.getElementById("imgBtn");
const audioBtn        = document.getElementById("audioBtn");
const usuariosBtn     = document.getElementById("usuariosBtn");
const configBtn       = document.getElementById("configBtn");
const listaUsuarios   = document.getElementById("listaUsuarios");
const logoutBtn       = document.getElementById("logoutBtn");
const premiumBtn      = document.getElementById("premiumBtn");
const painelUsuarios  = document.getElementById("usuariosOnline");
const fecharUsuarios  = document.getElementById("fecharUsuarios");
const painelConfig    = document.getElementById("configPainel");
const fecharConfig    = document.getElementById("fecharConfig");

// ————— Registra usuário online —————
set(ref(db, `onlineUsers/${uid}`), {
  nome: nickname,
  premium: (localStorage.getItem("isPremium") === "true"),
  horaEntrada: Date.now()
});
window.addEventListener("beforeunload", () =>
  remove(ref(db, `onlineUsers/${uid}`))
);

// ————— Botão Premium —————
premiumBtn.onclick = () => {
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

// ————— Lista de usuários + PV dropdown —————
onValue(ref(db, "onlineUsers"), snap => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML = '<option disabled selected>Selecione usuário</option>';
  const data = snap.val()||{};
  Object.entries(data).forEach(([key,user]) => {
    const li = document.createElement("li");
    li.textContent = user.nome + (user.premium?" 💎":"");
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key; opt.textContent = user.nome;
      pvSelect.appendChild(opt);
      li.addEventListener("click", () => solicitarPV(key, user.nome));
    }
    listaUsuarios.appendChild(li);
  });
});

function solicitarPV(destUid, destNick) {
  push(ref(db, "pvSolicitacoes"), {
    deUid: uid, deNick: nickname,
    paraUid: destUid, paraNick: destNick,
    status: "pendente"
  });
}

// ————— Pedidos de PV —————
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
  if (e.target.classList.contains("aceitarPV"))
    update(ref(db, `pvSolicitacoes/${key}`), { status: "aceito" });
  if (e.target.classList.contains("recusarPV"))
    update(ref(db, `pvSolicitacoes/${key}`), { status: "recusado" });
});

// ————— Envio de mensagens —————
function enviarMensagem() {
  const texto = input.value.trim();
  if (!texto) return;
  if (pvMode.checked) {
    const dest = pvSelect.value;
    if (!dest) { alert("Selecione usuário para PV."); return; }
    push(ref(db, "mensagens"), {
      nick: nickname, uid,
      tipo: "pv", conteudo: texto,
      hora: Date.now(),
      privadoPara: dest
    });
  } else {
    push(ref(db, "mensagens"), {
      nick: nickname, uid,
      tipo: "texto", conteudo: texto,
      hora: Date.now()
    });
  }
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => e.key==="Enter" && enviarMensagem());

// ————— Renderização de mensagens —————
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();

  // ignora mensagens anteriores ao login
  if (msg.hora < sessionStart) return;

  const div = document.createElement("div");
  const span = document.createElement("span");
  span.style.fontWeight = "bold";
  span.textContent = msg.tipo==="pv"
    ? `🔒 [PV] @${msg.nick}: `
    : `@${msg.nick}: `;
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
      img.style.display = img.style.display==="none" ? "block":"none";
      btn.textContent = img.style.display==="none"?"Ver imagem":"Ocultar";
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
  if (document.getElementById("rolagemAuto")?.checked ?? true) {
    mural.scrollTop = mural.scrollHeight;
  }
});

// ────── Reativando botões da UI ──────
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");
imgBtn.onclick         = () => {
  const fi = document.createElement("input");
  fi.type="file"; fi.accept="image/*";
  fi.onchange = ()=> {
    const r = new FileReader();
    r.onload = ()=>{
      push(ref(db,"mensagens"),{
        nick:nickname, uid,
        tipo:"img", conteudo:r.result, hora:Date.now()
      });
    };
    r.readAsDataURL(fi.files[0]);
  };
  fi.click();
};
audioBtn.onclick       = async()=>{
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  const rec    = new MediaRecorder(stream);
  const chunks=[];
  rec.ondataavailable = e=>chunks.push(e.data);
  rec.onstop = ()=>{
    const blob = new Blob(chunks,{type:"audio/webm"});
    const r    = new FileReader();
    r.onloadend = ()=>{
      push(ref(db,"mensagens"),{
        nick:nickname, uid,
        tipo:"audio", conteudo:r.result, hora:Date.now()
      });
    };
    r.readAsDataURL(blob);
  };
  rec.start();
  setTimeout(()=>rec.stop(),60000);
};
logoutBtn.onclick      = () => {
  remove(ref(db,`onlineUsers/${uid}`));
  localStorage.clear();
  window.location.reload();
};
