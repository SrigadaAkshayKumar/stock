// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";


// ✅ Use .env variables (set these in your .env file)
// If no Firebase config is provided, use dummy config for development
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:demo",
  // 👇 Only include if you need analytics
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DEMO123",
  // 👇 Only include if you enable Realtime Database
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://demo-project.firebaseio.com",
};

// Avoid initializing twice
let app;
let auth;
let realtimeDb;
let firestoreDb;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  realtimeDb = getDatabase(app);
  firestoreDb = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization failed:", error.message);
  console.warn("Firebase features will be disabled. Please configure your .env file with valid Firebase credentials.");
  
  // Create mock objects to prevent app crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase not configured")),
    signInWithPopup: () => Promise.reject(new Error("Firebase not configured")),
    createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase not configured")),
    signOut: () => Promise.resolve(),
  };
  
  realtimeDb = {
    ref: () => ({
      set: () => Promise.resolve(),
      get: () => Promise.resolve({ val: () => null }),
    }),
  };
  
  firestoreDb = {
    collection: () => ({
      doc: () => ({
        set: () => Promise.resolve(),
        get: () => Promise.resolve({ data: () => null }),
      }),
    }),
  };
}

export { auth, realtimeDb, firestoreDb };
