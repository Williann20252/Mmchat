document.addEventListener("DOMContentLoaded", () => {
  const mural = document.getElementById("chat-mural");
  const input = document.getElementById("mensagemInput");
  const enviarBtn = document.getElementById("enviarBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const usuariosBtn = document.getElementById("usuariosBtn");
  const sidebar = document.getElementById("usuariosOnline");
  const imgBtn = document.getElementById("imgBtn");
  const audioBtn = document.getElementById("audioBtn");
  const configBtn = document.getElementById("configBtn");
  const configMenu = document.getElementById("configuracoesUsuario");

  const nickname = localStorage.getItem("nickname") || "Anônimo";
  const userType = localStorage.getItem("userType") || "anonimo";
  let autoScroll = true;
  let nickColor = localStorage.getItem("nickColor") || "#00ffff";
  let fontColor = localStorage.getItem("fontColor") || "#000000";
  let font = localStorage.getItem("font") || "Inter";
  let gradienteAtivo = localStorage.getItem("gradiente") === "true";

  let mediaRecorder;
  let audioChunks = [];

  // Evento: enviar texto
  enviarBtn.addEventListener("click", enviarMensagem);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });

  // Evento: logout
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });

  // Alternar painel de usuários
  usuariosBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });

  // Alternar painel de configurações
  configBtn?.addEventListener("click", () => {
    configMenu?.classList.toggle("hidden");
  });

  // Gravação de áudio
  audioBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      audioBtn.textContent = "🎤";
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(audioBlob);
          const container = criarMensagemVisual();
          const audio = document.createElement("audio");
          audio.controls = true;
          audio.src = audioUrl;
          container.appendChild(audio);
          mural.appendChild(container);
          scrollar();
        };
        mediaRecorder.start();
        audioBtn.textContent = "⏹️ Gravando...";
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            audioBtn.textContent = "🎤";
          }
        }, 60000); // até 60 segundos
      });
    }
  });

  // Imagem com botão ver/ocultar
  imgBtn.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const container = criarMensagemVisual();
        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "Ver imagem";
        toggleBtn.style.marginTop = "5px";
        toggleBtn.style.padding = "4px 8px";
        toggleBtn.style.fontSize = "0.8rem";
        toggleBtn.style.cursor = "pointer";
        toggleBtn.style.borderRadius = "5px";
        toggleBtn.style.background = "#4da8da";
        toggleBtn.style.color = "#fff";
        toggleBtn.style.border = "none";

        const img = document.createElement("img");
        img.src = reader.result;
        img.alt = "imagem enviada";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginTop = "8px";
        img.style.display = "none";

        toggleBtn.addEventListener("click", () => {
          img.style.display = img.style.display === "none" ? "block" : "none";
          toggleBtn.textContent = img.style.display === "none" ? "Ver imagem" : "Ocultar imagem";
        });

        container.appendChild(toggleBtn);
        container.appendChild(img);
        mural.appendChild(container);
        scrollar();
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  });

  // Criar visual da mensagem com estilos
  function criarMensagemVisual() {
    const div = document.createElement("div");
    div.style.marginBottom = "0.8rem";
    div.style.fontFamily = font;
    div.style.color = fontColor;

    const nickSpan = document.createElement("span");
    nickSpan.textContent = `@${nickname}: `;
    nickSpan.style.fontWeight = "bold";
    nickSpan.style.color = nickColor;

    if (userType === "premium" && gradienteAtivo) {
      nickSpan.style.backgroundImage = "linear-gradient(to right, #00ffff, #ff00ff)";
      nickSpan.style.webkitBackgroundClip = "text";
      nickSpan.style.color = "transparent";
    }

    div.appendChild(nickSpan);
    return div;
  }

  function enviarMensagem() {
    const msg = input.value.trim();
    if (!msg) return;
    const div = criarMensagemVisual();
    div.textContent += msg;
    mural.appendChild(div);
    input.value = "";
    scrollar();
  }

  function scrollar() {
    if (autoScroll) {
      mural.scrollTop = mural.scrollHeight;
    }
  }

  // CONFIGURAÇÕES DO USUÁRIO
  const corNickInput = document.getElementById("nickColor");
  const fontColorInput = document.getElementById("fontColor");
  const fonteSelect = document.getElementById("fonteSelect");
  const scrollToggle = document.getElementById("scrollToggle");
  const gradientToggle = document.getElementById("gradientToggle");

  corNickInput?.addEventListener("input", () => {
    nickColor = corNickInput.value;
    localStorage.setItem("nickColor", nickColor);
  });

  fontColorInput?.addEventListener("input", () => {
    fontColor = fontColorInput.value;
    localStorage.setItem("fontColor", fontColor);
  });

  fonteSelect?.addEventListener("change", () => {
    font = fonteSelect.value;
    localStorage.setItem("font", font);
  });

  scrollToggle?.addEventListener("change", () => {
    autoScroll = scrollToggle.checked;
  });

  gradientToggle?.addEventListener("change", () => {
    gradienteAtivo = gradientToggle.checked;
    localStorage.setItem("gradiente", gradienteAtivo);
  });

  const resetStyle = document.getElementById("resetStyle");
  resetStyle?.addEventListener("click", () => {
    localStorage.removeItem("nickColor");
    localStorage.removeItem("fontColor");
    localStorage.removeItem("font");
    localStorage.removeItem("gradiente");
    location.reload();
  });

  // Inicializa valores salvos
  corNickInput && (corNickInput.value = nickColor);
  fontColorInput && (fontColorInput.value = fontColor);
  fonteSelect && (fonteSelect.value = font);
  scrollToggle && (scrollToggle.checked = autoScroll);
  gradientToggle && (gradientToggle.checked = gradienteAtivo);
});
