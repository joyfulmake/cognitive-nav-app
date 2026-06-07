import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Session as SessionType } from '../core/types'
import { DEPTH_LAYERS } from '../core/depthRubric'
import { useSessionStore } from '../stores/sessionStore'
import { useAuthStore } from '../stores/authStore'
import { useAmbientAudio } from '../lib/useAmbientAudio'
import { PrickLoop } from '../components/PrickLoop'
import { KnowledgeMap } from '../components/KnowledgeMap'

// Animated equaliser bars — shows whether binaural audio is playing
function SoundBars({ playing }: { playing: boolean }) {
  const heights = [6, 13, 9, 15, 8]
  return (
    <div className="flex items-end gap-px" style={{ height: 15 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          style={{ width: 2.5, height: h, borderRadius: 2, backgroundColor: 'currentColor', originY: 1 }}
          animate={playing ? { scaleY: [0.25, 1, 0.4, 0.85, 0.25] } : { scaleY: 0.3 }}
          transition={playing ? {
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          } : { duration: 0.4 }}
        />
      ))}
    </div>
  )
}

export function Session() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sessions, activeSession } = useSessionStore()
  const { user } = useAuthStore()
  const { active: audioActive, muted, toggleMute } = useAmbientAudio(!!user)

  const session = sessions.find(s => s.id === id) ?? activeSession

  useEffect(() => {
    if (!session) navigate('/')
  }, [session, navigate])

  if (!session) return null

  const safeTarget = (session.targetDepth >= 1 ? session.targetDepth : 3) as 1|2|3|4
  const targetMeta = DEPTH_LAYERS[safeTarget]

  const handleComplete = (_session: SessionType) => {}

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <Link to="/"
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold rounded-full px-3 py-1.5 transition-all mb-3"
              style={{ color: '#7a7570', backgroundColor: '#fff', border: '1.5px solid rgba(26,24,37,0.08)' }}>
              ← New inquiry
            </Link>
            <h2 className="font-display font-extrabold text-2xl leading-tight text-bulge mb-2"
              style={{ color: '#1a1825' }}>
              {session.topic}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans text-sm font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(26,24,37,0.06)', color: '#5a5670' }}>
                {session.appMode === 'epistemic' ? 'General Epistemic' : 'Clinical Crucible'}
              </span>
              {session.examBoard && session.examBoard !== 'general' && (
                <span className="font-sans text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: DEPTH_LAYERS[3].bgColor, color: DEPTH_LAYERS[3].color }}>
                  {session.examBoard.toUpperCase()}
                </span>
              )}
              <span className="font-sans text-sm font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: targetMeta.bgColor,
                  color: targetMeta.color,
                  border: `1.5px solid ${targetMeta.color}30`,
                }}>
                Target L{safeTarget} · {targetMeta.tag}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <button
                onClick={toggleMute}
                title={muted ? 'Enable binaural focus audio (headphones recommended)' : 'Binaural focus audio playing — click to mute'}
                className="flex items-center gap-2 rounded-full px-3 py-2 transition-all"
                style={{
                  backgroundColor: audioActive && !muted ? 'rgba(26,24,37,0.07)' : '#fff',
                  border: `1.5px solid ${audioActive && !muted ? 'rgba(26,24,37,0.15)' : 'rgba(26,24,37,0.08)'}`,
                  color: audioActive && !muted ? '#1a1825' : '#a09a94',
                }}
              >
                <SoundBars playing={audioActive && !muted} />
                <span className="font-mono text-xs font-semibold" style={{ letterSpacing: '0.02em' }}>
                  {muted ? 'focus off' : 'binaural'}
                </span>
              </button>
            )}
            <Link to="/history"
              className="font-sans text-sm font-semibold rounded-full px-4 py-2 transition-all"
              style={{
                color: '#5a5670',
                backgroundColor: '#fff',
                border: '1.5px solid rgba(26,24,37,0.08)',
                boxShadow: '0 1px 3px rgba(26,24,37,0.04)',
              }}>
              History
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PrickLoop session={session} onComplete={handleComplete} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-5">
            <KnowledgeMap
              appMode={session.appMode}
              currentDepth={session.currentDepth}
              targetDepth={safeTarget}
              trajectoryVector={session.trajectoryVector}
              topic={session.topic}
              isComplete={session.isComplete}
            />
            <div className="rounded-2xl p-5 bg-white shadow-warm" style={{ border: '1.5px solid rgba(26,24,37,0.07)' }}>
              <div className="font-sans text-sm font-bold mb-2" style={{ color: DEPTH_LAYERS[3].color }}>
                What is happening in your brain
              </div>
              <p className="font-sans text-sm leading-relaxed" style={{ color: '#5a5670' }}>
                Active question formulation shifts the brain from the Default Mode Network
                (passive recall) to the Task Positive Network — activating executive function,
                working memory, and structural reasoning simultaneously.
                The reformulation <em>is</em> the learning event.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
