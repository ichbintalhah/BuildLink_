// src/firebase.js — Firebase initialization (singleton)
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAaFkrly1K8-ftLcfC3ZzhJtSi6bUB9F1U",
  authDomain: "buildlink-a873d.firebaseapp.com",
  projectId: "buildlink-a873d",
  storageBucket: "buildlink-a873d.firebasestorage.app",
  messagingSenderId: "284198554569",
  appId: "1:284198554569:web:c6a0ca87abb3f25943f618",
  measurementId: "G-6TMB4CXX97",
};

// Initialize Firebase only once (prevents duplicate app errors)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Auth — set device language for SMS localization
const auth = getAuth(app);
auth.useDeviceLanguage();

// Analytics (only in browser)
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { auth, analytics };
export default app;
