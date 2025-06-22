import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue,
  remove, update, get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuração Firebase
const firebaseConfig = { /* suas credenciais aqui */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Identidade
const nickname = localStorage.getItem("nickname") || prompt("Digite seu nickname:") || "Anônimo";
let uid = localStorage.getItem("uid");
if (!uid) { uid = "user_" + Math.random().toString(36).substring(2, 10); localStorage.setItem("uid", uid); }
let isPremium = localStorage.getItem("isPremium") === "true";

// DOM
const mural      = document.getElementById("chat-mural");
const input      = document.getElementById("mensagemInput");
const enviarBtn  = document.getElementById("enviarBtn");
const pvMode     = document.getElementById("pvMode");
const pvSelect   = document.getElementById("pvSelect");
const usuariosBtn= document.getElementById("usuariosBtn");
const configBtn  = document.getElementById("configBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const logoutBtn  = document.getElementById("logoutBtn");
const imgBtn     = document.getElementById("imgBtn");
const audioBtn   = document.getElementById("audioBtn");
const premiumBtn = document.getElementById("premiumBtn");

// Jogo
const gameBtn       = document.getElementById("gameBtn");
const gamePanel     = document.getElementById("gamePanel");
const closeGame     = document.getElementById("closeGame");
const playerCardsEl = document.getElementById("playerCards");
const dealerCardsEl = document.getElementById("dealerCards");
const playerScoreEl = document.getElementById("playerScore");
const dealerScoreEl = document.getElementById("dealerScore");
const hitBtn        = document.getElementById("hitBtn");
const standBtn      = document.getElementById("standBtn");
const resetGameBtn  = document.getElementById("resetGameBtn");
const gameResultEl  = document.getElementById("gameResult");

// Registrar usuário online
const horaEntradaLocal = Date.now();
set(ref(db, `onlineUsers/${uid}`), { nome: nickname, premium: isPremium, horaEntrada: horaEntradaLocal });
window.addEventListener("beforeunload", () => remove(ref(db, `onlineUsers/${uid}`)));

// Premium
premiumBtn.onclick = () => {
  isPremium = true;
  localStorage.setItem("isPremium", "true");
  update(ref(db, `onlineUsers/${uid}`), { premium: true });
  alert("Parabéns! Você agora é Premium. 👍");
};

// Boas-vindas
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

// Lista de usuários + PV dropdown
onValue(ref(db, "onlineUsers"), (snap) => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML = '<option value="" disabled selected>Selecione usuário</option>';
  const data = snap.val() || {};
  Object.entries(data).forEach(([key, user]) => {
    const li = document.createElement("li");
    const displayName = user.nome;
    const badge = user.premium ? `<span class='premium-badge'>💎</span>` : "";
    li.innerHTML = `${displayName} ${badge}`;
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key; opt.textContent = displayName;
      pvSelect.appendChild(opt);
    }
    listaUsuarios.appendChild(li);
  });
});

// Envio de mensagem
function enviarMensagem() {
  let texto = input.value.trim();
  if (!texto) return;
  if (pvMode.checked) {
    const destUid = pvSelect.value, destNick = pvSelect.options[pvSelect.selectedIndex].text;
    if (!destUid) { alert("Selecione um usuário para PV."); return; }
    push(ref(db, "mensagens"), { nick: nickname, uid, tipo: "pv", conteudo: texto, hora: Date.now(), privadoPara: destUid, privadoNick: destNick });
  } else {
    push(ref(db, "mensagens"), { nick: nickname, uid, tipo: "texto", conteudo: texto, hora: Date.now() });
  }
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => e.key==="Enter" && enviarMensagem());

// Renderiza mensagens
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();
  if (msg.tipo==="pv" && !(msg.uid===uid || msg.privadoPara===uid)) return;
  const div = document.createElement("div");
  if (msg.tipo==="pv") div.className="msg-pv";
  const span = document.createElement("span");
  span.textContent = msg.tipo==="pv" ? `🔒 [PV] @${msg.nick}: ` : `@${msg.nick}: `;
  span.style.fontWeight="bold";
  div.appendChild(span); div.appendChild(document.createTextNode(msg.conteudo));
  mural.appendChild(div); mural.scrollTop=mural.scrollHeight;
});

