import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue,
  remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// — Firebase Config & Init
const firebaseConfig = {/* suas credenciais */};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// — Identidade do usuário
const nickname = localStorage.getItem("nickname")||"Anônimo";
let uid = localStorage.getItem("uid");
if(!uid){ uid="user_"+Math.random().toString(36).substr(2,10);
          localStorage.setItem("uid",uid); }

// — DOM refs
const mural         = document.getElementById("chat-mural");
const input         = document.getElementById("mensagemInput");
const enviarBtn     = document.getElementById("enviarBtn");
const usuariosBtn   = document.getElementById("usuariosBtn");
const configBtn     = document.getElementById("configBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const painelUsuarios= document.getElementById("usuariosOnline");
const painelConfig  = document.getElementById("configPainel");
const fecharUsuarios= document.getElementById("fecharUsuarios");
const fecharConfig  = document.getElementById("fecharConfig");

// — Presença
const userRef = ref(db,`onlineUsers/${uid}`);
set(userRef,nickname);
window.addEventListener("beforeunload",()=>remove(userRef));

// — Toggle dropdowns
usuariosBtn.onclick    = ()=> painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = ()=> painelUsuarios.classList.remove("show");
configBtn.onclick      = ()=> painelConfig.classList.toggle("show");
fecharConfig.onclick   = ()=> painelConfig.classList.remove("show");

// — Enviar com Enter
input.addEventListener("keydown",e=>{
  if(e.key==="Enter") enviarMensagem();
});

// — Envio de mensagem
function enviarMensagem(){
  const texto = input.value.trim();
  if(!texto) return;
  push(ref(db,"mensagens"),{
    nick:nickname,uid, tipo:"texto",
    conteudo:texto, hora:Date.now()
  });
  input.value="";
}
enviarBtn.onclick = enviarMensagem;

// — Receber mensagens
onChildAdded(ref(db,"mensagens"),snap=>{
  const msg = snap.val();
  // criar container
  const div = document.createElement("div");
  div.classList.add("msg-new");

  // montar texto com destaque de @menção
  let html = msg.conteudo.replace(
    /@([A-Za-z0-9_]+)/g,
    `<span class="mention">@$1</span>`
  );
  div.innerHTML = `<strong>@${msg.nick}:</strong> ${html}`;

  // scroll
  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});

// — Lista de usuários online
onValue(ref(db,"onlineUsers"),snap=>{
  listaUsuarios.innerHTML="";
  const data = snap.val()||{};
  Object.entries(data).forEach(([key,name])=>{
    const li = document.createElement("li");
    li.textContent = name;
    if(key!==uid){
      li.style.cursor="pointer";
      li.onclick = ()=> solicitarPV(key,name);
    }
    listaUsuarios.appendChild(li);
  });
});

// — Solicitar PV
function solicitarPV(destUid, destNick){
  push(ref(db,"pvSolicitacoes"),{
    deUid:uid,deNick:nickname,
    paraUid:destUid,paraNick:destNick,
    status:"pendente"
  });
}

// — Receber/aceitar PV
onChildAdded(ref(db,"pvSolicitacoes"),snap=>{
  const s = snap.val();
  if(s.paraUid===uid && s.status==="pendente"){
    const div = document.createElement("div");
    div.className="msg-pv";
    div.innerHTML=`
      <strong>@${s.deNick}</strong> quer PV.
      <button class="aceitarPV" data-id="${snap.key}">Aceitar</button>
      <button class="recusarPV" data-id="${snap.key}">Recusar</button>
    `;
    mural.appendChild(div);
  }
});
document.addEventListener("click",e=>{
  const id = e.target.dataset.id;
  if(e.target.classList.contains("aceitarPV"))
    update(ref(db,`pvSolicitacoes/${id}`),{status:"aceito"});
  if(e.target.classList.contains("recusarPV"))
    update(ref(db,`pvSolicitacoes/${id}`),{status:"recusado"});
});

// — Imagem e Áudio (fica igual ao seu)

// imgBtn.onclick = ...
// audioBtn.onclick = ...
