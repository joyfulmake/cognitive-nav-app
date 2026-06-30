import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DepthLayer, AppMode } from '../core/types'
import { DEPTH_LAYERS, MASTERY_REQUIRED } from '../core/depthRubric'

interface Props {
  activeGate: DepthLayer
  appMode: AppMode
  masteryCount: number
  topic?: string
  defaultOpen?: boolean
}

interface ContextData {
  hook: string
  facts: string[]
  searches: { label: string; query: string }[]
}

function ContextPanel({ topic, gate }: { topic: string; gate: number }) {
  const [data, setData]     = useState<ContextData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(false)

  const fetch_ = useCallback(async () => {
    if (loading || data) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, gate }),
      })
      if (!res.ok) throw new Error('failed')
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [topic, gate, loading, data])

  if (!data && !loading && !error) {
    return (
      <button
        type="button"
        onClick={fetch_}
        className="w-full py-3 rounded-xl font-sans text-sm font-semibold transition-all text-left px-4 flex items-center gap-2"
        style={{ backgroundColor: '#faf8f4', border: '1.5px dashed #c8c0b4', color: '#8a7d6e' }}
      >
        <span style={{ fontSize: '1rem' }}>✦</span>
        <span>Build context — why this topic is fascinating at this depth</span>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="py-4 px-4 flex items-center gap-2" style={{ color: '#8a7d6e' }}>
        <motion.div className="w-3 h-3 rounded-full"
          style={{ backgroundColor: '#b86a14' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, repeat: Infinity }} />
        <span className="font-mono text-xs">Building context…</span>
      </div>
    )
  }

  if (error) {
    return (
      <p className="font-mono text-xs text-muted px-4 py-3">
        Context unavailable — check your network and try again.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hook */}
      {data!.hook && (
        <p className="font-sans text-sm leading-relaxed text-ink/80 italic px-1">
          {data!.hook}
        </p>
      )}

      {/* Key facts */}
      {data!.facts.length > 0 && (
        <div className="flex flex-col gap-2">
          {data!.facts.map((fact, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="font-mono text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: '#b86a14' }}>→</span>
              <p className="font-sans text-sm text-ink/70 leading-relaxed">{fact}</p>
            </div>
          ))}
        </div>
      )}

      {/* Web search links */}
      {data!.searches.length > 0 && (
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8a7d6e' }}>
            Go deeper — open in browser
          </div>
          <div className="flex flex-col gap-1.5">
            {data!.searches.map((s, i) => (
              <a
                key={i}
                href={`https://www.google.com/search?q=${encodeURIComponent(s.query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-all"
                style={{ backgroundColor: '#fdf8f0', border: '1.5px solid #e4dace', color: '#1c1a14' }}
              >
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>↗</span>
                <span className="flex-1 truncate">{s.label}</span>
                <span className="font-mono text-xs flex-shrink-0" style={{ color: '#b86a14', opacity: 0.8 }}>Search</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MasteryDots({ count, required, color }: { count: number; required: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: required }).map((_, i) => {
        const filled = i < count
        const isNext = i === count
        return (
          <motion.div
            key={i}
            className="rounded-full border-2 flex-shrink-0"
            style={{ width: 13, height: 13, backgroundColor: filled ? color : 'transparent', borderColor: color }}
            initial={filled ? { scale: 0.5 } : {}}
            animate={filled ? { scale: 1 } : isNext ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.35 }}
            transition={isNext ? { duration: 1.6, repeat: Infinity } : { type: 'spring', stiffness: 320 }}
          />
        )
      })}
      <span className="font-mono text-xs font-bold ml-1">{count} / {required}</span>
    </div>
  )
}

export function LevelStudyPanel({ activeGate, appMode, masteryCount, topic = '', defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = DEPTH_LAYERS[activeGate]
  const isFoundation = activeGate === 1
  const prevMeta = isFoundation ? null : DEPTH_LAYERS[(activeGate - 1) as DepthLayer]
  const remaining = MASTERY_REQUIRED - masteryCount

  const progressMessage = masteryCount === 0
    ? isFoundation
      ? 'Start anywhere. Every question maps the territory.'
      : 'Your first crossing awaits. Ask freely.'
    : masteryCount < MASTERY_REQUIRED
    ? `${remaining} more crossing${remaining !== 1 ? 's' : ''} to master this gate. You are building it.`
    : isFoundation ? 'Foundation mapped. Beautiful beginning.' : 'Gate mastered. You earned it.'

  return (
    <div className="border-2" style={{ borderColor: meta.color }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors"
        style={{
          backgroundColor: meta.bgColor,
          borderLeft: open ? `4px solid ${meta.color}` : '4px solid transparent',
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs font-bold tracking-widest uppercase mb-0.5"
            style={{ color: meta.color }}>
            {isFoundation ? 'Foundation · Layer 1' : `Gate ${activeGate - 1} · Layer ${activeGate - 1} → ${activeGate}`}
          </div>
          <div className="font-display text-base font-black leading-tight"
            style={{ color: '#1c1a14' }}>
            {isFoundation ? `${meta.headline} — Begin anywhere` : `${prevMeta!.headline} → ${meta.headline}`}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
          <MasteryDots count={masteryCount} required={MASTERY_REQUIRED} color={meta.color} />
          <motion.span className="font-mono text-xs opacity-60" style={{ color: meta.color }}
            animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>▼</motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 flex flex-col gap-5 border-t-2" style={{ borderColor: meta.color }}>

              {/* Progress — warm, never pressuring */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-sm"
                style={{ backgroundColor: meta.bgColor }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-1">
                    {Array.from({ length: MASTERY_REQUIRED }).map((_, i) => (
                      <motion.div key={i} className="w-6 h-1.5 rounded-full"
                        style={{ backgroundColor: i < masteryCount ? meta.color : '#e0ddd5' }}
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: meta.color }}>
                    {masteryCount}/{MASTERY_REQUIRED}
                  </span>
                </div>
                <p className="font-sans text-sm font-semibold text-ink/80 leading-relaxed">
                  {progressMessage}
                </p>
                {!isFoundation && masteryCount === 0 && (
                  <p className="font-sans text-xs text-ink/50 mt-1 leading-relaxed">
                    Mastery is a pattern, not a performance. Five crossings means your mind has made this depth its new normal.
                  </p>
                )}
              </motion.div>

              {/* Signs your question is crossing — inspiring framing */}
              <div>
                <div className="font-sans text-sm font-bold text-ink mb-3">
                  {isFoundation
                    ? 'What you are exploring at this level'
                    : 'Signs your question is crossing this gate'}
                </div>
                <div className="flex flex-col gap-3">
                  {meta.qualifyingCriteria.map((criterion, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                        style={{ backgroundColor: meta.bgColor, color: meta.color, border: `1.5px solid ${meta.color}60` }}>
                        {i + 1}
                      </div>
                      <p className="font-sans text-sm text-ink/75 leading-relaxed">{criterion}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Science — framed as discovery not lecture */}
              <div className="border-l-4 pl-4 py-1" style={{ borderColor: meta.color }}>
                <div className="font-mono text-xs font-bold tracking-widest uppercase mb-2" style={{ color: meta.color }}>
                  What is happening in your brain right now
                </div>
                <p className="font-sans text-sm text-ink/70 leading-relaxed">
                  {meta.deepScienceBacking}
                </p>
                <p className="font-mono text-xs mt-2" style={{ color: `${meta.color}80` }}>
                  {meta.researchAnchor}
                </p>
              </div>

              {/* Mastery signal — what transformation feels like */}
              <div className="p-4 border-2 border-dashed" style={{ borderColor: `${meta.color}50` }}>
                <div className="font-sans text-xs font-bold uppercase tracking-widest mb-2" style={{ color: meta.color }}>
                  How mastery of this gate feels
                </div>
                <p className="font-sans text-sm text-ink/70 leading-relaxed italic">
                  {meta.masterySignal}
                </p>
              </div>

              {/* Example — framed as inspiration not template */}
              <div>
                <div className="font-sans text-xs font-bold uppercase tracking-widest mb-2" style={{ color: meta.color }}>
                  A question that lives at this depth
                  {appMode === 'clinical' ? ' (clinical)' : ' (epistemic)'}
                </div>
                <div className="p-4 border-2" style={{ borderColor: `${meta.color}40`, backgroundColor: meta.bgColor }}>
                  <p className="font-sans text-base font-semibold text-ink/85 leading-relaxed italic">
                    {appMode === 'clinical' ? meta.exampleClinical : meta.exampleEpistemic}
                  </p>
                </div>
                <p className="font-sans text-xs text-ink/45 mt-2 leading-relaxed">
                  {isFoundation
                    ? 'This is the territory. Your question will find its own shape.'
                    : 'Let this show you the feel of this depth — then ask your own version, from your own curiosity.'}
                </p>
              </div>

              {/* Context panel — interest hook, key facts, web search links */}
              {topic && (
                <div className="border-t pt-4" style={{ borderColor: `${meta.color}30` }}>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest mb-3" style={{ color: meta.color }}>
                    Build your interest in this topic
                  </div>
                  <ContextPanel topic={topic} gate={activeGate - 1} />
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
