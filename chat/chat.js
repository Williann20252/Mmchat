// chat.js completo com janelas flutuantes e Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; import { getDatabase, ref, set, push, onChildAdded, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg", authDomain: "mmchat-f4f88.firebaseapp.com", databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com", projectId: "mmchat-f4f88", storageBucket: "mmchat-f4f88.appspot.com", messagingSenderId: "404598754438", appId: "1:404598754438:web:6a0892895591430d851507" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app);

// Identificação do usuário let nickname = localStorage.getItem("nickname") || "Anônimo"; let uid = localStorage.getItem("uid"); if (!uid) { uid = "user_" + Math.random().toString(36).substring(2, 10); localStorage.setItem("uid", uid); }

// DOM Elements const mural = document.getElementById("chat-mural"); const input = document.getElementById("mensagemInput"); const enviarBtn = document.getElementById("enviarBtn"); const imgBtn = document.getElementById("imgBtn"); const audioBtn = document.getElementById("audioBtn"); const usuariosBtn = document.getElementById("usuariosBtn"); const configBtn = document.getElementById("configBtn"); const logoutBtn = document.getElementById("logoutBtn"); const listaUsuarios = document.getElementById("listaUsuarios"); const configPainel = document.getElementById("configPainel"); const usuariosOnline = document.getElementById("usuariosOnline"); const fecharUsuarios = document.getElementById("fecharUsuarios");

// Painel Configurações const corFonte = document.getElementById("corFonte"); const corNick = document.getElementById("corNick"); const rolagemAuto = document.getElementById("rolagemAuto"); const gradienteNick = document.getElementById("gradienteNick");

// Marcar online const userRef = ref(db, "onlineUsers/" + uid); set(userRef, nickname); window.addEventListener("beforeunload", () => remove(userRef));

// Atualizar lista de usuários online onValue(ref(db, "onlineUsers"), (snap) => { listaUsuarios.innerHTML = ""; const data = snap.val() || {}; Object.entries(data).forEach(([id, nome]) => { const li = document.createElement("li"); li.textContent = nome; listaUsuarios.appendChild(li); }); });

// Funções básicas function enviarMensagem() { const texto = input.value.trim(); if (!texto) return; push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "texto", conteudo: texto, hora: Date.now() }); input.value = ""; } enviarBtn.onclick = enviarMensagem; input.addEventListener("keydown", (e) => { if (e.key === "Enter") enviarMensagem(); });

// Receber mensagens onChildAdded(ref(db, "mensagens"), (snap) => { const msg = snap.val(); const div = document.createElement("div"); const span = document.createElement("span"); span.textContent = @${msg.nick}: ; span.style.fontWeight = "bold"; span.style.color = msg.uid === uid ? "#00ffff" : "#ff00ff"; if (gradienteNick.checked) span.style.background = "linear-gradient(to right, #30cfd0, #330867)"; if (corNick.value) span.style.color = corNick.value;

div.appendChild(span); div.style.color = corFonte.value || "#333";

if (msg.tipo === "texto") { div.innerHTML += msg.conteudo; } else if (msg.tipo === "img") { const btn = document.createElement("button"); btn.textContent = "Ver imagem"; const img = document.createElement("img"); img.src = msg.conteudo; img.style.maxWidth = "100%"; img.style.display = "none"; btn.onclick = () => { img.style.display = img.style.display === "none" ? "block" : "none"; btn.textContent = img.style.display === "none" ? "Ver imagem" : "Ocultar imagem"; }; div.appendChild(btn); div.appendChild(img); } else if (msg.tipo === "audio") { const audio = document.createElement("audio"); audio.src = msg.conteudo; audio.controls = true; div.appendChild(audio); }

mural.appendChild(div); if (rolagemAuto.checked) mural.scrollTop = mural.scrollHeight; });

// Enviar imagem imgBtn.onclick = () => { const inputImg = document.createElement("input"); inputImg.type = "file"; inputImg.accept = "image/*"; inputImg.onchange = () => { const file = inputImg.files[0]; const reader = new FileReader(); reader.onload = () => { push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "img", conteudo: reader.result, hora: Date.now() }); }; reader.readAsDataURL(file); }; inputImg.click(); };

// Enviar áudio audioBtn.onclick = async () => { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); const chunks = []; recorder.ondataavailable = (e) => chunks.push(e.data); recorder.onstop = () => { const blob = new Blob(chunks, { type: "audio/webm" }); const reader = new FileReader(); reader.onloadend = () => { push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "audio", conteudo: reader.result, hora: Date.now() }); }; reader.readAsDataURL(blob); }; recorder.start(); setTimeout(() => recorder.stop(), 60000); alert("Gravando... será enviado após 60s"); };

// Abrir e fechar painéis usuariosBtn.onclick = () => usuariosOnline.classList.toggle("show"); configBtn.onclick = () => configPainel.classList.toggle("show"); fecharUsuarios.onclick = () => usuariosOnline.classList.remove("show");

// Logout logoutBtn.onclick = () => { remove(userRef); localStorage.clear(); location.href = "index.html"; };

