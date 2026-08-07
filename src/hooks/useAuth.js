import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider, isConfigured } from '../lib/firebase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isConfigured);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  async function signIn() {
    if (!auth) {
      console.warn('[auth] sign-in unavailable — Firebase is not configured. See .env.example.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('[auth] sign-in failed:', err);
    }
  }

  async function signOut() {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('[auth] sign-out failed:', err);
    }
  }

  return { user, authReady, signIn, signOut, isConfigured };
}
