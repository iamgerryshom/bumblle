import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBiCrYphgx7IOFmllYYIdKJkCNT-zLG41w",
  authDomain: "main-website-df4e3.firebaseapp.com",
  projectId: "main-website-df4e3",
  storageBucket: "main-website-df4e3.firebasestorage.app",
  messagingSenderId: "1086355376159",
  appId: "1:1086355376159:web:8969e5d93eeb1e4262ed2a",
  measurementId: "G-VY4Q1SS3TP"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// 🔥 SAFE analytics init
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Firestore
export const db = getFirestore(app);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);


// IMPORTANT EXPORT
export { analytics };