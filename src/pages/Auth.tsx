import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

export function Auth() {
  const navigate = useNavigate()
  const { name: existingName, initProfile, setName } = useUserStore()
  const [nameInput, setNameInput] = useState(existingName ?? '')

  const handleSetup = async () => {
    const trimmed = nameInput.trim() || 'Seeker'
    await initProfile(trimmed)
    setName(trimmed)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md w-full">

        <div className="border-b-4 border-ink pb-6 mb-8">
          <Link to="/" className="font-mono text-xs text-muted uppercase tracking-widest hover:text-ink">
            Back
          </Link>
          <h1 className="font-display text-3xl font-black mt-2">Your identity</h1>
          <p className="font-sans text-sm text-muted mt-1 leading-relaxed">
            No account. No server. Your inquiry lives on this device only.
            Stored in PouchDB -- offline-first, entirely yours.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">
              Your name (optional)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSetup()}
              className="w-full border-2 border-ink p-3 font-mono text-sm bg-white focus:outline-none"
              placeholder="Seeker"
              autoFocus
            />
          </div>

          <button
            onClick={handleSetup}
            className="w-full py-3 bg-ink text-paper font-mono text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors"
          >
            Begin
          </button>

          <div className="border-t border-line pt-4">
            <p className="font-mono text-xs text-muted leading-relaxed">
              Your sessions, depth trajectory, and concept coverage are stored locally.
              Cross-device sync via self-hosted CouchDB is on the roadmap.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
