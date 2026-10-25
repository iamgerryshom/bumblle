import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCf2TdkDpeGOHOmz2l1R_XPXfdNO4WQgBI",
  authDomain: "main-website-cd2ae.firebaseapp.com",
  projectId: "main-website-cd2ae",
  storageBucket: "main-website-cd2ae.firebasestorage.app",
  messagingSenderId: "1034993565717",
  appId: "1:1034993565717:web:31214317c12328e92e8e1c",
  measurementId: "G-XSFMWWB1F9"
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