
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  projectId: "gameztarz-banking",
  appId: "1:547708514529:web:6d3623651f88c0b89cc7a0",
  storageBucket: "gameztarz-banking.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBdA9bZe128O08tp1fPPD7bzAe1iHdcILs",
  authDomain: "gameztarz-banking.firebaseapp.com",
  messagingSenderId: "547708514529",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
