import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDGWMNi10fzarL4W_XVALVgITFWc15VSrg",
    authDomain: "whatsapp-clone-440c3.firebaseapp.com",
    projectId: "whatsapp-clone-440c3",
    storageBucket: "whatsapp-clone-440c3.firebasestorage.app",
    messagingSenderId: "213211611536",
    appId: "1:213211611536:web:95124bcd33811e8a457315",
    measurementId: "G-MDJ8N2FC49"
  };

  const app = initializeApp(firebaseConfig);
  export const firebaseAuth = getAuth(app);