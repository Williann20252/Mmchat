import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue,
  remove, update
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
let   uid      = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2,10);
  localStorage.setItem("uid", uid);
}

// ————— Referências ao DOM —————
const mural         = document.getElementById("chat-mural");
const input         = document.getElementById("mensagemInput");
const enviarBtn     = document.getElementById("enviarBtn");
const imgBtn        = document.getElementById("imgBtn");
const audioBtn      = document.getElementById("audioBtn");
const usuariosBtn   = document.getElementById("usuariosBtn");
const configBtn     = document.getElementById("configBtn");
const logoutBtn     = document.getElementById("logoutBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const painelUsuarios= document.getElementById("usuariosOnline");
const fecharUsuarios= document.getElementById("fecharUsuarios");
const painelConfig  = document.getElementById("configPainel");
const fecharConfig  = document.getElementById("fecharConfig");

// PV controls
const pvMode   = document.getElementById("pvMode");
const pvSelect = document.getElementById("pvSelect");

// ————— Limpeza de histórico —————
const sessionStart = Date.now();

// ————— Boas-vindas (apenas para este usuário) —————
mural.innerHTML = "";
const welcomeDiv = document.createElement("div");
welcomeDiv.className = "msg-sistema";
welcomeDiv.innerHTML = `👋 Olá, <strong>${nickname}</strong>! Bem-vindo(a) ao MMChat!`;
mural.appendChild(welcomeDiv);

// ————— Presença online —————
const userRef = ref(db, `onlineUsers/${uid}`);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

// ————— Atualiza lista de usuários e dropdown PV —————
onValue(ref(db, "onlineUsers"), snap => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML   = '<option value="" disabled selected>Selecione usuário</option>';
  const data = snap.val() || {};
  Object.entries(data).forEach(([key,name]) => {
    // Lista lateral
    const li = document.createElement("li");
    li.textContent = name;
    listaUsuarios.appendChild(li);
    // Dropdown PV (exceto eu)
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = name;
      pvSelect.appendChild(opt);
    }
  });
});

// ————— Envio de mensagem —————
function enviarMensagem() {
  const texto = input.value.trim();
  if (!texto) return;
  const base = { nick: nickname, uid, conteudo: texto, hora: Date.now() };
  if (pvMode.checked) {
    const dest = pvSelect.value;
    if (!dest) { alert("Selecione usuário para Privado."); return; }
    push(ref(db,"mensagens"),{ ...base, tipo:"pv", privadoPara:dest });
  } else {
    push(ref(db,"mensagens"),{ ...base, tipo:"texto" });
  }
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => e.key==="Enter" && enviarMensagem());

// ————— Recepção e renderização de mensagens —————
onChildAdded(ref(db,"mensagens"),snap=>{
  const msg = snap.val();
  if(msg.hora < sessionStart) return;
  if(msg.tipo==="pv"){
    if(!pvMode.checked) return;
    const dest = pvSelect.value; if(!dest) return;
    const éEnviador = msg.uid===uid && msg.privadoPara===dest;
    const éReceptor = msg.privadoPara===uid && msg.uid===dest;
    if(!(éEnviador||éReceptor)) return;
  } else if(pvMode.checked) return;

  const div = document.createElement("div");
  const span = document.createElement("span");
  span.style.fontWeight="bold";
  if(msg.tipo==="pv"){ span.textContent=`🔒 [PV] @${msg.nick}: `; }
  else{ span.textContent=`@${msg.nick}: `; }
  div.appendChild(span);

  if(msg.tipo==="texto"||msg.tipo==="pv"){
    div.appendChild(document.createTextNode(msg.conteudo));
  } else if(msg.tipo==="img"){
    const btn=document.createElement("button"); btn.textContent="Ver imagem";
    const img=document.createElement("img"); img.src=msg.conteudo;
    img.style.maxWidth="100%"; img.style.display="none";
    btn.onclick=()=>{
      img.style.display=img.style.display==="none"?"block":"none";
      btn.textContent=img.style.display==="none"?"Ver imagem":"Ocultar";
    };
    div.appendChild(btn); div.appendChild(img);
  } else if(msg.tipo==="audio"){
    const audio=document.createElement("audio"); audio.src=msg.conteudo;
    audio.controls=true; div.appendChild(audio);
  }

  mural.appendChild(div); mural.scrollTop=mural.scrollHeight;
});

// ————— Upload de imagem —————
imgBtn.onclick=()=>{
  const inp=document.createElement("input"); inp.type="file";
  inp.accept="image/*"; inp.onchange=()=>{
    const reader=new FileReader(); reader.onload=()=>{
      push(ref(db,"mensagens"),{
        nick:nickname, uid,
        tipo:(pvMode.checked?"pv":"texto"),
        conteudo:reader.result,
        hora:Date.now(),
        ...(pvMode.checked?{privadoPara:pvSelect.value}:{})
      });
    }; reader.readAsDataURL(inp.files[0]);
  }; inp.click();
};

// ————— Gravação de áudio —————
audioBtn.onclick=async()=>{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  const rec=new MediaRecorder(stream); const chunks=[];
  rec.ondataavailable=e=>chunks.push(e.data);
  rec.onstop=()=>{
    const blob=new Blob(chunks,{type:"audio/webm"}); const reader=new FileReader();
    reader.onloadend=()=>push(ref(db,"mensagens"),{
      nick:nickname, uid,
      tipo:(pvMode.checked?"pv":"texto"),
      conteudo:reader.result,
      hora:Date.now(),
      ...(pvMode.checked?{privadoPara:pvSelect.value}:{})
    });
    reader.readAsDataURL(blob);
  }; rec.start(); setTimeout(()=>rec.stop(),60000);
};

// ————— Logout manual e automático —————
function logoutUser(){
  remove(userRef); localStorage.clear(); window.location.reload();
}
logoutBtn.onclick=logoutUser;
let idleTimer;
const resetIdle=()=>{
  clearTimeout(idleTimer);
  idleTimer=setTimeout(()=>{
    alert("Você foi desconectado por inatividade.");
    logoutUser();
  },5*60*1000);
};
["mousemove","keydown","click","touchstart"].forEach(evt=>window.addEventListener(evt,resetIdle));
resetIdle();

// ————— UI controls —————
usuariosBtn.onclick=()=>painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick=()=>painelUsuarios.classList.remove("show");
configBtn.onclick=()=>painelConfig.classList.toggle("show");
fecharConfig.onclick=()=>painelConfig.classList.remove("show");
pvMode.addEventListener("change",()=>{
  pvSelect.hidden=!pvMode.checked;
  mural.innerHTML="";
});
