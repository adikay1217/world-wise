import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

// Sign-in is an optional feature layered on top of a fully-playable guest
// experience — until a Firebase project is set up (see .env.example), auth
// and db must stay null rather than throwing, so the game still loads.
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn(
    '[firebase] not configured — VITE_FIREBASE_* env vars are missing. ' +
      'Sign-in is disabled; the game still works fully as a guest. See .env.example.'
  );
}

export { auth, db, googleProvider, isConfigured };
