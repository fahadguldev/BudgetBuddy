import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Prefer env config (per-deploy keys), fall back to bundled values for local dev.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD_I_J3BIgT-GCjYq67JwBQIhICwrocEiw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "budgetbuddy-50c07.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "budgetbuddy-50c07",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "budgetbuddy-50c07.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "708813825630",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:708813825630:web:8cd65137246220e48c36cf",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BSYTD2GLP5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// True when Firebase credentials are present, i.e. cloud sync (Firestore)
// is available. Guests without sign-in still get full local use via
// IndexedDB — see storageService's local/cloud switch.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

// Persistent local cache with multi-tab support, initialized BEFORE any
// Firestore operation so there is no enable-persistence race. Reads serve
// from cache offline; writes queue locally and sync when reconnected,
// which is what makes the app work online + offline on any device.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, auth, db };
