import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { firebaseAuth, firebaseEnabled } from '../lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  if (firebaseEnabled && firebaseAuth) {
    onAuthStateChanged(firebaseAuth, user => set({ user, loading: false }))
  }

  return {
    user: null,
    loading: firebaseEnabled,
    error: null,

    signInWithGoogle: async () => {
      if (!firebaseAuth) return
      set({ error: null })
      try {
        await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
      } catch (e: any) {
        set({ error: friendlyError(e.code) })
      }
    },

    signInWithEmail: async (email, password) => {
      if (!firebaseAuth) return
      set({ error: null })
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
      } catch (e: any) {
        set({ error: friendlyError(e.code) })
      }
    },

    signUpWithEmail: async (email, password, displayName) => {
      if (!firebaseAuth) return
      set({ error: null })
      try {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
        if (displayName) await updateProfile(cred.user, { displayName })
      } catch (e: any) {
        set({ error: friendlyError(e.code) })
      }
    },

    signOut: async () => {
      if (!firebaseAuth) return
      await fbSignOut(firebaseAuth)
      set({ user: null })
    },

    clearError: () => set({ error: null }),
  }
})

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'That email is already registered. Try signing in.',
    'auth/invalid-email':        'That email address is not valid.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error — check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
