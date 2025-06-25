import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, push, onChildAdded, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

window.addEventListener('error', e => {
  alert(`Erro: ${e.message}`);
});

document.addEventListener('DOMContentLoaded', () => {
  const config = {
    apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
    authDomain: "mmchat-f4f88.firebaseapp.com",
    databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
    projectId: "mmchat-f4f88",
    storageBucket: "mmchat-f4f88.appspot.com",
    messagingSenderId: "404598754438",
    appId: "1:404598754438:web:60892890d851507"
  };
  initializeApp(config);
  const db = getDatabase();

  const uid = localStorage.getItem("uid") || (() => {
    const novo = "user_" + Math.random().toString(36).substr(2, 8);
    localStorage.setItem("uid", novo);
    return novo;
  })();
  const nickname = localStorage.getItem("nickname") || "Anônimo";

  const userRef = ref(db, `onlineUsers/${uid}`);
  set(userRef, nickname);
  window.addEventListener("beforeunload", () => remove(userRef));

  const $ = id => document.getElementById(id);
  const mural = $("chat-mural");

  $("usuariosBtn").onclick = () => $("usuariosOnline").classList.add("show");
  $("fecharUsuarios").onclick = () => $("usuariosOnline").classList.remove("show");
  $("configBtn").onclick = () => $("configPainel").classList.add("show");
  $("fecharConfig").onclick = () => $("configPainel").classList.remove("show");

  $("modeSelect").onchange = () => {
    $("mentionUserSelect").hidden = $("modeSelect").value !== "moita";
  };

  onValue(ref(db, "onlineUsers"), snap => {
    $("listaUsuarios").innerHTML = "";
    $("mentionUserSelect").innerHTML = '<option disabled selected>Selecione usuário</option>';
    const data = snap.val() || {};
    Object.entries(data).forEach(([key, name]) => {
      const li = document.createElement("li");
      li.textContent = name;
      if (key !== uid) {
        const btnM = document.createElement("button");
        btnM.textContent = "🌿";
        btnM.onclick = () => push(ref(db, "pvSolicitacoes"), {
          deUid: uid, deNick: nickname,
          paraUid: key, paraNick: name,
          status: "pendente"
        });
        li.append(btnM);

        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = name;
        $("mentionUserSelect").append(opt);
      }
      $("listaUsuarios").append(li);
    });
  });

  onChildAdded(ref(db, "pvSolicitacoes"), snap => {
    const s = snap.val();
    if (s.paraUid === uid && s.status === "pendente") {
      const div = document.createElement("div");
      div.className = "msg-pv";
      div.innerHTML = `<strong>@${s.deNick}</strong> quer moita.
        <button class="aceitarPV" data-id="${snap.key}">Aceitar</button>
        <button class="recusarPV" data-id="${snap.key}">Recusar</button>`;
      mural.append(div);
    }
  });

  document.addEventListener("click", e => {
    const id = e.target.dataset?.id;
    if (!id) return;
    if (e.target.classList.contains("aceitarPV"))
      update(ref(db, `pvSolicitacoes/${id}`), { status: "aceito" });
    if (e.target.classList.contains("recusarPV"))
      update(ref(db, `pvSolicitacoes/${id}`), { status: "recusado" });
  });

  function enviarMensagem() {
    const txt = $("mensagemInput").value.trim();
    if (!txt) return;
    const payload = { nick: nickname, uid, conteudo: txt, hora: Date.now() };
    if ($("modeSelect").value === "moita") {
      const dest = $("mentionUserSelect").value;
      if (!dest) return alert("Selecione um usuário");
      payload.tipo = "moita"; payload.privadoPara = dest;
    } else {
      payload.tipo = "texto";
    }
    push(ref(db, "mensagens"), payload);
    $("mensagemInput").value = "";
  }

  $("enviarBtn").onclick = enviarMensagem;
  $("mensagemInput").onkeydown = e => e.key === "Enter" && enviarMensagem();

  onChildAdded(ref(db, "mensagens"), snap => {
    const msg = snap.val();
    if ($("modeSelect").value === "moita") {
      if (msg.tipo !== "moita" || (msg.uid !== uid && msg.privadoPara !== uid)) return;
    } else if (msg.tipo === "moita") return;
    const div = document.createElement("div");
    div.className = "msg-new";
    const span = document.createElement("span");
    span.style.fontWeight = "bold";
    span.textContent = `@${msg.nick}: `;
    div.append(span, document.createTextNode(msg.conteudo));
    mural.append(div);
    if ($("rolagemAuto")?.checked) mural.scrollTop = mural.scrollHeight;
  });

  $("imgBtn").onclick = () => {
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "image/*";
    fi.onchange = () => {
      const r = new FileReader();
      r.onload = () => push(ref(db, "mensagens"), {
        nick: nickname, uid, tipo: "img", conteudo: r.result, hora: Date.now()
      });
      r.readAsDataURL(fi.files[0]);
    };
    fi.click();
  };

  let mediaRecorder, audioChunks = [], audioBlob, audioUrl;

  $("audioBtn").onclick = () => {
    $("audioModal").hidden = false;
    $("audioModal").classList.add("show");
    $("recordBtn").disabled = false;
    $("stopBtn").disabled = true;
    $("playBtn").disabled = true;
    $("sendAudioBtn").disabled = true;
  };

  $("recordBtn").onclick = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        audioUrl = URL.createObjectURL(audioBlob);
        $("playBtn").disabled = false;
        $("sendAudioBtn").disabled = false;
      };
      mediaRecorder.start();
      $("recordBtn").disabled = true;
      $("stopBtn").disabled = false;
    }).catch(() => alert("Não foi possível acessar o microfone"));
  };

  $("stopBtn").onclick = () => {
    if (mediaRecorder) mediaRecorder.stop();
    $("stopBtn").disabled = true;
  };

  $("playBtn").onclick = () => {
    if (audioUrl) new Audio(audioUrl).play();
  };

  $("sendAudioBtn").onclick = () => {
    const r = new FileReader();
    r.onloadend = () => {
      push(ref(db, "mensagens"), {
        nick: nickname, uid, tipo: "audio", conteudo: r.result, hora: Date.now()
      });
      $("audioModal").hidden = true;
      $("audioModal").classList.remove("show");
    };
    r.readAsDataURL(audioBlob);
  };

  $("cancelAudioBtn").onclick = () => {
    $("audioModal").hidden = true;
    $("audioModal").classList.remove("show");
    if (mediaRecorder?.state !== "inactive") mediaRecorder.stop();
  };

  $("audioModal").onclick = e => {
    if (e.target.id === "audioModal") $("cancelAudioBtn").click();
  };

  $("uploadAudioBtn").onclick = () => {
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "audio/*";
    fi.onchange = () => {
      const r = new FileReader();
      r.onload = () => push(ref(db, "mensagens"), {
        nick: nickname, uid, tipo: "audio", conteudo: r.result, hora: Date.now()
      });
      r.readAsDataURL(fi.files[0]);
    };
    fi.click();
  };

  $("toggleScrollBtn").onclick = () => {
    const chk = $("rolagemAuto");
    if (chk) chk.checked = !chk.checked;
  };

  $("logoutBtn").onclick = () => {
    remove(userRef);
    localStorage.clear();
    window.location.href = "index.html";
  };
});
