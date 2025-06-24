import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; import { getDatabase, ref, set, push, onChildAdded, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// — Configuração Firebase const firebaseConfig = { apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg", authDomain: "mmchat-f4f88.firebaseapp.com", databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com", projectId: "mmchat-f4f88", storageBucket: "mmchat-f4f88.appspot.com", messagingSenderId: "404598754438", appId: "1:404598754438:web:6a0892895591430d851507" }; const app = initializeApp(firebaseConfig); const db  = getDatabase(app);

// — Identidade do usuário const nickname = localStorage.getItem("nickname") || "Anônimo"; let uid = localStorage.getItem("uid"); if (!uid) { uid = "user_" + Math.random().toString(36).substring(2, 10); localStorage.setItem("uid", uid); }

// — Registro de presença const userRef = ref(db, onlineUsers/${uid}); set(userRef, nickname); window.addEventListener("beforeunload", () => remove(userRef));

// — Referências ao DOM const mural           = document.getElementById("chat-mural"); const input           = document.getElementById("mensagemInput"); const enviarBtn       = document.getElementById("enviarBtn"); const imgBtn          = document.getElementById("imgBtn"); const audioBtn        = document.getElementById("audioBtn"); const uploadAudioBtn  = document.getElementById("uploadAudioBtn"); const usuariosBtn     = document.getElementById("usuariosBtn"); const configBtn       = document.getElementById("configBtn"); const logoutBtn       = document.getElementById("logoutBtn"); const listaUsuarios   = document.getElementById("listaUsuarios"); const painelUsuarios  = document.getElementById("usuariosOnline"); const painelConfig    = document.getElementById("configPainel"); const fecharUsuarios  = document.getElementById("fecharUsuarios"); const fecharConfig    = document.getElementById("fecharConfig"); const playerContainer = document.getElementById("youtube-player-container"); const minimizePlayerBtn = document.getElementById("minimizePlayerBtn");

// — Toggle dropdowns de Usuários / Configurações usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show"); fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show"); configBtn.onclick      = () => painelConfig.classList.toggle("show"); fecharConfig.onclick   = () => painelConfig.classList.remove("show");

// — Enviar mensagem ao pressionar Enter input.addEventListener("keydown", e => { if (e.key === "Enter") enviarMensagem(); });

// — Função de envio de mensagem com YouTube function enviarMensagem() { const texto = input.value.trim(); if (!texto) return; // Detecta link do YouTube const ytMatch = texto.match(/https?://(?:www.)?(?:youtube.com\S*?v=|youtu.be/)([A-Za-z0-9_-]{11})/); if (ytMatch) { showYouTubePlayer(ytMatch[0]); } else { // texto normal push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "texto", conteudo: texto, hora: Date.now() }); } input.value = ""; } enviarBtn.onclick = enviarMensagem;

// — Exibir YouTube player function showYouTubePlayer(videoUrl) { const regExp = /(?:v=|youtu.be/)([A-Za-z0-9_-]{11})/; const match = videoUrl.match(regExp); const videoId = match ? match[1] : null; if (!videoId) return alert("URL do YouTube inválida!"); const iframe = document.getElementById("youtube-player"); iframe.src = https://www.youtube.com/embed/${videoId}?autoplay=1; playerContainer.classList.remove("minimized"); playerContainer.scrollIntoView({ behavior: "smooth" }); }

// — Minimizar / restaurar player para áudio-only minimizePlayerBtn.onclick = () => { playerContainer.classList.toggle("minimized"); };

// — Envio de imagem imgBtn.onclick = () => { const fileInput = document.createElement("input"); fileInput.type = "file"; fileInput.accept = "image/*"; fileInput.onchange = () => { const reader = new FileReader(); reader.onload = () => { push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "img", conteudo: reader.result, hora: Date.now() }); }; reader.readAsDataURL(fileInput.files[0]); }; fileInput.click(); };

// — Simplificação gravação de áudio inline audioBtn.onclick = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); const chunks = []; recorder.ondataavailable = e => chunks.push(e.data); recorder.start(); setTimeout(() => recorder.stop(), 60000); recorder.onstop = () => { const blob = new Blob(chunks, { type: "audio/webm" }); const reader = new FileReader(); reader.onloadend = () => { push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "audio", conteudo: reader.result, hora: Date.now() }); }; reader.readAsDataURL(blob); }; } catch (err) { alert("Não foi possível acessar o microfone."); } };

// — Upload de arquivo de áudio existente uploadAudioBtn.onclick = () => { const fileInput = document.createElement("input"); fileInput.type = "file"; fileInput.accept = "audio/*"; fileInput.onchange = () => { const reader = new FileReader(); reader.onload = () => { push(ref(db, "mensagens"), { nick: nickname, uid: uid, tipo: "audio", conteudo: reader.result, hora: Date.now() }); }; reader.readAsDataURL(fileInput.files[0]); }; fileInput.click(); };

// — Logout logoutBtn.onclick = () => { remove(userRef); localStorage.clear(); window.location.href = "../index.html"; };

// — Lista de usuários online onValue(ref(db, "onlineUsers"), snapshot => { listaUsuarios.innerHTML = ""; const data = snapshot.val() || {}; Object.entries(data).forEach(([key, name]) => { const li = document.createElement("li"); li.textContent = name; if (key !== uid) { li.style.cursor = "pointer"; li.onclick = () => solicitarPV(key, name); } listaUsuarios.appendChild(li); }); });

// — Solicitar chat privado (PV) function solicitarPV(destUid, destNick) { push(ref(db, "pvSolicitacoes"), { deUid: uid, deNick: nickname, paraUid: destUid, paraNick: destNick, status: "pendente" }); }

// — Receber/aceitar PV onChildAdded(ref(db, "pvSolicitacoes"), snap => { const s = snap.val(); if (s.paraUid === uid && s.status === "pendente") { const div = document.createElement("div"); div.className = "msg-pv"; div.innerHTML = <strong>@${s.deNick}</strong> deseja conversar reservadamente. <button class="aceitarPV" data-id="${snap.key}">Aceitar</button> <button class="recusarPV" data-id="${snap.key}">Recusar</button>; mural.appendChild(div); } });

document.addEventListener("click", e => { const key = e.target.dataset.id; if (e.target.classList.contains("aceitarPV")) { update(ref(db, pvSolicitacoes/${key}), { status: "aceito" }); } if (e.target.classList.contains("recusarPV")) { update(ref(db, pvSolicitacoes/${key}), { status: "recusado" }); } });

// — Renderizar mensagens no mural onChildAdded(ref(db, "mensagens"), snap => { const msg = snap.val(); const div = document.createElement("div"); div.classList.add("msg-new"); const html = msg.conteudo.replace( /@([A-Za-z0-9_]+)/g, <span class="mention">@$1</span> ); div.innerHTML = <strong>@${msg.nick}:</strong> ${html}; mural.appendChild(div); mural.scrollTop = mural.scrollHeight; });

