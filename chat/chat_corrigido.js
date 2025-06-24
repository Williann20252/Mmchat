import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase config
const firebaseConfig = { /* suas credenciais */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Identidade
const nickname = localStorage.getItem("nickname") || prompt("Nickname:") || "Anônimo";
let uid = localStorage.getItem("uid");
if(!uid){ uid="user_"+Math.random().toString(36).substr(2); localStorage.setItem("uid",uid);}

// Limpeza histórico
const sessionStart = Date.now();

// DOM
const mural=document.getElementById("chat-mural");
const input=document.getElementById("mensagemInput");
const enviarBtn=document.getElementById("enviarBtn");
const imgBtn=document.getElementById("imgBtn");
const audioBtn=document.getElementById("recordBtn");
const stopBtn=document.getElementById("stopBtn");
const playBtn=document.getElementById("playBtn");
const sendAudioBtn=document.getElementById("sendAudioBtn");
const cancelAudioBtn=document.getElementById("cancelAudioBtn");
const usuariosBtn=document.getElementById("usuariosBtn");
const configBtn=document.getElementById("configBtn");
const logoutBtn=document.getElementById("logoutBtn");
const listaUsuarios=document.getElementById("listaUsuarios");
const painelUsuarios=document.getElementById("usuariosOnline");
const painelConfig=document.getElementById("configPainel");
const fecharUsuarios=document.getElementById("fecharUsuarios");
const fecharConfig=document.getElementById("fecharConfig");
const pvMode=document.getElementById("pvMode");
const pvSelect=document.getElementById("pvSelect");
const corFonte=document.getElementById("corFonte");
const corNick=document.getElementById("corNick");
const gradNick=document.getElementById("gradienteNick");
const autoScroll=document.getElementById("rolagemAuto");
const audioModal=document.getElementById("audioModal");

// Boas-vindas
const welcome=document.createElement("div");
welcome.className="msg-sistema";
welcome.innerText=`👋 Olá, ${nickname}! Bem-vindo!`;
mural.appendChild(welcome);

// Presença online
const userRef = ref(db,`onlineUsers/${uid}`);
set(userRef,nickname);
window.addEventListener("beforeunload",()=>remove(userRef));

// Atualiza usuários
onValue(ref(db,"onlineUsers"),snap=>{
  listaUsuarios.innerHTML="";
  pvSelect.innerHTML='<option disabled selected>Selecionar</option>';
  const data=snap.val()||{};
  Object.entries(data).forEach(([k,v])=>{
    const li=document.createElement("li");
    li.textContent=v; listaUsuarios.appendChild(li);
    if(k!==uid){pvSelect.hidden=false;
      const opt=document.createElement("option");
      opt.value=k; opt.textContent=v; pvSelect.appendChild(opt);
    }
  });
});

// Envio msg
enviarBtn.onclick=()=>{
  const txt=input.value.trim(); if(!txt) return;
  const base={nick:nickname,uid,conteudo:txt,hora:Date.now()};
  if(pvMode.checked){
    if(!pvSelect.value){alert("Selecione PV");return;}
    push(ref(db,"mensagens"),{...base,tipo:"pv",privadoPara:pvSelect.value});
  } else push(ref(db,"mensagens"),{...base,tipo:"texto"});
  input.value="";
};
input.onkeydown=e=>e.key==="Enter"&&enviarBtn.onclick();

// Renderização
onChildAdded(ref(db,"mensagens"),snap=>{
  const msg=snap.val();
  if(msg.hora<sessionStart)return;
  if(msg.tipo==="pv"){
    if(!pvMode.checked) return;
    const dest=pvSelect.value;
    if(!(msg.uid===uid&&msg.privadoPara===dest)||(msg.privadoPara===uid&&msg.uid===dest)) return;
  } else if(pvMode.checked) return;
  const div=document.createElement("div");
  const span=document.createElement("span");
  span.className="nick"; span.textContent=(msg.tipo==="pv"?"🔒 ":"")+"@"+msg.nick+": ";
  if(gradNick.checked) span.style.background="linear-gradient(90deg,#ff8a00,#e52e71)",span.style.webkitBackgroundClip="text",span.style.color="transparent";
  else span.style.color=corNick.value;
  div.appendChild(span);
  const content=document.createTextNode(msg.conteudo);
  content.style.color=corFonte.value;
  div.appendChild(content);
  mural.appendChild(div);
  if(autoScroll.checked)mural.scrollTop=mural.scrollHeight;
});

// Gravação áudio
let recorder, chunks, audioURL;
audioBtn.onclick=()=>{
  audioModal.hidden=false; chunks=[];
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>chunks.push(e.data);
    recorder.onstop=()=>{
      const blob=new Blob(chunks,{type:"audio/webm"}); audioURL=URL.createObjectURL(blob);
      playBtn.disabled=false; sendAudioBtn.disabled=false;
    };
    recorder.start();
    stopBtn.disabled=false; playBtn.disabled=true; sendAudioBtn.disabled=true;
  });
};
stopBtn.onclick=()=>{
  recorder.stop(); stopBtn.disabled=true;
};
playBtn.onclick=()=>{
  const audio=new Audio(audioURL); audio.play();
};
sendAudioBtn.onclick=()=>{
  fetch(audioURL).then(r=>r.blob()).then(blob=>{
    const reader=new FileReader();
    reader.onload=()=>push(ref(db,"mensagens"),{
      nick:nickname,uid,tipo:"audio",conteudo:reader.result,hora:Date.now()
    });
    reader.readAsDataURL(blob);
    audioModal.hidden=true;
  });
};
cancelAudioBtn.onclick=()=>{ audioModal.hidden=true; if(recorder && recorder.state!=="inactive") recorder.stop(); };

// Logout
const logoutUser=()=>{remove(userRef);localStorage.clear();location.reload()};
logoutBtn.onclick=logoutUser;
let idle;const resetIdle=()=>{clearTimeout(idle);idle=setTimeout(()=>{alert("Inativo");logoutUser();},5*60*1000);};
["mousemove","keydown","click","touchstart"].forEach(e=>window.addEventListener(e,resetIdle));
resetIdle();

// UI controls
usuariosBtn.onclick=()=>painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick=()=>painelUsuarios.classList.remove("show");
configBtn.onclick=()=>painelConfig.classList.toggle("show");
fecharConfig.onclick=()=>painelConfig.classList.remove("show");
pvMode.onchange=()=>{pvSelect.hidden=!pvMode.checked; mural.innerHTML="";};
corFonte.oninput=()=>document.querySelectorAll("#chat-mural div").forEach(d=>d.style.color=corFonte.value);
corNick.oninput=()=>{}; // nick handled on render
