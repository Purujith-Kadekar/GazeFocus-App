import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAk5TiYbB5akcCQpy3eMyE-x5rIjkbER-M",
  authDomain: "gazefocus-38363.firebaseapp.com",
  projectId: "gazefocus-38363",
  storageBucket: "gazefocus-38363.firebasestorage.app",
  messagingSenderId: "965347090221",
  appId: "1:965347090221:web:08964a4968af0c423f7da4",
  measurementId: "G-YC6ZZDK711"
};

const firebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const app = firebaseApp;
export default firebaseApp;