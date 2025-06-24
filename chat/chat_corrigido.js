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
  appId: "1:404598754438:web:60892895591430d851507"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ————— Identidade do usuário —————
const nickname = localStorage.getItem("nickname") || prompt("Digite seu nickname:") || "Anônimo";
let   uid      = localStorage.getItem("uid");
if (!uid) {
  uid = "user_" + Math.random().toString(36).substring(2,10);
  localStorage.setItem("uid", uid);
}
// marca o início da sessão para filtrar histórico
const sessionStart = Date.now();

// ————— Referências ao DOM —————
const mural         = document.getElementById("chat-mural");
const input         = document.getElementById("mensagemInput");
const enviarBtn     = document.getElementById("enviarBtn");
const imgBtn        = document.getElementById("imgBtn");
const audioBtn      = document.getElementById("audioBtn");
const usuariosBtn   = document.getElementById("usuariosBtn");
const configBtn     = document.getElementById("configBtn");
const logoutBtn     = document.getElementById("logoutBtn");
const listaUsuarios = document.getElementById("listaUsuarios");
const painelUsuarios= document.getElementById("usuariosOnline");
const fecharUsuarios= document.getElementById("fecharUsuarios");
const painelConfig  = document.getElementById("configPainel");
const fecharConfig  = document.getElementById("fecharConfig");

// PV controls
const pvMode   = document.getElementById("pvMode");
const pvSelect = document.getElementById("pvSelect");

// ————— Presença online —————
const userRef = ref(db, `onlineUsers/${uid}`);
set(userRef, nickname);
window.addEventListener("beforeunload", () => remove(userRef));

// ————— Atualiza lista de usuários e dropdown PV —————
onValue(ref(db, "onlineUsers"), snap => {
  listaUsuarios.innerHTML = "";
  pvSelect.innerHTML   = '<option value="" disabled selected>Selecione usuário</option>';
  const data = snap.val() || {};
  Object.entries(data).forEach(([key, name]) => {
    // Lista lateral
    const li = document.createElement("li");
    li.textContent = name;
    listaUsuarios.appendChild(li);
    // Dropdown PV (exceto eu)
    if (key !== uid) {
      pvSelect.hidden = false;
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = name;
      pvSelect.appendChild(opt);
    }
  });
});

// ————— Envio de mensagens (Públicas ou PV) —————
function enviarMensagem() {
  const texto = input.value.trim();
  if (!texto) return;

  const base = {
    nick: nickname,
    uid,
    conteudo: texto,
    hora: Date.now()
  };

  if (pvMode.checked) {
    const destUid = pvSelect.value;
    if (!destUid) {
      alert("Selecione um usuário para Privado.");
      return;
    }
    // Mensagem PV
    push(ref(db, "mensagens"), {
      ...base,
      tipo: "pv",
      privadoPara: destUid
    });
  } else {
    // Mensagem Pública
    push(ref(db, "mensagens"), {
      ...base,
      tipo: "texto"
    });
  }

  input.value = "";
}
enviarBtn.onclick = enviarMensagem;
input.addEventListener("keydown", e => e.key==="Enter" && enviarMensagem());

// ————— Renderização de todas as mensagens —————
onChildAdded(ref(db, "mensagens"), snap => {
  const msg = snap.val();

  // 1) Filtrar histórico
  if (msg.hora < sessionStart) return;

  // 2) Filtrar por modo
  if (msg.tipo === "pv") {
    // se não estiver em PV, ignora
    if (!pvMode.checked) return;
    // só exibe se for entre eu ↔ destino selecionado
    const dest = pvSelect.value;
    if (!dest) return;
    const isSender   = msg.uid === uid   && msg.privadoPara === dest;
    const isReceiver = msg.privadoPara === uid && msg.uid === dest;
    if (! (isSender || isReceiver) ) return;
  } else {
    // mensagem pública: só mostra se PV desmarcado
    if (pvMode.checked) return;
  }

  // 3) Criar elemento
  const div = document.createElement("div");
  const span = document.createElement("span");
  span.style.fontWeight = "bold";

  if (msg.tipo === "pv") {
    span.textContent = `🔒 [PV] @${msg.nick}: `;
    div.className = msg.uid===uid ? "pv-out" : "pv-in";
  } else {
    span.textContent = `@${msg.nick}: `;
  }
  div.appendChild(span);

  // 4) Conteúdo
  if (msg.tipo === "texto" || msg.tipo === "pv") {
    div.appendChild(document.createTextNode(msg.conteudo));
  } else if (msg.tipo === "img") {
    const btn = document.createElement("button");
    btn.textContent = "Ver imagem";
    const img = document.createElement("img");
    img.src = msg.conteudo;
    img.style.maxWidth = "100%";
    img.style.display = "none";
    btn.onclick = () => {
      if (img.style.display==="none") {
        img.style.display="block";
        btn.textContent="Ocultar";
      } else {
        img.style.display="none";
        btn.textContent="Ver imagem";
      }
    };
    div.appendChild(btn);
    div.appendChild(img);
  } else if (msg.tipo === "audio") {
    const audio = document.createElement("audio");
    audio.src = msg.conteudo;
    audio.controls = true;
    div.appendChild(audio);
  }

  // 5) Anexa e rola
  mural.appendChild(div);
  mural.scrollTop = mural.scrollHeight;
});

// ————— Upload de imagem —————
imgBtn.onclick = () => {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      // reusa enviarMensagem para enviar imagem
      push(ref(db,"mensagens"), {
        nick: nickname,
        uid,
        tipo: (pvMode.checked?"pv":"texto"),
        conteudo: reader.result,
        hora: Date.now(),
        ...(pvMode.checked?{ privadoPara: pvSelect.value }:{})
      });
    };
    reader.readAsDataURL(inp.files[0]);
  };
  inp.click();
};

// ————— Gravação de áudio —————
audioBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = e=>chunks.push(e.data);
  rec.onstop = () => { 
    const blob = new Blob(chunks,{type:"audio/webm"});
    const reader = new FileReader();
    reader.onloadend = () => {
      push(ref(db,"mensagens"), {
        nick: nickname,
        uid,
        tipo: (pvMode.checked?"pv":"texto"),
        conteudo: reader.result,
        hora: Date.now(),
        ...(pvMode.checked?{ privadoPara: pvSelect.value }:{})
      });
    };
    reader.readAsDataURL(blob);
  };
  rec.start();
  setTimeout(()=>rec.stop(), 60000);
};

// ————— Botões de UI —————
usuariosBtn.onclick    = () => painelUsuarios.classList.toggle("show");
fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
configBtn.onclick      = () => painelConfig.classList.toggle("show");
fecharConfig.onclick   = () => painelConfig.classList.remove("show");
logoutBtn.onclick      = () => {
  remove(userRef);
  localStorage.clear();
  window.location.reload();
};

// ————— Alterna visibilidade do select ao mudar pvMode —————
pvMode.addEventListener("change", () => {
  pvSelect.hidden = !pvMode.checked;
  // limpa mural e re-renderiza apenas históricos novos
  mural.innerHTML = "";
});
