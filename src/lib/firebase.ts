import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirebaseConfig, isFirebaseConfigured } from './firebase-config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    const config = getFirebaseConfig();
    app = getApps().length === 0 ? initializeApp(config as unknown as Record<string, string>) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
}

export function getFirebaseInstance() {
  if (!isFirebaseConfigured() || !db || !auth) {
    throw new Error(
      'Firebase is not configured or failed to initialize. Please configure your Firebase environment variables in .env (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_AUTH_DOMAIN).'
    );
  }
  return { app: app!, auth: auth!, db: db!, storage };
}

export { app, auth, db, storage };
