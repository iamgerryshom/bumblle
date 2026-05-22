import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASu1i-qRJcNHQoeCJaRmVk5Ya0pyYjiYM",
  authDomain: "bumble-af496.firebaseapp.com",
  databaseURL: "https://bumble-af496-default-rtdb.firebaseio.com",
  projectId: "bumble-af496",
  storageBucket: "bumble-af496.firebasestorage.app",
  messagingSenderId: "374251452560",
  appId: "1:374251452560:web:e83d1fdc973f6423e88015",
  measurementId: "G-YTEQYG33N5"
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

// IMPORTANT EXPORT
export { analytics };