
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser, 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCs1NAMdvtuiWzbYMohY0aZa2AiS9z8uNw",
  authDomain: "downey-cleaning.firebaseapp.com",
  projectId: "downey-cleaning",
  storageBucket: "downey-cleaning.firebasestorage.app",
  messagingSenderId: "1001041748354",
  appId: "1:1001041748354:web:6f6ea1b637b8be84e2ef9b",
  measurementId: "G-MMZD70R02H"
};

let app;
let auth: Auth | undefined;
let db: Firestore;
let storage: FirebaseStorage;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase not initialized.");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  if (!auth) throw new Error("Firebase not initialized.");
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential.user;
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase not initialized.");
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
};

export const logoutFirebase = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

export { auth, db, storage, analytics };
export type { FirebaseUser };
