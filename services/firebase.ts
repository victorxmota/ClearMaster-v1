
import { initializeApp } from "firebase/app";
// Fix: Removed User and Auth types which were reported as missing from firebase/auth
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// Fix: Removed Firestore type which was reported as missing from firebase/firestore
import { getFirestore } from "firebase/firestore";
// Fix: Removed FirebaseStorage type which was reported as missing from firebase/storage
import { getStorage } from "firebase/storage";

// Safe environment variable access
// Using type assertion to any to bypass missing ImportMeta interface definition for env
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let app;
let auth: any;
let db: any;
let storage: any;

// Só inicializa se houver uma API Key definida para evitar o erro "auth/invalid-api-key"
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
} else {
  console.warn("Firebase config missing. App will allow render but services will fail.");
}

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase não está configurado. Verifique o console.");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export { auth, db, storage };
// Fix: Export FirebaseUser as any since it was missing from the import
export type FirebaseUser = any;
