import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlhqFoCB6VMd5SXWDzGLKxxxkM_E5nk4c",
  authDomain: "emote-d7938.firebaseapp.com",
  projectId: "emote-d7938",
  storageBucket: "emote-d7938.appspot.com",
  messagingSenderId: "976883957692",
  appId: "1:976883957692:web:cac3cf9d7076afe673b5b9",
  measurementId: "G-2S83EGLKM5"
};

let app;
let auth;
let db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { auth, db }; 