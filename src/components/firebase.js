// src/components/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_authDOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGEBUCKET",
  messagingSenderId: "YOUR_MESSAGINGSENDERID",
  appId: "YOUR_APPID",
  measurementId: "MEASUREMENTID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

export { auth, database, db, app };
