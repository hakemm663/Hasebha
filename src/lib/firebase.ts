import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Hasebha Firebase Configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyDzFQYk7iU03sOiF0yPXQ_kg0Jv-WM5grU",
  authDomain: "hasebha-b398b.firebaseapp.com",
  projectId: "hasebha-b398b",
  storageBucket: "hasebha-b398b.firebasestorage.app",
  messagingSenderId: "328141579622",
  appId: "1:328141579622:web:551e6c926385ef74c5d4a7",
  measurementId: "G-ZZ6ECQG36K",
};

// Initialize Firebase App safely (prevent multiple initialization errors in React)
export const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Analytics conditionally if browser supports it
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(firebaseApp);
    }
  }
  return null;
};
