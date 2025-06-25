import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// — Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
  authDomain: "mmchat-f4f88.firebaseapp.com",
  databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
  projectId: "mmchat-f4f88",
  storageBucket: "mmchat-f4f88.appspot.com",
  messagingSenderId: "404598754438",
  appId: "1:404598754438:web:6a0892890d851507"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// — Identidade do usuário
const nickname = localStorage.getItem("nickname") || "Anônimo";
let   uid      = localStorage.getItem("uid");
if (!uid) {
  uid = "user_"+Math.random().toString(36).substr(2,8);
  localStorage.setItem("uid", uid);
}

// — Registro de presença
const userRef = ref(db, `onlineUsers/${uid}`);
set(userRef, nickname);
window.addEventListener("beforeunload", ()=> remove(userRef));

// — DOM refs
const mural             = document.getElementById("chat-mural");
const input             = document.getElementById("mensagemInput");
const enviarBtn         = document.getElementById("enviarBtn");
const modeSelect        = document.getElementById("modeSelect");
const mentionUserSelect = document.getElementById("mentionUserSelect");
const emojiBtn          = document.getElementById("emojiBtn");
const imgBtn            = document.getElementById("imgBtn");
const audioBtn          = document.getElementById("audioBtn");
const uploadAudioBtn    = document.getElementById("uploadAudioBtn");
const toggleScrollBtn   = document.getElementById("toggleScrollBtn");
const usuariosBtn       = document.getElementById("usuariosBtn");
const configBtn         = document.getElementById("configBtn");
const logoutBtn         = document.getElementById("logoutBtn");
const listaUsuarios     = document.getElementById("listaUsuarios");
const painelUsuarios    = document.getElementById("usuariosOnline");
const painelConfig      = document.getElementById("configPainel");
const fecharUsuarios    = document.getElementById("fecharUsuarios");
const fecharConfig      = document.getElementById("fecharConfig");
const audioModal        = document.getElementById("audioModal");
const recordBtn         = document.getElementById("recordBtn");
const stopBtn           = document.getElementById("stopBtn");
const playBtn           = document.getElementById("playBtn");
const sendAudioBtn      = document.getElementById("sendAudioBtn");
const cancelAudioBtn    = document.getElementById("cancelAudioBtn");

let mediaRecorder, audioChunks, audioBlob, audioUrl;

// — Toggle painel usuário/config
usuariosBtn.onclick    = ()=> painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = ()=> painelUsuarios.classList.remove("show");
configBtn.onclick      = ()=> painelConfig.classList.toggle("show");
fecharConfig.onclick   = ()=> painelConfig.classList.remove("show");

// — Mostrar select de Moita
modeSelect.addEventListener("change", ()=>{
  mentionUserSelect.hidden = modeSelect.value!=="moita";
});

// — Popula lista de usuários e opções “Moita”
onValue(ref(db,"onlineUsers"), snap=>{
  listaUsuarios.innerHTML = "";
  mentionUserSelect.innerHTML = '<option value="" disabled selected>Selecione usuário</option>';
  const data = snap.val()||{};
  Object.entries(data).forEach(([key,name])=>{
    // lista lateral
    const li = document.createElement("li");
    li.textContent = name;
    if(key!==uid){
      // convite “moita”
      const btnM = document.createElement("button");
      btnM.textContent="🌿";
      btnM.onclick=()=> requestMoita(key,name);
      li.append(btnM);
      // bloquear (placeholder)
      const btnB = document.createElement("button");
      btnB.textContent="🚫";
      li.append(btnB);
      // select moita
      const opt = document.createElement("option");
      opt.value=key; opt.textContent=name;
      mentionUserSelect.append(opt);
    }
    listaUsuarios.append(li);
  });
});

// — Solicita Moita (PV)
function requestMoita(destUid,destNick){
  push(ref(db,"pvSolicitacoes"),{
    deUid:uid,deNick:nickname,
    paraUid:destUid,paraNick:destNick,
    status:"pendente"
  });
}

// — Recebe convites PV
onChildAdded(ref(db,"pvSolicitacoes"), snap=>{
  const s=snap.val();
  if(s.paraUid===uid && s.status==="pendente"){
    const div=document.createElement("div");
    div.className="msg-pv";
    div.innerHTML=`
      <strong>@${s.deNick}</strong> quer moita.
      <button class="aceitarPV" data-id="${snap.key}">Aceitar</button>
      <button class="recusarPV" data-id="${snap.key}">Recusar</button>
    `;
    mural.append(div);
  }
});
document.addEventListener("click",e=>{
  const key=e.target.dataset.id;
  if(e.target.classList.contains("aceitarPV"))
    update(ref(db,`pvSolicitacoes/${key}`),{status:"aceito"});
  if(e.target.classList.contains("recusarPV"))
    update(ref(db,`pvSolicitacoes/${key}`),{status:"recusado"});
});

