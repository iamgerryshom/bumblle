import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCEU6cC47U6P2arcpu5wlJIspQJkdJFwNA",
  authDomain: "bumble-af496.firebaseapp.com",
  projectId: "bumble-af496",
  storageBucket: "bumble-af496.appspot.com",
  messagingSenderId: "374251452560",
  appId: "1:374251452560:web:YOUR_WEB_APP_ID"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// ✅ AUTH (THIS WAS MISSING)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();