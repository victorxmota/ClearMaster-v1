
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Configuração do Firebase Downey Cleaning
 * Inserida diretamente para garantir funcionamento em ambientes de produção (GitHub Pages)
 */
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
let auth: any;
let db: any;
let storage: any;

try {
  // Inicialização do Firebase com as chaves oficiais
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Erro ao inicializar serviços do Firebase:", error);
}

const googleProvider = new GoogleAuthProvider();

/**
 * Realiza o login utilizando o provedor do Google
 */
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("O serviço de autenticação não foi inicializado corretamente.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no login com Google:", error);
    throw error;
  }
};

/**
 * Realiza o logout do usuário atual
 */
export const logoutFirebase = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
  }
};

export { auth, db, storage };
// Tipo genérico para evitar conflitos de versão do SDK durante a compilação
export type FirebaseUser = any;
