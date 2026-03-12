import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Frontend-only Firebase setup.
// Used by:
// - App.jsx for Firebase Auth session handling
// - services/siteContent.js for Firestore content access
// Backend does not import this file; backend config is separate.
// This module owns the single Firebase app/auth instance for the frontend.
// Current use: email/password authentication from App.jsx.
// Future production change: initialize Storage, Analytics, or provider auth here
// so the rest of the app continues importing Firebase services from one place.

// Read Firebase config from Vite env so the app source stays portable between projects.
// In production, keep these values environment-specific per Firebase project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Fail softly when config is incomplete so the UI can show a readable setup error
// instead of crashing during local setup, deployment, or future environment changes.
const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

export const isFirebaseConfigured = missingFirebaseConfig.length === 0
export const firebaseConfigIssue = isFirebaseConfigured
  ? ''
  : `Missing Firebase config: ${missingFirebaseConfig.join(', ')}`

// Keep Firebase initialization conditional because Vite exposes env values at build time,
// and a missing production secret should block auth usage without breaking the whole app.
const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null

// Export a nullable auth instance. App.jsx uses this to decide whether auth flows are
// available now, and future services should follow the same pattern if they are optional.
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
