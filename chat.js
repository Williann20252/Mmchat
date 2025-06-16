// chat.js - Funções completas do MMChat

// Inicializa o Firebase (garanta que firebase.js já fez isso) import { getDatabase, ref, push, onChildAdded, remove, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"; import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getDatabase(); const auth = getAuth(); const chatRef = ref(db, "mensagens"); const usuariosRef = ref(db, "usuarios");

let uid = localStorage.getItem("uid"); let nick = "Anônimo" + Math.floor(Math.random() * 1000); let premium = false;

const chatBox = document.getElementById("chat"); const mensagemInput = document.getElementById("mensagem"); const enviarBtn = document.getElementById("enviar"); const sairBtn = document.getElementById("sair"); const usuariosBtn = document.getElementById("usuarios-btn"); const usuariosLista = document.getElementById("usuarios-lista"); const usuariosUL = document.getElementById("usuarios"); const aplicarEstilo = document.getElementById("aplicarEstilo");

function enviarMensagem(texto, tipo = "texto") { const dados = { uid, nick, texto, tipo, hora: Date.now(), premium, estilo: premium ? { fonte: document.documentElement.style.getPropertyValue('--fonte') || 'Segoe UI', cor: document.documentElement.style.getPropertyValue('--cor') || '#000' } : {} }; push(chatRef, dados); }

mensagemInput.addEventListener("keypress", e => { if (e.key === "Enter") enviarMensagem(mensagemInput.value); });

enviarBtn.onclick = () => { if (mensagemInput.value.trim()) { enviarMensagem(mensagemInput.value); mensagemInput.value = ""; } };

onChildAdded(chatRef, (data) => { const msg = data.val(); const div = document.createElement("div"); div.classList.add("mensagem"); div.classList.add(msg.uid === uid ? "enviada" : "recebida");

let nickTag = msg.premium ? <span class="nick-premium">@${msg.nick}</span> : @${msg.nick};

div.setAttribute("data-fonte", ""); div.setAttribute("data-cor", "");

if (msg.estilo) { div.style.setProperty("--fonte", msg.estilo.fonte); div.style.setProperty("--cor", msg.estilo.cor); }

div.innerHTML = <strong>${nickTag}</strong><br>;

if (msg.tipo === "texto") { div.innerHTML += <span>${msg.texto}</span>; } else if (msg.tipo === "imagem") { div.innerHTML += <img src="${msg.texto}" style="max-width:100%; border-radius:8px; margin-top:4px;" />; } else if (msg.tipo === "audio") { div.innerHTML += <audio controls src="${msg.texto}" style="margin-top:4px;"></audio>; }

chatBox.appendChild(div); chatBox.scrollTop = chatBox.scrollHeight; });

sairBtn.onclick = () => { localStorage.removeItem("uid"); location.href = "index.html"; };

usuariosBtn.onclick = () => { usuariosLista.classList.toggle("hidden"); };

aplicarEstilo.onclick = () => { const fonte = document.getElementById("fonteSelect").value; const cor = document.getElementById("corSelect").value; document.documentElement.style.setProperty('--fonte', fonte); document.documentElement.style.setProperty('--cor', cor); };

// Upload imagem const imgInput = document.getElementById("imagem"); imgInput.onchange = (e) => { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = () => enviarMensagem(reader.result, "imagem"); if (file) reader.readAsDataURL(file); };

// Gravação de áudio let mediaRecorder; let audioChunks = []; const gravarBtn = document.getElementById("gravar");

gravarBtn.onclick = async () => { if (!mediaRecorder || mediaRecorder.state === "inactive") { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder = new MediaRecorder(stream); mediaRecorder.start(); gravarBtn.textContent = "⏹️"; audioChunks = []; mediaRecorder.ondataavailable = e => audioChunks.push(e.data); mediaRecorder.onstop = () => { const blob = new Blob(audioChunks, { type: 'audio/webm' }); const reader = new FileReader(); reader.onload = () => enviarMensagem(reader.result, "audio"); reader.readAsDataURL(blob); }; } else { mediaRecorder.stop(); gravarBtn.textContent = "🎤"; } };

// Autenticação onAuthStateChanged(auth, (user) => { if (user) { uid = user.uid; nick = user.email.split("@")[0]; premium = user.email.includes("premium"); set(ref(db, usuarios/${uid}), { nick, premium }); } });

// Atualizar usuários online onChildAdded(usuariosRef, (snap) => { const user = snap.val(); const li = document.createElement("li"); li.textContent = user.premium ? ⭐ ${user.nick} : user.nick; usuariosUL.appendChild(li); });

