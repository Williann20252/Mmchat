// chat.js COMPLETO com // chat.js

const mural = document.getElementById("chat-mural"); const input = document.getElementById("mensagemInput"); const enviarBtn = document.getElementById("enviarBtn"); const logoutBtn = document.getElementById("logoutBtn"); const usuariosBtn = document.getElementById("usuariosBtn"); const usuariosOnline = document.getElementById("usuariosOnline"); const listaUsuarios = document.getElementById("listaUsuarios"); const configBtn = document.getElementById("configBtn"); const painelConfiguracoes = document.getElementById("painelConfiguracoes"); const fecharConfig = document.getElementById("fecharConfig");

// Configurações do usuário let corFonte = "#000000"; let corNick = "#000000"; let estiloFonte = "normal"; let usarGradiente = false; let rolagemAutomatica = true;

// Apelido do usuário const nickname = localStorage.getItem("nickname") || "Usuário"; const userType = localStorage.getItem("userType") || "anonimo";

// Enviar mensagem function enviarMensagem() { const texto = input.value.trim(); if (!texto) return;

const msg = document.createElement("div"); msg.classList.add("mensagem"); msg.innerHTML = <strong style="color: ${corNick}; font-weight: bold; font-style: ${estiloFonte}; ${usarGradiente && userType === 'premium' ? 'background: linear-gradient(to right, #00f, #f0f); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' : ''}">@${nickname}:</strong> <span style="color: ${corFonte}; font-style: ${estiloFonte};">${texto}</span>; mural.appendChild(msg);

input.value = ""; if (rolagemAutomatica) mural.scrollTop = mural.scrollHeight; }

enviarBtn.addEventListener("click", enviarMensagem); input.addEventListener("keypress", e => { if (e.key === "Enter") enviarMensagem(); });

logoutBtn.addEventListener("click", () => { localStorage.clear(); window.location.href = "../index.html"; });

usuariosBtn.addEventListener("click", () => { usuariosOnline.classList.toggle("hidden"); });

// Simular lista de usuários online const usuarios = ["@Maria", "@João", "@Ana"]; usuarios.forEach(user => { const li = document.createElement("li"); li.textContent = user; listaUsuarios.appendChild(li); });

// Menu de configurações configBtn.addEventListener("click", () => { painelConfiguracoes.classList.toggle("hidden"); });

fecharConfig.addEventListener("click", () => { painelConfiguracoes.classList.add("hidden"); });

document.getElementById("corFonte").addEventListener("input", e => { corFonte = e.target.value; });

document.getElementById("corNick").addEventListener("input", e => { corNick = e.target.value; });

document.getElementById("estiloFonte").addEventListener("change", e => { estiloFonte = e.target.value; });

document.getElementById("gradienteCheck").addEventListener("change", e => { usarGradiente = e.target.checked; });

document.getElementById("rolagemAuto").addEventListener("change", e => { rolagemAutomatica = e.target.checked; });

 de nick

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

