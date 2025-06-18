document.addEventListener("DOMContentLoaded", () => {
  // 🔧 Firebase config com suas credenciais
  const firebaseConfig = {
    apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg",
    authDomain: "mmchat-f4f88.firebaseapp.com",
    databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com",
    projectId: "mmchat-f4f88",
    storageBucket: "mmchat-f4f88.appspot.com",
    messagingSenderId: "404598754438",
    appId: "1:404598754438:web:6a0892895591430d851507"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // 🔐 Identificação
  let nickname = localStorage.getItem("nickname") || "Anônimo";
  let userType = localStorage.getItem("userType") || "anonimo";
  let uid = localStorage.getItem("uid");
  if (!uid) {
    uid = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("uid", uid);
  }

  // DOM
  const mural = document.getElementById("chat-mural");
  const input = document.getElementById("mensagemInput");
  const enviarBtn = document.getElementById("enviarBtn");
  const usuariosBtn = document.getElementById("usuariosBtn");
  const configBtn = document.getElementById("configBtn");
  const configPainel = document.getElementById("configPainel");
  const listaUsuarios = document.getElementById("listaUsuarios");
  const logoutBtn = document.getElementById("logoutBtn");
  const imgBtn = document.getElementById("imgBtn");
  const audioBtn = document.getElementById("audioBtn");

  // ✅ Marcar online
  const userRef = db.ref("onlineUsers/" + uid);
  userRef.set(nickname);
  userRef.onDisconnect().remove();

  // 🔄 Atualizar lista online
  db.ref("onlineUsers").on("value", (snapshot) => {
    listaUsuarios.innerHTML = "";
    const data = snapshot.val() || {};
    Object.values(data).forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      listaUsuarios.appendChild(li);
    });
  });

  // ▶️ Enviar mensagem
  enviarBtn.addEventListener("click", () => {
    const texto = input.value.trim();
    if (!texto) return;
    db.ref("mensagens").push({
      nick: nickname,
      uid: uid,
      tipo: "texto",
      conteudo: texto,
      hora: Date.now()
    });
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarBtn.click();
  });

  // ▶️ Escutar mensagens
  db.ref("mensagens").on("child_added", (snapshot) => {
    const msg = snapshot.val();
    const div = document.createElement("div");

    const nickSpan = document.createElement("span");
    nickSpan.textContent = `@${msg.nick}: `;
    nickSpan.style.fontWeight = "bold";
    nickSpan.style.color = msg.uid === uid ? "#00ffff" : "#ff00ff";
    div.appendChild(nickSpan);

    if (msg.tipo === "texto") {
      div.innerHTML += msg.conteudo;
    } else if (msg.tipo === "img") {
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "Ver imagem";
      toggleBtn.style.marginLeft = "10px";

      const img = document.createElement("img");
      img.src = msg.conteudo;
      img.style.maxWidth = "100%";
      img.style.display = "none";

      toggleBtn.onclick = () => {
        const visible = img.style.display === "block";
        img.style.display = visible ? "none" : "block";
        toggleBtn.textContent = visible ? "Ver imagem" : "Ocultar";
      };

      div.appendChild(toggleBtn);
      div.appendChild(img);
    } else if (msg.tipo === "audio") {
      const audio = document.createElement("audio");
      audio.src = msg.conteudo;
      audio.controls = true;
      div.appendChild(audio);
    }

    mural.appendChild(div);
    if (document.getElementById("rolagemAuto")?.checked ?? true) {
      mural.scrollTop = mural.scrollHeight;
    }
  });

  // 📷 Enviar imagem
  imgBtn.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        db.ref("mensagens").push({
          nick: nickname,
          uid: uid,
          tipo: "img",
          conteudo: reader.result,
          hora: Date.now()
        });
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  });

  // 🎤 Gravar áudio até 60s
  audioBtn.addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        db.ref("mensagens").push({
          nick: nickname,
          uid: uid,
          tipo: "audio",
          conteudo: reader.result,
          hora: Date.now()
        });
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 60000);
    alert("🎙️ Gravando... será enviado automaticamente após 60s.");
  });

  // ⚙️ Alternar painel de configurações
  configBtn.addEventListener("click", () => {
    configPainel.classList.toggle("show");
  });

  // 🚪 Sair
  logoutBtn.addEventListener("click", () => {
    db.ref("onlineUsers/" + uid).remove();
    localStorage.clear();
    window.location.href = "index.html";
  });
});
