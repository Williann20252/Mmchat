// firebase.js - Inicialização do Firebase

// Importa os módulos do Firebase import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuração do seu projeto Firebase const firebaseConfig = { apiKey: "AIzaSyB3ntpJNvKrUBmoH96NjpdB0aPyDVXACWg", authDomain: "mmchat-f4f88.firebaseapp.com", databaseURL: "https://mmchat-f4f88-default-rtdb.firebaseio.com", projectId: "mmchat-f4f88", storageBucket: "mmchat-f4f88.appspot.com", messagingSenderId: "404598754438", appId: "1:404598754438:web:6a0892895591430d851507" };

// Inicializa o Firebase const app = initializeApp(firebaseConfig); const auth = getAuth(app); const database = getDatabase(app);

export { app, auth, database };

