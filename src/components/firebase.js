// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// ✅ Use .env variables (set these in your .env file)
// If no Firebase config is provided, use dummy config for development
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "",
};

// Check if essential config is present
const isConfigValid = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);


let app;
let auth;
let realtimeDb;
let firestoreDb;

if (isConfigValid) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    realtimeDb = getDatabase(app);
    firestoreDb = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error.message);
  }
} else {
  console.warn(
    "Firebase config missing or incomplete! Using mock Firebase. " +
      "Please add a valid .env file in the project root and restart the dev server."
  );

  // Mock objects to prevent app crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    sendPasswordResetEmail: () => Promise.resolve(), // mock
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