// — Envio com Enter
input.addEventListener("keydown",e=>{
  if(e.key==="Enter") enviarMensagem();
});
enviarBtn.onclick=()=>enviarMensagem();

// — Enviar mensagem Sala/Moita
function enviarMensagem(){
  const texto=input.value.trim();
  if(!texto) return;
  if(modeSelect.value==="moita"){
    const dest=mentionUserSelect.value;
    if(!dest){ alert("Selecione usuário para moita."); return; }
    push(ref(db,"mensagens"),{
      nick:nickname,uid,
      tipo:"moita",privadoPara:dest,
      conteudo:texto,hora:Date.now()
    });
  } else {
    push(ref(db,"mensagens"),{
      nick:nickname,uid,
      tipo:"texto",conteudo:texto,
      hora:Date.now()
    });
  }
  input.value="";
}

// — Renderização com filtro
onChildAdded(ref(db,"mensagens"),snap=>{
  const msg=snap.val();
  // filtro por modo
  if(modeSelect.value==="moita"){
    if(msg.tipo!=="moita") return;
    if(msg.uid!==uid && msg.privadoPara!==uid) return;
  } else {
    if(msg.tipo==="moita") return;
  }
  // monta
  const div=document.createElement("div");
  div.classList.add("msg-new");
  const span=document.createElement("span");
  span.style.fontWeight="bold";
  span.textContent=`@${msg.nick}: `;
  div.append(span, document.createTextNode(msg.conteudo));
  mural.append(div);
  if(document.getElementById("rolagemAuto")?.checked)
    mural.scrollTop=mural.scrollHeight;
});

// — Imagem
imgBtn.onclick=()=>{
  const fi=document.createElement("input");
  fi.type="file";fi.accept="image/*";
  fi.onchange=()=>{
    const r=new FileReader();
    r.onload=()=>push(ref(db,"mensagens"),{
      nick:nickname,uid,
      tipo:"img",conteudo:r.result,
      hora:Date.now()
    });
    r.readAsDataURL(fi.files[0]);
  };
  fi.click();
};

// — Áudio inline via modal
audioBtn.onclick=()=>{
  audioModal.hidden=false; audioModal.classList.add("show");
  audioChunks=[]; recordBtn.disabled=false;
  stopBtn.disabled=playBtn.disabled=sendAudioBtn.disabled=true;
};
recordBtn.onclick=()=>{
  navigator.mediaDevices.getUserMedia({audio:true})
    .then(stream=>{
      mediaRecorder=new MediaRecorder(stream);
      mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
      mediaRecorder.onstop=()=>{
        audioBlob=new Blob(audioChunks,{type:"audio/webm"});
        audioUrl=URL.createObjectURL(audioBlob);
        playBtn.disabled=sendAudioBtn.disabled=false;
      };
      mediaRecorder.start();
      recordBtn.disabled=true; stopBtn.disabled=false;
    });
};
stopBtn.onclick=()=>{ mediaRecorder.stop(); stopBtn.disabled=true; };
playBtn.onclick=()=>new Audio(audioUrl).play();
sendAudioBtn.onclick=()=>{
  const reader=new FileReader();
  reader.onloadend=()=>{
    push(ref(db,"mensagens"),{
      nick:nickname,uid,
      tipo:"audio",conteudo:reader.result,
      hora:Date.now()
    });
    audioModal.hidden=true; audioModal.classList.remove("show");
  };
  reader.readAsDataURL(audioBlob);
};
cancelAudioBtn.onclick=()=>{
  audioModal.hidden=true; audioModal.classList.remove("show");
  if(mediaRecorder?.state!=="inactive") mediaRecorder.stop();
};
audioModal.onclick=e=>{
  if(e.target===audioModal) cancelAudioBtn.onclick();
};

// — Upload áudio pronto
uploadAudioBtn.onclick=()=>{
  const fi=document.createElement("input");
  fi.type="file";fi.accept="audio/*";
  fi.onchange=()=>{
    const r=new FileReader();
    r.onload=()=>push(ref(db,"mensagens"),{
      nick:nickname,uid,
      tipo:"audio",conteudo:r.result,
      hora:Date.now()
    });
    r.readAsDataURL(fi.files[0]);
  };
  fi.click();
};

// — Scroll toggle
toggleScrollBtn.onclick=()=>{
  const chk=document.getElementById("rolagemAuto");
  chk.checked=!chk.checked;
};

// — Logout
logoutBtn.onclick=()=>{
  remove(userRef);
  localStorage.clear();
  window.location.href="index.html";
};
