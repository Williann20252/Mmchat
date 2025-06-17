document.addEventListener("DOMContentLoaded", () => {
  const mural = document.getElementById("chat-mural");
  const input = document.getElementById("mensagemInput");
  const enviarBtn = document.getElementById("enviarBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const usuariosBtn = document.getElementById("usuariosBtn");
  const sidebar = document.getElementById("usuariosOnline");
  const imgBtn = document.getElementById("imgBtn");
  const audioBtn = document.getElementById("audioBtn");

  const nickname = localStorage.getItem("nickname") || "Anônimo";
  const userType = localStorage.getItem("userType") || "anonimo";
  let autoScroll = true;

  // Configurações visuais
  let nickColor = localStorage.getItem("nickColor") || "#00ffff";
  let font = localStorage.getItem("font") || "Inter";
  let gradienteAtivo = localStorage.getItem("gradiente") === "true";

  // Inputs ocultos
  const imgInput = document.createElement("input");
  imgInput.type = "file";
  imgInput.accept = "image/*";
  imgInput.style.display = "none";
  document.body.appendChild(imgInput);

  const audioInput = document.createElement("input");
  audioInput.type = "file";
  audioInput.accept = "audio/*";
  audioInput.style.display = "none";
  document.body.appendChild(audioInput);

  // Botões
  enviarBtn.addEventListener("click", enviarMensagem);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });

  usuariosBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });

  imgBtn.addEventListener("click", () => imgInput.click());
  audioBtn.addEventListener("click", () => audioInput.click());

  // Envio de imagem
  imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const container = criarMensagemVisual();
      const img = document.createElement("img");
      img.src = reader.result;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      img.style.marginTop = "8px";
      container.appendChild(img);
      mural.appendChild(container);
      scrollar();
    };
    reader.readAsDataURL(file);
  });

  // Envio de áudio
  audioInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const container = criarMensagemVisual();
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = reader.result;
      container.appendChild(audio);
      mural.appendChild(container);
      scrollar();
    };
    reader.readAsDataURL(file);
  });

  // Função para enviar texto
  function enviarMensagem() {
    const msg = input.value.trim();
    if (!msg) return;
    const div = criarMensagemVisual();
    div.textContent += msg;
    mural.appendChild(div);
    input.value = "";
    scrollar();
  }

  // Cria visual da mensagem
  function criarMensagemVisual() {
    const div = document.createElement("div");
    div.style.marginBottom = "0.8rem";
    div.style.fontFamily = font;
    div.style.color = localStorage.getItem("fontColor") || "#000";
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

  // Scroll automático
  function scrollar() {
    if (autoScroll) {
      mural.scrollTop = mural.scrollHeight;
    }
  }

  // MENU DE CONFIGURAÇÃO
  const configBtn = document.getElementById("configBtn");
  const configMenu = document.getElementById("configuracoesUsuario");
  const corNickInput = document.getElementById("nickColor");
  const fonteSelect = document.getElementById("fonteSelect");
  const scrollToggle = document.getElementById("scrollToggle");

  if (corNickInput && fonteSelect) {
    corNickInput.value = nickColor;
    fonteSelect.value = font;
    scrollToggle.checked = autoScroll;

    corNickInput.addEventListener("input", () => {
      nickColor = corNickInput.value;
      localStorage.setItem("nickColor", nickColor);
    });

    fonteSelect.addEventListener("change", () => {
      font = fonteSelect.value;
      localStorage.setItem("font", font);
    });

    scrollToggle.addEventListener("change", () => {
      autoScroll = scrollToggle.checked;
    });
  }

  configBtn?.addEventListener("click", () => {
    configMenu?.classList.toggle("hidden");
  });

  const gradientToggle = document.getElementById("gradientToggle");
  if (gradientToggle && userType === "premium") {
    gradientToggle.checked = gradienteAtivo;
    gradientToggle.addEventListener("change", () => {
      gradienteAtivo = gradientToggle.checked;
      localStorage.setItem("gradiente", gradienteAtivo);
    });
  }
})
