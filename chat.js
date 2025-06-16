// chat.js import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; import { getDatabase, ref, push, onChildAdded, remove, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"; import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = { apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg", authDomain: "mmchat-f4f88.firebaseapp.com", databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com", projectId: "mmchat-f4f88", storageBucket: "mmchat-f4f88.appspot.com", messagingSenderId: "404598754438", appId: "1:404598754438:web:6a0892895591430d851507" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app); const auth = getAuth(app);

const mural = document.getElementById("mural"); const btnSair = document.getElementById("btnSair"); const inputMensagem = document.getElementById("mensagem"); const btnEnviar = document.getElementById("btnEnviar"); const usuariosPainel = document.getElementById("usuariosPainel");

let nick = localStorage.getItem("nick") || prompt("Digite seu nick:"); localStorage.setItem("nick", nick);

function renderMensagem(msgData) { const msgDiv = document.createElement("div"); msgDiv.classList.add("mensagem"); msgDiv.classList.add(msgData.nick === nick ? "enviada" : "recebida"); msgDiv.innerHTML = <strong class="${msgData.premium ? 'nick-premium' : ''}">@${msgData.nick}</strong>: ${msgData.texto}; mural.appendChild(msgDiv); mural.scrollTop = mural.scrollHeight; }

function enviarMensagem() { const texto = inputMensagem.value.trim(); if (texto !== "") { const novaMsg = { nick: nick, texto: texto, timestamp: Date.now(), premium: localStorage.getItem("premium") === "true" }; push(ref(db, "mensagens"), novaMsg); inputMensagem.value = ""; } }

function listarMensagens() { onChildAdded(ref(db, "mensagens"), (snapshot) => { const msgData = snapshot.val(); renderMensagem(msgData); }); }

function registrarUsuarioOnline(uid) { const userRef = ref(db, usuarios/${uid}); set(userRef, { nick: nick, premium: localStorage.getItem("premium") === "true" }); }

function listarUsuariosOnline() { onChildAdded(ref(db, "usuarios"), (snap) => { const data = snap.val(); const userDiv = document.createElement("div"); userDiv.innerHTML = <span class="${data.premium ? 'nick-premium' : ''}">@${data.nick}</span>; usuariosPainel.appendChild(userDiv); }); }

btnEnviar.addEventListener("click", enviarMensagem); inputMensagem.addEventListener("keydown", (e) => { if (e.key === "Enter") enviarMensagem(); });

btnSair.addEventListener("click", () => { signOut(auth).then(() => { localStorage.clear(); window.location.href = "index.html"; }); });

onAuthStateChanged(auth, (user) => { if (user) { localStorage.setItem("uid", user.uid); registrarUsuarioOnline(user.uid); listarMensagens(); listarUsuariosOnline(); } else { alert("Você precisa estar autenticado."); window.location.href = "index.html"; } });

