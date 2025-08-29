import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: "emote-d7938.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "demo-app-id",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "demo-measurement-id"
};

let app;
let auth;
let db;

// Check if environment variables are set
const hasValidConfig = process.env.REACT_APP_FIREBASE_API_KEY && 
                      process.env.REACT_APP_FIREBASE_PROJECT_ID;

if (!hasValidConfig) {
    console.warn("⚠️ Firebase environment variables not found. Using demo configuration. Please set up your Firebase credentials in a .env file.");
    console.warn("Create a .env file in the frontend-new directory with the following variables:");
    console.warn("REACT_APP_FIREBASE_API_KEY=your_api_key");
    console.warn("REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com");
    console.warn("REACT_APP_FIREBASE_PROJECT_ID=your_project_id");
    console.warn("REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com");
    console.warn("REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id");
    console.warn("REACT_APP_FIREBASE_APP_ID=your_app_id");
    console.warn("REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id");
}

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Only enable persistence if we have valid config
    if (hasValidConfig) {
        enableIndexedDbPersistence(db)
          .catch((err) => {
                    if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one.
          // This is a normal scenario.
        } else if (err.code === 'unimplemented') {
              // The current browser does not support all of the features required
            }
          });
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Create fallback objects to prevent crashes
    auth = null;
    db = null;
}

export { auth, db }; 