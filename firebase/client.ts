// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB--yj9CZgkJ-mou2vkvnYGifpxBVVBSok",
  authDomain: "oracruit.firebaseapp.com",
  projectId: "oracruit",
  storageBucket: "oracruit.firebasestorage.app",
  messagingSenderId: "667380340025",
  appId: "1:667380340025:web:223a3d9507ed42a7db04e8",
  measurementId: "G-1BZQTSHSR3",
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
