import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ■ Captura global de erros
window.addEventListener('error', e => {
  console.error('Erro JS capturado:', e.error || e.message);
  alert(`Erro: ${e.message}`);
});

document.addEventListener('DOMContentLoaded', () => {
  // — Configuração do Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
    authDomain: "mmchat-f4f88.firebaseapp.com",
    databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
    projectId: "mmchat-f4f88",
    storageBucket: "mmchat-f4f88.appspot.com",
    messagingSenderId: "404598754438",
    appId: "1:404598754438:web:60892890d851507"
  };
  initializeApp(firebaseConfig);
  const db = getDatabase();

  // — Identidade do usuário
  const nickname = localStorage.getItem("nickname") || "Anônimo";
  let uid = localStorage.getItem("uid");
  if (!uid) {
    uid = "user_" + Math.random().toString(36).substr(2, 8);
    localStorage.setItem("uid", uid);
  }

  // — Presença
  const userRef = ref(db, `onlineUsers/${uid}`);
  set(userRef, nickname);
  window.addEventListener("beforeunload", () => remove(userRef));

  // — Referências DOM
  const mural             = document.getElementById("chat-mural");
  const input             = document.getElementById("mensagemInput");
  const enviarBtn         = document.getElementById("enviarBtn");
  const modeSelect        = document.getElementById("modeSelect");
  const mentionUserSelect = document.getElementById("mentionUserSelect");
  const imgBtn            = document.getElementById("imgBtn");
  const audioBtn          = document.getElementById("audioBtn");
  const uploadAudioBtn    = document.getElementById("uploadAudioBtn");
  const toggleScrollBtn   = document.getElementById("toggleScrollBtn");
  const usuariosBtn       = document.getElementById("usuariosBtn");
  const configBtn         = document.getElementById("configBtn");
  const logoutBtn         = document.getElementById("logoutBtn");
  const listaUsuarios     = document.getElementById("listaUsuarios");
  const painelUsuarios    = document.getElementById("usuariosOnline");
  const painelConfig      = document.getElementById("configPainel");
  const fecharUsuarios    = document.getElementById("fecharUsuarios");
  const fecharConfig      = document.getElementById("fecharConfig");
  const audioModal        = document.getElementById("audioModal");
  const recordBtn         = document.getElementById("recordBtn");
  const stopBtn           = document.getElementById("stopBtn");
  const playBtn           = document.getElementById("playBtn");
  const sendAudioBtn      = document.getElementById("sendAudioBtn");
  const cancelAudioBtn    = document.getElementById("cancelAudioBtn");

  // — Toggle painéis
  if (usuariosBtn && painelUsuarios) {
    usuariosBtn.onclick = () => painelUsuarios.classList.toggle("show");
  }
  if (fecharUsuarios && painelUsuarios) {
    fecharUsuarios.onclick = () => painelUsuarios.classList.remove("show");
  }
  if (configBtn && painelConfig) {
    configBtn.onclick = () => painelConfig.classList.toggle("show");
  }
  if (fecharConfig && painelConfig) {
    fecharConfig.onclick = () => painelConfig.classList.remove("show");
  }

  // — Mostrar select de Moita
  if (modeSelect && mentionUserSelect) {
    modeSelect.addEventListener("change", () => {
      mentionUserSelect.hidden = (modeSelect.value !== "moita");
    });
  }

  // — Popula usuários e Moita
  if (listaUsuarios && mentionUserSelect) {
    onValue(ref(db, "onlineUsers"), snap => {
      listaUsuarios.innerHTML = "";
      mentionUserSelect.innerHTML = '<option disabled selected>Selecione usuário</option>';
      const data = snap.val() || {};
      Object.entries(data).forEach(([key, name]) => {
        const li = document.createElement("li");
        li.textContent = name;
        if (key !== uid) {
          const btnM = document.createElement("button");
          btnM.textContent = "🌿";
          btnM.title = "Convidar para moita";
          btnM.onclick = () => push(ref(db, "pvSolicitacoes"), {
            deUid: uid, deNick: nickname,
            paraUid: key, paraNick: name,
            status: "pendente"
          });
          li.append(btnM);

          const btnB = document.createElement("button");
          btnB.textContent = "🚫";
          btnB.title = "Bloquear usuário";
          li.append(btnB);

          const opt = document.createElement("option");
          opt.value = key; opt.textContent = name;
          mentionUserSelect.append(opt);
        }
        listaUsuarios.append(li);
      });
    });
  }

  // — Recebe convites PV
  if (mural) {
    onChildAdded(ref(db, "pvSolicitacoes"), snap => {
      const s = snap.val();
      if (s.paraUid === uid && s.status === "pendente") {
        const div = document.createElement("div");
        div.className = "msg-pv";
        div.innerHTML = `
          <strong>@${s.deNick}</strong> quer moita.
          <button class="aceitarPV" data-id="${snap.key}">Aceitar</button>
          <button class="recusarPV" data-id="${snap.key}">Recusar</button>
        `;
        mural.append(div);
      }
    });

    document.addEventListener("click", e => {
      const key = e.target.dataset?.id;
      if (!key) return;
      if (e.target.classList.contains("aceitarPV")) {
        update(ref(db, `pvSolicitacoes/${key}`), { status: "aceito" });
      }
      if (e.target.classList.contains("recusarPV")) {
        update(ref(db, `pvSolicitacoes/${key}`), { status: "recusado" });
      }
    });
  }

  // — Enviar mensagem
  if (input && enviarBtn) {
    const enviarMensagem = () => {
      console.log("[Handler] enviarMensagem ▶ start");
      const texto = input.value.trim();
      if (!texto) return;
      const payload = { nick: nickname, uid, conteudo: texto, hora: Date.now() };
      if (modeSelect?.value === "moita") {
        const dest = mentionUserSelect?.value;
        if (!dest) { alert("Selecione usuário para moita."); return; }
        payload.tipo = "moita"; payload.privadoPara = dest;
      } else {
        payload.tipo = "texto";
      }
      push(ref(db, "mensagens"), payload);
      input.value = "";
      console.log("[Handler] enviarMensagem ◼ end");
    };

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") enviarMensagem();
    });
    enviarBtn.onclick = enviarMensagem;
  }

  // — Renderizar mensagens
  if (mural) {
    onChildAdded(ref(db, "mensagens"), snap => {
      console.log("[DB] onChildAdded ▶", snap.key, snap.val());
      const msg = snap.val();
      // filtro
      if (modeSelect?.value === "moita") {
        if (msg.tipo !== "moita") return;
        if (msg.uid !== uid && msg.privadoPara !== uid) return;
      } else {
        if (msg.tipo === "moita") return;
      }
      // monta
      const div = document.createElement("div");
      div.classList.add("msg-new");
      const span = document.createElement("span");
      span.style.fontWeight = "bold";
      span.textContent = `@${msg.nick}: `;
      div.append(span, document.createTextNode(msg.conteudo));
      mural.append(div);
      if (document.getElementById("rolagemAuto")?.checked) {
        mural.scrollTop = mural.scrollHeight;
      }
      console.log("[DB] onChildAdded ◼ render ok");
    });
  }

  // — Envio de imagem
  if (imgBtn) {
    imgBtn.onclick = () => {
      console.log("[Handler] imgBtn.onclick ▶ start");
      const fi = document.createElement("input");
      fi.type = "file"; fi.accept = "image/*";
      fi.onchange = () => {
        const r = new FileReader();
        r.onload = () => {
          push(ref(db, "mensagens"), {
            nick: nickname, uid,
            tipo: "img", conteudo: r.result, hora: Date.now()
          });
          console.log("[Handler] imgBtn.onclick ◼ end");
        };
        r.readAsDataURL(fi.files[0]);
      };
      fi.click();
    };
  }

  // — Modal de áudio
  if (audioBtn && audioModal && recordBtn && stopBtn && playBtn && sendAudioBtn && cancelAudioBtn) {
    let mediaRecorder, audioChunks, audioBlob, audioUrl;

    audioBtn.onclick = () => {
      console.log("[Handler] audioBtn.onclick ▶ start");
      audioModal.hidden = false; audioModal.classList.add("show");
      console.log("[Handler] áudio modal aberto");
      audioChunks = [];
      recordBtn.disabled = false;
      stopBtn.disabled = playBtn.disabled = sendAudioBtn.disabled = true;
    };

    recordBtn.onclick = () => {
      console.log("[Áudio] recordBtn.onclick disparado");
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log("[Áudio] mediaDevices.getUserMedia ok");
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
          mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            audioUrl  = URL.createObjectURL(audioBlob);
            playBtn.disabled = sendAudioBtn.disabled = false;
          };
          mediaRecorder.start();
          recordBtn.disabled = true; stopBtn.disabled = false;
        })
        .catch(err => {
          console.error("[Áudio] erro no getUserMedia:", err);
          alert("Não foi possível acessar microfone.");
        });
    };

    stopBtn.onclick = () => {
      console.log("[Áudio] stopBtn.onclick disparado");
      if (mediaRecorder) mediaRecorder.stop();
      stopBtn.disabled = true;
    };

    playBtn.onclick = () => {
      console.log("[Áudio] playBtn.onclick disparado");
      if (audioUrl) new Audio(audioUrl).play();
    };

    sendAudioBtn.onclick = () => {
      console.log("[Áudio] sendAudioBtn.onclick disparado");
      if (!audioBlob) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        push(ref(db, "mensagens"), {
          nick: nickname, uid,
          tipo: "audio", conteudo: reader.result, hora: Date.now()
        });
        audioModal.hidden = true; audioModal.classList.remove("show");
      };
      reader.readAsDataURL(audioBlob);
    };

    cancelAudioBtn.onclick = () => {
      console.log("[Áudio] cancelAudioBtn.onclick disparado");
      audioModal.hidden = true; audioModal.classList.remove("show");
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };

    audioModal.onclick = e => {
      if (e.target === audioModal) {
        console.log("[Áudio] audioModal.onclick fechar modal");
        cancelAudioBtn.onclick();
      }
    };
  }

  // — Upload áudio existente
  if (uploadAudioBtn) {
    uploadAudioBtn.onclick = () => {
      console.log("[Handler] uploadAudioBtn.onclick ▶ start");
      const fi = document.createElement("input");
      fi.type = "file"; fi.accept = "audio/*";
      fi.onchange = () => {
        const r = new FileReader();
        r.onload = () => push(ref(db, "mensagens"), {
          nick: nickname, uid,
          tipo: "audio", conteudo: r.result, hora: Date.now()
        });
        console.log("[Handler] uploadAudioBtn.onclick ◼ end");
        r.readAsDataURL(fi.files[0]);
      };
      fi.click();
    };
  }

  // — Alternar rolagem automática
  if (toggleScrollBtn) {
    toggleScrollBtn.onclick = () => {
      console.log("[Handler] toggleScrollBtn.onclick disparado");
      const chk = document.getElementById("rolagemAuto");
      if (chk) chk.checked = !chk.checked;
    };
  }

  // — Logout
  if (logoutBtn && userRef) {
    logoutBtn.onclick = () => {
      console.log("[Handler] logoutBtn.onclick disparado");
      remove(userRef);
      localStorage.clear();
      window.location.href = "index.html";
    };
  }
});
