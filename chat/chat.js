// chat.js COMPLETO com reconhecimento de nick

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; import { getDatabase, ref, push, onChildAdded, remove, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg", authDomain: "mmchat-f4f88.firebaseapp.com", databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com", projectId: "mmchat-f4f88", storageBucket: "mmchat-f4f88.appspot.com", messagingSenderId: "404598754438", appId: "1:404598754438:web:6a0892895591430d851507" };

const app = initializeApp(firebaseConfig); const database = getDatabase(app);

const nickname = localStorage.getItem("nickname") || "Anônimo"; const mural = document.getElementById("mural"); const inputMensagem = document.getElementById("mensagem"); const botaoEnviar = document.getElementById("enviar");

function enviarMensagem() { const texto = inputMensagem.value.trim(); if (texto) { const novaMsg = { nick: nickname, texto: texto, timestamp: Date.now() }; push(ref(database, "mensagens"), novaMsg); inputMensagem.value = ""; } }

botaoEnviar.addEventListener("click", enviarMensagem); inputMensagem.addEventListener("keypress", function(e) { if (e.key === "Enter") enviarMensagem(); });

onChildAdded(ref(database, "mensagens"), (data) => { const msg = data.val(); const div = document.createElement("div"); div.classList.add("mensagem"); const remetente = msg.nick === nickname ? @${nickname} : @${msg.nick}; div.innerHTML = <strong>${remetente}:</strong> ${msg.texto}; mural.appendChild(div); mural.scrollTop = mural.scrollHeight; });

// Botão sair const botaoSair = document.getElementById("sair"); if (botaoSair) { botaoSair.addEventListener("click", () => { localStorage.clear(); window.location.href = "../index.html"; }); }

// Exemplo de listeners para botões de imagem e áudio (personalize conforme necessário) const botaoImagem = document.getElementById("imagem"); const botaoAudio = document.getElementById("audio");

if (botaoImagem) botaoImagem.addEventListener("click", () => alert("Função de imagem em desenvolvimento")); if (botaoAudio) botaoAudio.addEventListener("click", () => alert("Função de áudio em desenvolvimento"));

