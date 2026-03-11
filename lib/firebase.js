// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_API_KEY",
  authDomain: "truckcel-177ec.firebaseapp.com",
  projectId: "truckcel-177ec",
  storageBucket: "truckcel-177ec.firebasestorage.app",
  messagingSenderId: "622007926713",
  appId: "1:622007926713:web:1f0fe0a7c0b01ba7da4068",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db for client components
export const auth = getAuth(app);
export const db = getFirestore(app);