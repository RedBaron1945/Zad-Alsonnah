import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const ADMIN_UID = 'WZcxWpG1PLgQYbnegHndxlrxHVx2';

const firebaseConfig = {
  apiKey: "AIzaSyA9hyROkYM98KeJOotBqYtLqn7CrSl8qVc",
  authDomain: "zad-alsonnah.firebaseapp.com",
  projectId: "zad-alsonnah",
  storageBucket: "zad-alsonnah.firebasestorage.app",
  messagingSenderId: "1014290073099",
  appId: "1:1014290073099:web:1ddb414a71c3ef8711e90e"
};

// Avoid duplicate Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication instance
export const auth = getAuth(app);

// Firestore Database instance
export const db = getFirestore(app);

// Google Auth Provider configured for Google Sign-In
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
