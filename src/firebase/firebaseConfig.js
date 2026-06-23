import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCKWZBk6czspuREj3sKEnMOynWjaILVyY",
  authDomain: "streetbois-fashion.firebaseapp.com",
  projectId: "streetbois-fashion",
  storageBucket: "streetbois-fashion.firebasestorage.app",
  messagingSenderId: "1002301079130",
  appId: "1:1002301079130:web:64e6ee83dab09a4d402263"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;