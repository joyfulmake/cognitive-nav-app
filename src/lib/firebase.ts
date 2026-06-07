import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// ─── Optional Firebase — app works fully without it ───────────────────────────
// Set these in Netlify environment variables (or .env.local for dev):
//   VITE_FIREBASE_API_KEY
//   VITE_FIREBASE_AUTH_DOMAIN
//   VITE_FIREBASE_PROJECT_ID
//   VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID
//   VITE_FIREBASE_APP_ID

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = !!(cfg.apiKey && cfg.projectId)

let _app:       FirebaseApp | null = null
let _auth:      Auth        | null = null
let _firestore: Firestore   | null = null

if (firebaseEnabled) {
  _app       = initializeApp(cfg)
  _auth      = getAuth(_app)
  _firestore = getFirestore(_app)
}

export const firebaseApp  = _app
export const firebaseAuth = _auth
export const firestore    = _firestore
