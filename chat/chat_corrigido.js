alert("JS funcionando!"); // Teste visual

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
  appId: "1:404598754438:web:6a0892895591430d851507"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ————— Identidade e DOM —————
const nickname      = localStorage.getItem("nickname") || "Anônimo";
let   uid           = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2,10);
  localStorage.setItem("uid", uid);
}

const mural         = document.getElementById("chat-mural"),
      input         = document.getElementById("mensagemInput"),
      enviarBtn     = document.getElementById("enviarBtn"),
      usuariosBtn   = document.getElementById("usuariosBtn"),
      configBtn     = document.getElementById("configBtn"),
      listaUsuarios = document.getElementById("listaUsuarios"),
      logoutBtn     = document.getElementById("logoutBtn"),
      imgBtn        = document.getElementById("imgBtn"),
      audioBtn      = document.getElementById("audioBtn"),
      painelUsuarios= document.getElementById("usuariosOnline"),
      painelConfig  = document.getElementById("configPainel"),
      fecharUsuarios= document.getElementById("fecharUsuarios"),
      fecharConfig  = document.getElementById("fecharConfig");

// Referência online
const userRef = ref(db, "onlineUsers/" + uid);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

// ————— Listagem de usuários e PV —————
onValue(ref(db, "onlineUsers"), snapshot => {
  listaUsuarios.innerHTML = "";
  const data = snapshot.val() || {};
  Object.entries(data).forEach(([key, name]) => {
    const li = document.createElement("li");
    li.textContent = name;
    if (key !== uid) li.addEventListener("click", () => solicitarPV(key, name));
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
  push(ref(db, "mensagens"), {
    nick: nickname, uid,
    tipo: "texto", conteudo: texto,
    hora: Date.now()
  });
  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => { if (e.key === "Enter") enviarMensagem(); });

// ————— Renderização de mensagens —————
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();
  const div = document.createElement("div");
  const nickSpan = document.createElement("span");
  nickSpan.textContent = `@${msg.nick}: `;
  nickSpan.style.fontWeight = "bold";
  nickSpan.style.color = msg.uid === uid ? "#00ffff" : "#ff00ff";
  div.appendChild(nickSpan);

  if (msg.tipo === "texto") {
    div.innerHTML += msg.conteudo;
  } else if (msg.tipo === "img") {
    const btn = document.createElement("button");
    btn.textContent = "Ver imagem";
    const img = document.createElement("img");
    img.src = msg.conteudo; img.style.maxWidth = "100%";
    img.style.display = "none";
    btn.onclick = () => {
      img.style.display = img.style.display === "none" ? "block" : "none";
      btn.textContent = img.style.display === "none" ? "Ver imagem" : "Ocultar";
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
  const auto = document.getElementById("rolagemAuto");
  if (auto?.checked ?? true) mural.scrollTop = mural.scrollHeight;
});

// ————— Upload de mídia —————
imgBtn.onclick = () => {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => {
    const file = inp.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      push(ref(db, "mensagens"), {
        nick: nickname, uid,
        tipo: "img", conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(file);
  };
  inp.click();
};
audioBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onloadend = () => {
      push(ref(db, "mensagens"), {
        nick: nickname, uid,
        tipo: "audio", conteudo: reader.result,
        hora: Date.now()
      });
    };
    reader.readAsDataURL(blob);
  };
  recorder.start();
  setTimeout(() => recorder.stop(), 60000);
  alert("Gravando... será enviado automaticamente após 60s.");
});

// ────── A partir daqui, integra “Jogo de 21” ──────

// captura dos elementos do jogo
const gameBtn       = document.getElementById("gameBtn"),
      gamePanel     = document.getElementById("gamePanel"),
      closeGame     = document.getElementById("closeGame"),
      playerCardsEl = document.getElementById("playerCards"),
      dealerCardsEl = document.getElementById("dealerCards"),
      playerScoreEl = document.getElementById("playerScore"),
      dealerScoreEl = document.getElementById("dealerScore"),
      hitBtn        = document.getElementById("hitBtn"),
      standBtn      = document.getElementById("standBtn"),
      resetGameBtn  = document.getElementById("resetGameBtn"),
      gameResultEl  = document.getElementById("gameResult");

let deck, playerHand, dealerHand;
function buildDeck() {
  const suits = ["♠","♥","♦","♣"],
        vals  = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  let d = [];
  suits.forEach(s => vals.forEach(v => d.push({ suit: s, val: v })));
  return d.sort(() => Math.random() - 0.5);
}
function cardValue(c) {
  if (["J","Q","K"].includes(c.val)) return 10;
  if (c.val==="A") return 11;
  return parseInt(c.val,10);
}
function calcScore(hand) {
  let total = hand.reduce((sum,c)=>sum+cardValue(c), 0);
  let aces = hand.filter(c=>c.val==="A").length;
  while (total>21 && aces>0) { total-=10; aces--; }
  return total;
}
function renderHands() {
  playerCardsEl.innerHTML = "";
  dealerCardsEl.innerHTML = "";
  playerHand.forEach(c=>{
    let card = document.createElement("div");
    card.className="card";
    card.textContent = c.val + c.suit;
    playerCardsEl.appendChild(card);
  });
  dealerHand.forEach(c=>{
    let card = document.createElement("div");
    card.className="card";
    card.textContent = c.val + c.suit;
    dealerCardsEl.appendChild(card);
  });
  playerScoreEl.textContent = calcScore(playerHand);
  dealerScoreEl.textContent = calcScore(dealerHand);
}
function endGame() {
  const p = calcScore(playerHand),
        d = calcScore(dealerHand);
  let msg = p>21 ? "Você estourou! 🤕"
          : d>21 ? "Dealer estourou! Você venceu! 🎉"
          : p===d ? "Empate!"
          : p>d ? "Você venceu! 🎉"
          : "Dealer venceu!";
  gameResultEl.textContent = msg;
  hitBtn.disabled = standBtn.disabled = true;
}
function dealerPlay() {
  while (calcScore(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
}
function startGame() {
  deck = buildDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  gameResultEl.textContent = "";
  hitBtn.disabled = standBtn.disabled = false;
  renderHands();
}

// eventos do jogo
gameBtn.onclick       = () => gamePanel.classList.toggle("show");
closeGame.onclick     = () => gamePanel.classList.remove("show");
resetGameBtn.onclick  = startGame;
hitBtn.onclick        = () => { playerHand.push(deck.pop()); renderHands(); if (calcScore(playerHand)>21) endGame(); };
standBtn.onclick      = () => { dealerPlay(); renderHands(); endGame(); };
gameBtn.addEventListener("click", startGame);

// ────── Reativando botões da interface ──────
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");
logoutBtn.onclick      = () => {
  remove(userRef);
  localStorage.clear();
  window.location.href = "../index.html";
};
