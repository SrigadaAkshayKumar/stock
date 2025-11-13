// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// ✅ Use .env variables if provided (won't break if missing)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DEMO123",
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
  console.warn("Firebase features will be disabled. Using demo mocks for PR testing.");

  // ✅ Mock Firebase to prevent crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () =>
      Promise.resolve({ user: { uid: "demo-user", email: "demo@demo.com" } }),
    createUserWithEmailAndPassword: () =>
      Promise.resolve({ user: { uid: "demo-user", email: "demo@demo.com" } }),
    signInWithPopup: () => Promise.resolve({ user: { uid: "demo-user", email: "demo@demo.com" } }),
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
