import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import { firebaseEnabled } from '../lib/firebase'
import { pushSessionsToCloud, pullAndMerge } from '../lib/firestoreSync'

type AuthMode = 'signin' | 'signup'

interface Props {
  onClose?: () => void
  compact?: boolean
}

export function AuthPanel({ onClose, compact = false }: Props) {
  const { user, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, clearError } = useAuthStore()
  const { sessions } = useSessionStore()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [syncing, setSyncing] = useState(false)

  // Auto-sync on sign-in
  useEffect(() => {
    if (!user) return
    setSyncing(true)
    pullAndMerge(user.uid)
      .then(() => pushSessionsToCloud(user.uid, sessions))
      .finally(() => setSyncing(false))
  }, [user?.uid]) // eslint-disable-line

  if (!firebaseEnabled) {
    return (
      <div className="p-5 rounded-2xl text-center" style={{ border: '1.5px solid rgba(26,24,37,0.08)', backgroundColor: '#faf8f4' }}>
        <div className="font-display font-bold text-base text-ink mb-2">Cloud sync not configured</div>
        <p className="font-sans text-sm text-muted leading-[1.75]">
          Firebase is not set up. Your sessions are saved locally.
          Add Firebase keys to Netlify to enable cross-device sync.
        </p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #fff 0%, #faf8f4 100%)', border: '1.5px solid rgba(26,24,37,0.08)' }}>
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm text-white"
              style={{ backgroundColor: '#7c2d96' }}>
              {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-display font-bold text-sm text-ink leading-tight">
              {user.displayName ?? user.email?.split('@')[0]}
            </div>
            <div className="font-mono text-xs text-muted">
              {syncing ? 'Syncing…' : 'Synced across devices'}
            </div>
          </div>
        </div>
        <button onClick={signOut}
          className="font-mono text-xs text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid rgba(26,24,37,0.10)' }}>
          Sign out
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <button
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-display font-bold text-sm text-ink transition-all hover:opacity-80"
        style={{ background: '#fff', border: '1.5px solid rgba(26,24,37,0.12)', boxShadow: '0 1px 3px rgba(26,24,37,0.06)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in to sync across devices
      </button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{ border: '1.5px solid rgba(26,24,37,0.09)', background: 'linear-gradient(135deg, #fff 0%, #faf8f4 100%)' }}>

      <div className="p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-display font-extrabold text-xl text-ink leading-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </div>
            <p className="font-sans text-sm text-muted mt-1 leading-[1.7]">
              {mode === 'signin'
                ? 'Sign in to sync your sessions across all devices.'
                : 'Your progress syncs everywhere — any device, any time.'}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted hover:text-ink font-mono text-xl">✕</button>
          )}
        </div>

        {/* Google */}
        <button onClick={signInWithGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-display font-bold text-base transition-all hover:opacity-85 active:scale-[0.99] mb-5 disabled:opacity-40"
          style={{ background: '#fff', border: '2px solid rgba(26,24,37,0.14)', boxShadow: '0 2px 8px rgba(26,24,37,0.08)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-line" />
          <span className="font-mono text-xs text-muted">or with email</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Email form */}
        <div className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input type="text" placeholder="Your name"
              value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full rounded-xl py-3.5 px-4 font-sans text-base bg-white focus:outline-none"
              style={{ border: '1.5px solid rgba(26,24,37,0.14)', fontSize: '16px' }}
            />
          )}
          <input type="email" placeholder="Email address"
            value={email} onChange={e => { setEmail(e.target.value); clearError() }}
            className="w-full rounded-xl py-3.5 px-4 font-sans text-base bg-white focus:outline-none"
            style={{ border: '1.5px solid rgba(26,24,37,0.14)', fontSize: '16px' }}
          />
          <input type="password" placeholder="Password"
            value={password} onChange={e => { setPassword(e.target.value); clearError() }}
            className="w-full rounded-xl py-3.5 px-4 font-sans text-base bg-white focus:outline-none"
            style={{ border: '1.5px solid rgba(26,24,37,0.14)', fontSize: '16px' }}
          />

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="font-sans text-sm text-red-600 leading-[1.6]">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            disabled={loading || !email || !password}
            onClick={() => mode === 'signin'
              ? signInWithEmail(email, password)
              : signUpWithEmail(email, password, displayName)}
            className="w-full py-4 rounded-2xl font-display font-extrabold text-base text-white transition-all disabled:opacity-40 hover:opacity-90"
            style={{ backgroundColor: '#1a1825', boxShadow: '0 4px 16px rgba(26,24,37,0.25)' }}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <button
          onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); clearError() }}
          className="w-full text-center font-sans text-sm text-muted hover:text-ink transition-colors mt-4"
        >
          {mode === 'signin'
            ? "Don't have an account? Create one →"
            : 'Already have an account? Sign in →'}
        </button>
      </div>

      <div className="px-7 py-4 border-t border-line">
        <p className="font-sans text-xs text-muted text-center leading-[1.7]">
          Your sessions are stored locally first and synced to your account.
          No data is shared. You own everything.
        </p>
      </div>
    </motion.div>
  )
}
