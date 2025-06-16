<!DOCTYPE html><html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MMChat - Sala</title>
  <link rel="stylesheet" href="../style.css" />
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <h2>MMChat</h2>
      <button id="sairBtn" class="btn sair">Sair</button>
    </div><div id="mural" class="chat-mural"></div>

<div class="chat-actions">
  <input type="text" id="mensagemInput" placeholder="Digite sua mensagem..." />
  <button id="enviarBtn">Enviar</button>
  <label for="imagemInput" class="btn clip">📎</label>
  <input type="file" id="imagemInput" accept="image/*" style="display:none" />
  <button id="audioBtn">🎙️</button>
  <button id="usuariosBtn">👥</button>
</div>

<div id="usuariosOnline" class="usuarios-online"></div>

  </div>  <script src="chat.js"></script></body>
</html>
