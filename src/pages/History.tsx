import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSessionStore } from '../stores/sessionStore'
import { DEPTH_LAYERS, computePracticeScore, isMasteryComplete, MASTERY_REQUIRED } from '../core/depthRubric'
import type { DepthLayer, Session } from '../core/types'

type Filter = 'all' | 'epistemic' | 'clinical' | 'complete' | 'inprogress'

function TrajectoryArc({ vector }: { vector: DepthLayer[] }) {
  if (vector.length === 0) return <span className="font-mono text-xs text-muted">—</span>
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {vector.map((d, i) => (
        <span key={i} className="flex items-center">
          <span
            className="font-mono text-xs font-bold px-1 py-0.5 leading-none"
            style={{
              backgroundColor: DEPTH_LAYERS[d].bgColor,
              color: DEPTH_LAYERS[d].color,
              border: `1px solid ${DEPTH_LAYERS[d].color}60`,
            }}
          >
            {d}
          </span>
          {i < vector.length - 1 && (
            <span className="font-mono text-xs text-muted/50 mx-0.5">›</span>
          )}
        </span>
      ))}
    </div>
  )
}

function MasteryMini({ session }: { session: Session }) {
  const target = session.targetDepth ?? 3
  const mastery = session.levelMastery ?? {}
  const gates = [2, 3, 4].filter(l => l <= target) as DepthLayer[]
  if (gates.length === 0) return null
  return (
    <div className="flex gap-2 flex-wrap">
      {gates.map(gate => {
        const count = Math.min(mastery[gate] ?? 0, MASTERY_REQUIRED)
        const meta = DEPTH_LAYERS[gate]
        return (
          <div key={gate} className="flex items-center gap-1">
            <span className="font-mono text-xs" style={{ color: meta.color }}>G{gate - 1}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: MASTERY_REQUIRED }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: i < count ? meta.color : '#e0ddd5' }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const target = (session.targetDepth ?? 3) as DepthLayer
  const mastery = session.levelMastery ?? {}
  const score = computePracticeScore(session.trajectoryVector, mastery, target)
  const complete = session.isComplete || isMasteryComplete(mastery, target)
  const targetMeta = DEPTH_LAYERS[target]
  const maxDepth = session.trajectoryVector.length
    ? Math.max(...session.trajectoryVector) as DepthLayer
    : 1
  const maxMeta = DEPTH_LAYERS[maxDepth]
  const scoreColor = score >= 80 ? '#1a6b3a' : score >= 60 ? '#0c447c' : '#c43d0f'
  const date = new Date(session.createdAt)
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={`/session/${session.id}`}
        className="block border-2 border-ink p-5 hover:border-opacity-80 transition-all group"
        style={{ borderColor: complete ? maxMeta.color : '#0a0a0f' }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="font-mono text-xs font-bold px-1.5 py-0.5"
                style={{ backgroundColor: targetMeta.bgColor, color: targetMeta.color, border: `1px solid ${targetMeta.color}` }}
              >
                Target L{target} · {targetMeta.tag}
              </span>
              <span className="font-mono text-xs text-muted">
                {session.appMode === 'epistemic' ? 'General Epistemic' : 'Clinical Crucible'}
              </span>
              {session.examBoard && session.examBoard !== 'general' && (
                <span className="font-mono text-xs text-muted">{session.examBoard.toUpperCase()}</span>
              )}
              {complete && (
                <span className="font-mono text-xs font-bold" style={{ color: maxMeta.color }}>✓ complete</span>
              )}
            </div>
            <h3 className="font-display text-lg font-black leading-tight group-hover:opacity-80 transition-opacity">
              {session.topic}
            </h3>
            <div className="font-mono text-xs text-muted mt-0.5">{dateStr}</div>
          </div>
          {/* Score */}
          {session.trajectoryVector.length > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="font-display text-3xl font-black leading-none" style={{ color: scoreColor }}>
                {score}
              </div>
              <div className="font-mono text-xs text-muted">score</div>
            </div>
          )}
        </div>

        {/* Trajectory */}
        {session.trajectoryVector.length > 0 && (
          <div className="mb-3">
            <TrajectoryArc vector={session.trajectoryVector} />
          </div>
        )}

        {/* Mastery dots */}
        <MasteryMini session={session} />

        {/* Footer stats */}
        {session.reformulations.length > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-line">
            <span className="font-sans text-xs text-muted">
              {session.reformulations.length} attempt{session.reformulations.length !== 1 ? 's' : ''}
            </span>
            {maxDepth > 1 && (
              <span className="font-sans text-xs font-semibold" style={{ color: maxMeta.color }}>
                Reached L{maxDepth} · {maxMeta.tag}
              </span>
            )}
            {!complete && (
              <span className="font-sans text-xs font-semibold text-ink/50">→ Resume</span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  )
}

function ConceptCoverage({ sessions }: { sessions: Session[] }) {
  const coverage: Record<string, DepthLayer> = {}
  for (const s of sessions) {
    if (s.trajectoryVector.length === 0) continue
    const maxDepth = Math.max(...s.trajectoryVector) as DepthLayer
    if (!coverage[s.topic] || coverage[s.topic] < maxDepth) {
      coverage[s.topic] = maxDepth
    }
  }

  const topics = Object.entries(coverage).sort((a, b) => b[1] - a[1])
  if (topics.length === 0) return null

  return (
    <div className="border-2 border-ink p-6">
      <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">
        Concept coverage — {topics.length} topic{topics.length !== 1 ? 's' : ''} explored
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map(([topic, depth]) => {
          const meta = DEPTH_LAYERS[depth]
          return (
            <span
              key={topic}
              className="font-sans text-sm font-medium px-3 py-1.5 leading-none"
              style={{
                backgroundColor: meta.bgColor,
                color: meta.color,
                border: `1.5px solid ${meta.color}60`,
              }}
            >
              {topic}
              <span className="font-mono text-xs ml-2 opacity-70">L{depth}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function History() {
  const { sessions } = useSessionStore()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (filter === 'epistemic') return s.appMode === 'epistemic'
      if (filter === 'clinical') return s.appMode === 'clinical'
      if (filter === 'complete') return s.isComplete || isMasteryComplete(s.levelMastery ?? {}, s.targetDepth ?? 3)
      if (filter === 'inprogress') return !s.isComplete && !isMasteryComplete(s.levelMastery ?? {}, s.targetDepth ?? 3)
      return true
    })
  }, [sessions, filter])

  const stats = useMemo(() => {
    const complete = sessions.filter(s => s.isComplete || isMasteryComplete(s.levelMastery ?? {}, s.targetDepth ?? 3))
    const allDepths = sessions.flatMap(s => s.trajectoryVector)
    const maxDepth = allDepths.length ? Math.max(...allDepths) as DepthLayer : 0
    const totalQualifying = sessions.reduce((acc, s) => {
      return acc + Object.values(s.levelMastery ?? {}).reduce((a: number, b) => a + (b as number), 0)
    }, 0)
    const scores = sessions
      .filter(s => s.trajectoryVector.length > 0)
      .map(s => computePracticeScore(s.trajectoryVector, s.levelMastery ?? {}, s.targetDepth ?? 3))
    const bestScore = scores.length ? Math.max(...scores) : 0
    const uniqueTopics = new Set(sessions.map(s => s.topic)).size
    return { total: sessions.length, complete: complete.length, maxDepth, totalQualifying, bestScore, uniqueTopics }
  }, [sessions])

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'epistemic', label: 'Epistemic' },
    { id: 'clinical', label: 'Clinical' },
    { id: 'complete', label: 'Complete' },
    { id: 'inprogress', label: 'In Progress' },
  ]

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="border-b-4 border-ink pb-8 mb-8">
          <Link to="/" className="font-mono text-xs text-muted uppercase tracking-widest hover:text-ink transition-colors">
            ← New inquiry
          </Link>
          <h1 className="font-display text-4xl font-black mt-2">Inquiry History</h1>
          <p className="font-sans text-sm text-muted mt-1">
            Your questioning practice, recorded.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col gap-6">
            <div className="border-2 border-line p-10 text-center">
              <div className="font-display text-5xl font-black text-line mb-4">?</div>
              <p className="font-sans text-base font-semibold text-ink/60 mb-2">No inquiries yet.</p>
              <p className="font-sans text-sm text-muted leading-relaxed max-w-sm mx-auto mb-6">
                Every session you complete will appear here — with your depth trajectory, mastery progress, and practice score.
              </p>
              <Link
                to="/"
                className="inline-block font-sans text-sm font-bold uppercase tracking-widest border-2 border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors"
              >
                Begin first inquiry
              </Link>
            </div>

            {/* Game primer for new users */}
            <div className="border-2 border-ink p-6">
              <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">How the game works</div>
              <div className="flex flex-col gap-3">
                {[
                  { gate: 'Gate 1', desc: 'Name a mechanism or cause — not just a fact. Cleared when your question identifies HOW or WHY something works.' },
                  { gate: 'Gate 2', desc: 'Engage a specific failure mode or edge case. Cleared when your question introduces a concrete conditional scenario.' },
                  { gate: 'Gate 3', desc: 'Question the system\'s design assumptions. Cleared when your question steps entirely outside the system.' },
                ].map((g, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-mono text-xs font-bold text-ink/40 flex-shrink-0 w-12">{g.gate}</span>
                    <p className="font-sans text-sm text-ink/70 leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-line">
                <p className="font-sans text-sm text-ink/55 leading-relaxed italic">
                  You need 5 qualifying questions per gate to advance. One lucky question is not mastery.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Stats bar — 2 rows of 3, responsive down to 320px */}
            <div className="grid grid-cols-3 gap-0 border-2 border-ink rounded-2xl overflow-hidden">
              {[
                { label: 'Sessions',   value: stats.total, color: '#1a1825' },
                { label: 'Completed',  value: stats.complete, color: '#1a1825' },
                { label: 'Topics',     value: stats.uniqueTopics, color: '#1a1825' },
                { label: 'Best depth', value: stats.maxDepth > 0 ? `L${stats.maxDepth}` : '—', color: stats.maxDepth > 0 ? DEPTH_LAYERS[stats.maxDepth as DepthLayer].color : '#c8c4bc' },
                { label: 'Best score', value: stats.bestScore > 0 ? stats.bestScore : '—', color: stats.bestScore >= 80 ? '#1a6b3a' : stats.bestScore >= 60 ? '#0c447c' : '#c43d0f' },
                { label: 'Qual. Qs',   value: stats.totalQualifying, color: '#1a1825' },
              ].map((s, i) => (
                <div key={i} className="p-3 text-center"
                  style={{
                    borderRight: (i % 3 < 2) ? '2px solid #1a1825' : 'none',
                    borderTop: i >= 3 ? '2px solid #1a1825' : 'none',
                  }}>
                  <div className="font-display text-xl font-black leading-tight" style={{ color: s.color }}>{s.value}</div>
                  <div className="font-mono leading-tight mt-0.5" style={{ fontSize: '0.6rem', color: '#7a7570' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-0 border-2 border-ink overflow-x-auto">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2.5 font-mono text-xs uppercase tracking-widest flex-shrink-0 transition-colors border-r-2 border-ink last:border-r-0 ${
                    filter === f.id ? 'bg-ink text-paper' : 'text-muted hover:bg-line/40'
                  }`}
                >
                  {f.label}
                  {f.id === 'all' && ` (${sessions.length})`}
                </button>
              ))}
            </div>

            {/* Session list */}
            {filtered.length === 0 ? (
              <div className="border-2 border-line p-8 text-center">
                <p className="font-sans text-sm text-muted">No sessions match this filter.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((session, i) => (
                  <SessionCard key={session.id} session={session} index={i} />
                ))}
              </div>
            )}

            {/* Concept coverage */}
            <ConceptCoverage sessions={sessions} />

          </div>
        )}

      </div>
    </div>
  )
}
