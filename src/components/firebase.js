// src/components/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8nJTnjl9yozz8TtcP_YZANpc6Hqzfoek",
  authDomain: "stock-34f5d.firebaseapp.com",
  projectId: "stock-34f5d",
  storageBucket: "stock-34f5d.firebasestorage.app",
  messagingSenderId: "413335093270",
  appId: "1:413335093270:web:fee27ad845d95896c4b537",
  measurementId: "G-MM3D1MYHJZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

export { auth, database, db, app };
