import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Safe fallback credentials ensuring the app NEVER crashes with auth/invalid-api-key
// even if .env is missing when cloned from GitHub or deployed
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBKM1FKgzN8M6EAycZWuNQTsvIPLflT6_s',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'monster-system-6dd63.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'monster-system-6dd63',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'monster-system-6dd63.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '585966730659',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:585966730659:web:6e233cb2abe0eefb12ae16',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-66ZBXPHWZ3',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development if explicitly enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
