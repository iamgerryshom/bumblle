import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBdisWjqqlmlvkTjUucbV-RvXf1jX9s80c",
  authDomain: "bumble-8682b.firebaseapp.com",
  projectId: "bumble-8682b",
  storageBucket: "bumble-8682b.firebasestorage.app",
  messagingSenderId: "577960970583",
  appId: "1:577960970583:web:a4128da1f8feda5cc59612",
  measurementId: "G-0L3CR6FEE3"
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