// Lógica Jogo 21
function buildDeck() { const suits=["♠","♥","♦","♣"], vals=["A","2","3","4","5","6","7","8","9","10","J","Q","K"], d=[]; suits.forEach(s=>vals.forEach(v=>d.push({suit:s,val:v}))); return d.sort(()=>Math.random()-0.5); }
function cardValue(c){ if(["J","Q","K"].includes(c.val))return 10; if(c.val==="A")return 11; return parseInt(c.val);}
function calcScore(h){ let total=h.reduce((sum,c)=>sum+cardValue(c),0), aces=h.filter(c=>c.val==="A").length; while(total>21&&aces>0){total-=10; aces--;} return total;}
function renderHands(){ playerCardsEl.innerHTML=""; dealerCardsEl.innerHTML=""; playerHand.forEach(c=>{let d=document.createElement("div");d.className="card";d.textContent=c.val+c.suit;playerCardsEl.appendChild(d);}); dealerHand.forEach(c=>{let d=document.createElement("div");d.className="card";d.textContent=c.val+c.suit;dealerCardsEl.appendChild(d);}); playerScoreEl.textContent=calcScore(playerHand); dealerScoreEl.textContent=calcScore(dealerHand);}
function endGame(){ const p=calcScore(playerHand), d=calcScore(dealerHand); let msg=p>21?"Você estourou! 🤕":d>21?"Dealer estourou! Você venceu! 🎉":p===d?"Empate!":p>d?"Você venceu! 🎉":"Dealer venceu!"; gameResultEl.textContent=msg; hitBtn.disabled=standBtn.disabled=true;}
function dealerPlay(){ while(calcScore(dealerHand)<17) dealerHand.push(deck.pop());}
function startGame(){ deck=buildDeck(); playerHand=[deck.pop(),deck.pop()]; dealerHand=[deck.pop(),deck.pop()]; gameResultEl.textContent=""; hitBtn.disabled=standBtn.disabled=false; renderHands();}

let deck, playerHand, dealerHand;
gameBtn.onclick=()=>gamePanel.classList.toggle("show");
closeGame.onclick=()=>gamePanel.classList.remove("show");
resetGameBtn.onclick=startGame;
hitBtn.onclick=()=>{playerHand.push(deck.pop()); renderHands(); if(calcScore(playerHand)>21) endGame();};
standBtn.onclick=()=>{dealerPlay(); renderHands(); endGame();};
gameBtn.addEventListener("click", startGame);

// Reativar botões UI
usuariosBtn.onclick=()=>painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick=()=>painelUsuarios.classList.remove("show");
configBtn.onclick=()=>painelConfig.classList.toggle("show");
fecharConfig.onclick=()=>painelConfig.classList.remove("show");
logoutBtn.onclick=()=>{remove(ref(db,`onlineUsers/${uid}`));localStorage.clear();window.location.reload();};
pvMode.addEventListener("change",()=>{pvSelect.hidden=!pvMode.checked;});
imgBtn.onclick=()=>{const fileInput=document.createElement("input");fileInput.type="file";fileInput.accept="image/*";fileInput.onchange=()=>{const file=fileInput.files[0], reader=new FileReader();reader.onload=()=>push(ref(db,"mensagens"),{nick:nickname,uid,tipo:"img",conteudo:reader.result,hora:Date.now()});reader.readAsDataURL(file)};fileInput.click();};
audioBtn.onclick=async()=>{const stream=await navigator.mediaDevices.getUserMedia({audio:true}),rec=new MediaRecorder(stream),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{const blob=new Blob(chunks,{type:"audio/webm"}),r=new FileReader();r.onloadend=()=>push(ref(db,"mensagens"),{nick:nickname,uid,tipo:"audio",conteudo:r.result,hora:Date.now()});r.readAsDataURL(blob)};rec.start();setTimeout(()=>rec.stop(),60000);};
