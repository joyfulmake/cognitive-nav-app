import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import type { Session, Reformulation, DepthLayer, EvaluateResponse } from '../core/types'
import {
  DEPTH_LAYERS, GATES, MASTERY_REQUIRED,
  gatesCleared, computePracticeScore,
  getActiveGate, getMasteryCount, isMasteryComplete,
} from '../core/depthRubric'
import { evaluateQuestion } from '../lib/api'
import { useSessionStore } from '../stores/sessionStore'
import { useWikiImage } from '../lib/useWikiImage'
import { useVoiceInput } from '../lib/useVoiceInput'
import { useVoiceSettings } from '../lib/useVoiceSettings'
import { useCartesiaTTS } from '../lib/useCartesiaTTS'
import { DepthMeter } from './DepthMeter'
import { LevelStudyPanel } from './LevelStudyPanel'

// ─── Depth vision ─────────────────────────────────────────────────────────────

const DEPTH_VISION: Partial<Record<DepthLayer, Partial<Record<DepthLayer, string>>>> = {
  1: {
    2: 'When you trace the mechanism, you can explain this clearly to someone else — and find gaps in your own understanding while doing so.',
    3: 'Systemic thinkers anticipate failures before they happen. That ability starts here, with understanding why things work.',
    4: 'The deepest questions about any system emerge only after complete structural clarity. You are laying that foundation right now.',
  },
  2: {
    2: 'You are inside the mechanism. This is where real understanding lives — not memory, but structural awareness.',
    3: 'You know why it works under normal conditions. The next horizon: what breaks it? Knowing failure modes is how experts diagnose anything.',
    4: 'Mechanism fluency is the ground of philosophical depth. Each time you ask why, you are one layer closer to asking why it was designed this way at all.',
  },
  3: {
    3: 'You are navigating the system\'s edge cases. This is expert cognition territory — you are thinking the way designers think.',
    4: 'You can hold failure modes clearly in mind. Layer 4 asks: why was this system built to behave exactly this way at its edges?',
  },
}

function getDepthVision(achieved: DepthLayer, target: DepthLayer): string | null {
  return DEPTH_VISION[achieved]?.[target] ?? null
}

interface Props {
  session: Session
  onComplete?: (session: Session) => void
}

// ─── Celebrations ─────────────────────────────────────────────────────────────

function RingBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="absolute rounded-full border-2" style={{ borderColor: color }}
          initial={{ width: 40, height: 40, opacity: 0.85 }}
          animate={{ width: 280 + i * 90, height: 280 + i * 90, opacity: 0 }}
          transition={{ duration: 1.2 + i * 0.18, delay: i * 0.18, ease: 'easeOut' }}
        />
      ))}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360
        const r = 80 + (i % 3) * 24
        const x = Math.cos((angle * Math.PI) / 180) * r
        const y = Math.sin((angle * Math.PI) / 180) * r
        return (
          <motion.div key={`p${i}`} className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x, y, scale: 0, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.08 + i * 0.025, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

function ValidPulse({ color }: { color: string }) {
  return (
    <motion.div className="absolute inset-0 rounded-sm pointer-events-none"
      style={{ backgroundColor: color }}
      initial={{ opacity: 0.18 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
    />
  )
}

// ─── Gate scan animation ──────────────────────────────────────────────────────

function ScanAnimation({ question, stage }: { question: string; stage: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="card-premium p-7"
    >
      <div className="font-mono text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#8a7d6e' }}>
        Scanning cognitive depth…
      </div>
      <p className="font-sans text-base font-medium mb-6 italic leading-[1.75] line-clamp-2"
        style={{ color: '#b0ada6' }}>
        "{question}"
      </p>
      <div className="flex flex-col gap-5">
        {GATES.map((gate, i) => {
          const gd = (i + 2) as DepthLayer
          const isActive = stage === i + 1
          const isDone = stage > i + 1
          return (
            <div key={gate.id} className="flex items-start gap-4">
              <motion.div
                className="w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  borderColor: isDone ? DEPTH_LAYERS[gd].color : isActive ? DEPTH_LAYERS[gd].color : '#e0ddd5',
                  backgroundColor: isDone ? DEPTH_LAYERS[gd].bgColor : 'transparent',
                }}
                animate={isActive ? { borderColor: [DEPTH_LAYERS[gd].color, '#d0cdc5', DEPTH_LAYERS[gd].color] } : {}}
                transition={{ duration: 0.7, repeat: isActive ? Infinity : 0 }}
              >
                {isDone
                  ? <span className="font-sans text-sm font-bold" style={{ color: DEPTH_LAYERS[gd].color }}>✓</span>
                  : isActive
                  ? <motion.div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEPTH_LAYERS[gd].color }}
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.55, repeat: Infinity }} />
                  : null
                }
              </motion.div>
              <div className="flex-1">
                <div className="font-sans text-sm font-semibold leading-tight" style={{ color: (isActive || isDone) ? DEPTH_LAYERS[gd].color : '#c0bdb5' }}>
                  Gate {gate.id} · {gate.label}
                </div>
                <div className="font-sans text-sm text-muted mt-1 leading-[1.7]">{gate.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Wikipedia contextual image ───────────────────────────────────────────────

function WikiImagePanel({ query, depth }: { query: string; depth: DepthLayer }) {
  const { data, loading } = useWikiImage(query)
  const meta = DEPTH_LAYERS[depth]

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl overflow-hidden shimmer" style={{ height: 112 }}
      />
    )
  }
  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${meta.color}20`, boxShadow: `0 2px 16px ${meta.color}12` }}
    >
      <div className="relative">
        <img
          src={data.src}
          alt={data.caption}
          className="w-full object-cover"
          style={{ maxHeight: 220, objectPosition: 'top' }}
          onError={e => {
            const el = (e.target as HTMLImageElement).closest('.wiki-image-panel') as HTMLElement | null
            if (el) el.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-white text-sm leading-tight text-bulge-white truncate">
              {data.articleTitle}
            </p>
            <p className="font-sans text-white/60 text-xs mt-0.5 line-clamp-1 leading-snug">{data.caption}</p>
          </div>
          <a
            href={data.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 font-mono text-xs text-white/85 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
          >
            Wiki →
          </a>
        </div>
      </div>
      <div className="px-4 py-2.5" style={{ backgroundColor: meta.bgColor }}>
        <p className="font-mono text-xs font-bold" style={{ color: meta.color }}>
          Layer {depth} · {meta.tag} · Visual reference
        </p>
      </div>
    </motion.div>
  )
}

// ─── Neural pathway mastery visualization ─────────────────────────────────────

function NeuralPathwayViz({ count, required, color, bgColor }: {
  count: number; required: number; color: string; bgColor: string
}) {
  const filledFraction = count > 1 ? (count - 1) / (required - 1) : 0

  return (
    <div className="relative px-1">
      {/* Base track */}
      <div className="absolute left-5 right-5 top-4 h-0.5" style={{ backgroundColor: '#e0ddd5', borderRadius: 2 }} />
      {/* Filled track */}
      <motion.div
        className="absolute left-5 top-4 h-0.5"
        style={{ backgroundColor: color, borderRadius: 2, boxShadow: `0 0 6px ${color}60` }}
        initial={{ width: 0 }}
        animate={{ width: `calc((100% - 2.5rem) * ${filledFraction})` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {/* Nodes */}
      <div className="relative flex justify-between items-start">
        {Array.from({ length: required }).map((_, i) => {
          const filled = i < count
          const isLatest = i === count - 1
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <motion.div
                className="rounded-full border-2 flex items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  borderColor: filled ? color : '#d5d1c8',
                  backgroundColor: filled ? bgColor : '#f5f3ef',
                  boxShadow: isLatest ? `0 0 0 3px ${color}14, 0 0 10px ${color}18` : 'none',
                  position: 'relative',
                  zIndex: 1,
                }}
                animate={isLatest ? { scale: [1, 1.18, 1] } : {}}
                transition={{ duration: 0.55, delay: 0.15 }}
              >
                {filled && (
                  <motion.div
                    className="rounded-full"
                    style={{ width: 14, height: 14, backgroundColor: color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 360, delay: i === count - 1 ? 0.12 : 0 }}
                  />
                )}
              </motion.div>
              <span className="font-mono font-bold" style={{ color: filled ? color : '#c8c4bc', fontSize: '0.6rem' }}>
                {i + 1}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Journey arc ──────────────────────────────────────────────────────────────
// Circles-only arc that works at any width — tag names moved to a label row below

function JourneyArc({ achieved, target }: { achieved: DepthLayer; target: DepthLayer }) {
  const layers: DepthLayer[] = [1, 2, 3, 4]
  const currMeta = DEPTH_LAYERS[achieved]
  const tgtMeta  = DEPTH_LAYERS[target]

  return (
    <div>
      {/* Arc row — circles + connecting lines only, no labels */}
      <div className="flex items-center w-full">
        {layers.map((l, i) => {
          const meta      = DEPTH_LAYERS[l]
          const isAchieved = l <= achieved
          const isTarget   = l === target
          const isCurrent  = l === achieved
          return (
            <div key={l} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0 relative">
                <motion.div
                  className="rounded-full border-2 flex items-center justify-center font-mono font-bold"
                  style={{
                    width:  isCurrent ? 36 : 26,
                    height: isCurrent ? 36 : 26,
                    fontSize: isCurrent ? '0.72rem' : '0.55rem',
                    borderColor: isAchieved ? meta.color : '#e0ddd5',
                    backgroundColor: isCurrent ? meta.color : isAchieved ? meta.bgColor : '#f9f8f4',
                    color: isCurrent ? '#fff' : isAchieved ? meta.color : '#c8c4bc',
                    boxShadow: isCurrent ? `0 0 0 4px ${meta.color}22, 0 2px 10px ${meta.color}22` : 'none',
                  }}
                  animate={isCurrent ? { scale: [1, 1.07, 1] } : {}}
                  transition={{ duration: 2.4, repeat: Infinity }}
                >
                  {isAchieved && !isCurrent ? '✓' : `L${l}`}
                </motion.div>
                {/* Target arrow — sits below the circle */}
                {isTarget && (
                  <motion.div
                    className="absolute font-bold"
                    style={{ top: isCurrent ? 40 : 30, color: meta.color, fontSize: '0.5rem', lineHeight: 1 }}
                    animate={{ y: [0, 2, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    ▲
                  </motion.div>
                )}
              </div>
              {/* Connecting line — thicker when crossed */}
              {i < 3 && (
                <motion.div
                  className="flex-1 rounded-full"
                  style={{
                    height: l < achieved ? 3 : 2,
                    margin: '0 4px',
                    backgroundColor: l < achieved ? meta.color : '#e0ddd5',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Label row — current + target, always readable */}
      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #ede9e0' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currMeta.color }} />
          <span className="font-mono text-xs font-bold truncate" style={{ color: currMeta.color }}>
            L{achieved} · {currMeta.tag}
          </span>
          <span className="font-mono text-xs text-muted flex-shrink-0">— now</span>
        </div>
        {achieved !== target ? (
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            <span className="font-mono text-xs text-muted">target</span>
            <span className="font-mono text-xs font-bold" style={{ color: tgtMeta.color }}>L{target} · {tgtMeta.tag}</span>
          </div>
        ) : (
          <span className="font-mono text-xs font-bold flex-shrink-0 ml-3" style={{ color: currMeta.color }}>✓ target reached</span>
        )}
      </div>
    </div>
  )
}

// ─── Evaluation card ──────────────────────────────────────────────────────────

function EvaluationCard({
  result,
  prevDepth,
  activeGate,
  targetDepth,
  newMasteryCount,
  lang,
  onContinue,
  onStudy,
}: {
  result: EvaluateResponse
  prevDepth: DepthLayer | null
  activeGate: DepthLayer
  targetDepth: DepthLayer
  newMasteryCount: number
  lang: string
  onContinue: () => void
  onStudy: () => void
}) {
  const [showScience, setShowScience] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const cartesia = useCartesiaTTS()
  const depth = result.depthScore as DepthLayer
  const meta = DEPTH_LAYERS[depth]
  const targetMeta = DEPTH_LAYERS[targetDepth]
  const [g1, g2, g3] = gatesCleared(depth)
  const levelAdvanced = prevDepth !== null && depth > prevDepth
  const gateMastered = newMasteryCount >= MASTERY_REQUIRED
  const vision = getDepthVision(depth, targetDepth)
  const isFoundation = targetDepth === 1 || activeGate === 1

  const ctaText = gateMastered
    ? isFoundation
      ? `Foundation explored — go deeper into Layer 2! →`
      : `Gate ${activeGate - 1} mastered — keep going! →`
    : result.qualifies
    ? isFoundation
      ? `${MASTERY_REQUIRED - newMasteryCount} more question${MASTERY_REQUIRED - newMasteryCount !== 1 ? 's' : ''} to complete the foundation →`
      : `${MASTERY_REQUIRED - newMasteryCount} more crossing${MASTERY_REQUIRED - newMasteryCount !== 1 ? 's' : ''} to master this gate →`
    : `I see where to go — let me try again →`

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }} className="flex flex-col gap-5">

      {/* ── 1. APPRECIATION ── */}
      <div className="relative overflow-hidden rounded-3xl" style={{ backgroundColor: meta.color }}>
        {(gateMastered || levelAdvanced) && <RingBurst color="rgba(255,255,255,0.3)" />}
        {result.qualifies && !gateMastered && !levelAdvanced && <ValidPulse color="rgba(255,255,255,0.2)" />}
        <div className="relative z-10 p-7">
          {/* Cartesia read-aloud button */}
          {result.appreciation && (
            <button
              onClick={() => {
                if (cartesia.speaking) { cartesia.stop(); return }
                const text = [result.appreciation, result.prickText].filter(Boolean).join('. ')
                cartesia.speak(text, 'g', lang, result.qualifies ? (gateMastered ? 1.05 : 0.92) : 0.85)
              }}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                color: '#fff',
                backdropFilter: 'blur(4px)',
              }}
              title={cartesia.speaking ? 'Stop reading' : 'Listen to feedback'}
            >
              {cartesia.speaking ? (
                <motion.div className="flex gap-0.5 items-end h-4">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-0.5 rounded-full bg-white"
                      animate={{ height: ['3px','9px','3px'] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
                  ))}
                </motion.div>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              )}
            </button>
          )}
          <div className="flex items-start gap-4 mb-5">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, delay: 0.1 }}
              className="text-3xl flex-shrink-0"
            >
              {gateMastered ? '🏆' : result.qualifies ? '✦' : depth >= 3 ? '⚡' : depth >= 2 ? '🌱' : '◎'}
            </motion.div>
            <div className="flex-1 min-w-0">
              {gateMastered && (
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280 }}
                  className="font-display text-2xl font-extrabold text-white mb-2 text-bulge-white leading-tight">
                  Gate {activeGate - 1} — yours, forever.
                </motion.div>
              )}
              {result.qualifies && !gateMastered && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                  <div className="font-display text-xl font-extrabold text-white mb-1 leading-tight">
                    {levelAdvanced ? `Layer ${depth} — you crossed.` : `Crossing ${newMasteryCount} of ${MASTERY_REQUIRED} — the pattern deepens`}
                  </div>
                  {/* Slot dots — shows position in the 5-crossing journey */}
                  <div className="flex gap-1.5 mb-2">
                    {Array.from({ length: MASTERY_REQUIRED }).map((_, i) => (
                      <motion.div key={i}
                        className="h-2 rounded-full"
                        style={{ width: i < newMasteryCount ? 20 : 8, backgroundColor: i < newMasteryCount ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)' }}
                        initial={i === newMasteryCount - 1 ? { width: 8, backgroundColor: 'rgba(255,255,255,0.28)' } : false}
                        animate={i === newMasteryCount - 1 ? { width: 20, backgroundColor: 'rgba(255,255,255,0.95)' } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              {!result.qualifies && (
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-white/60 mb-1">
                    Layer {depth} · {meta.tag} · not yet crossing
                  </div>
                  {/* Non-qualifying slot state */}
                  <div className="flex gap-1.5 mb-2">
                    {Array.from({ length: MASTERY_REQUIRED }).map((_, i) => (
                      <div key={i} className="h-2 rounded-full"
                        style={{ width: i < newMasteryCount ? 20 : 8, backgroundColor: i < newMasteryCount ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.22)' }} />
                    ))}
                    <span className="font-mono text-xs text-white/50 ml-1 self-center">{newMasteryCount}/{MASTERY_REQUIRED}</span>
                  </div>
                </div>
              )}
              {result.appreciation && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-sans text-base font-medium leading-[1.8] text-white/90">
                  {result.appreciation}
                </motion.p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {GATES.map((gate, i) => {
              const cleared = [g1, g2, g3][i]
              return (
                <motion.span key={gate.id}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="font-mono text-xs px-2.5 py-1 rounded-lg font-bold"
                  style={{
                    backgroundColor: cleared ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
                    color: cleared ? '#fff' : 'rgba(255,255,255,0.48)',
                  }}
                >
                  {cleared ? '✓' : '—'} Gate {gate.id}
                </motion.span>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 2. JOURNEY ARC ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="card-premium px-6 py-5">
        <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Your depth journey</div>
        <JourneyArc achieved={depth} target={targetDepth} />
        {result.explanation && (
          <p className="font-sans text-sm text-muted leading-[1.8] mt-4 pt-4 border-t border-line">
            {result.explanation}
          </p>
        )}
      </motion.div>

      {/* ── 2b. CONTEXTUAL VISUAL — Wikipedia image ── */}
      {result.imageQuery && (
        <WikiImagePanel query={result.imageQuery} depth={depth} />
      )}

      {/* ── 3. THE PRICK — the most important moment in the app ── */}
      {result.prickText && !result.qualifies && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            borderLeft: `5px solid ${targetMeta.color}`,
            backgroundColor: targetMeta.bgColor,
            boxShadow: `0 3px 24px ${targetMeta.color}18, 0 1px 4px ${targetMeta.color}0e`,
            borderRadius: '1.25rem',
            padding: '1.75rem 1.5rem 1.75rem 1.625rem',
          }}>
          <div className="flex items-center gap-2.5 mb-4">
            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="font-sans text-lg flex-shrink-0"
              style={{ color: targetMeta.color }}
            >→</motion.div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.18em]" style={{ color: targetMeta.color }}>
              The prick · your next crossing
            </div>
          </div>
          <p className="font-display font-bold leading-[1.7]"
            style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)', color: '#1c1a14' }}>
            {result.prickText}
          </p>
        </motion.div>
      )}

      {/* ── 3b. NETI NETI — Return to study ── */}
      {!result.qualifies && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: `1.5px solid ${targetMeta.color}40`, backgroundColor: `${targetMeta.bgColor}` }}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: targetMeta.color }}>
                Neti Neti
              </span>
              <span className="font-mono text-xs" style={{ color: `${targetMeta.color}80` }}>· not this form yet</span>
            </div>
            <p className="font-sans text-sm leading-[1.85]" style={{ color: '#5a4a38' }}>
              The examiner who writes the hardest questions first reads the entire chapter.
              Return to the gate criteria — let the question form from understanding, not from effort.
              When understanding is complete, the right question arrives naturally.
            </p>
            <p className="font-sans text-xs mt-2 leading-[1.7]" style={{ color: `${targetMeta.color}90` }}>
              Daaji: <em>"Approach with the heart of a child — wonder, not effort."</em>
            </p>
          </div>
          <button
            onClick={onStudy}
            className="w-full py-3.5 font-display font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: `${targetMeta.color}18`, color: targetMeta.color, borderTop: `1px solid ${targetMeta.color}25` }}
          >
            ↑ Study the gate criteria — then return with your eureka question
          </button>
        </motion.div>
      )}

      {/* ── 4. MASTERY PROGRESS — Neural pathway ── */}
      {result.qualifies && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #faf8f4 100%)',
            border: `1.5px solid ${meta.color}22`,
            boxShadow: '0 1px 4px rgba(26,24,37,0.06)',
          }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-display font-bold text-base text-ink leading-tight">
                {isFoundation ? 'Foundation · Exploration' : `Gate ${activeGate - 1} · Neural pathway`}
              </div>
              <div className="font-mono text-xs text-muted mt-1">
                {newMasteryCount < MASTERY_REQUIRED
                  ? isFoundation
                    ? `${MASTERY_REQUIRED - newMasteryCount} more question${MASTERY_REQUIRED - newMasteryCount !== 1 ? 's' : ''} to complete`
                    : `${MASTERY_REQUIRED - newMasteryCount} crossing${MASTERY_REQUIRED - newMasteryCount !== 1 ? 's' : ''} to reflex`
                  : isFoundation ? 'Foundation mapped' : 'Pathway myelinated — this depth is reflexive'}
              </div>
            </div>
            <span className="font-display text-2xl font-extrabold leading-none" style={{ color: meta.color }}>
              {newMasteryCount}<span className="text-base font-semibold text-muted">/{MASTERY_REQUIRED}</span>
            </span>
          </div>

          <NeuralPathwayViz
            count={newMasteryCount}
            required={MASTERY_REQUIRED}
            color={meta.color}
            bgColor={meta.bgColor}
          />

          <div className="mt-6 pt-5 border-t border-line">
            <p className="font-sans text-sm leading-[1.85] text-ink/60">
              {isFoundation ? (
                newMasteryCount < MASTERY_REQUIRED ? (
                  <>You are mapping the territory — naming concepts and building the factual ground that deeper questions require. {MASTERY_REQUIRED - newMasteryCount} more question{MASTERY_REQUIRED - newMasteryCount !== 1 ? 's' : ''} and the foundation is complete.</>
                ) : (
                  <>Foundation mapped. You have named the territory five times. This is the ground all deeper inquiry grows from — Layer 2 awaits, where you begin to ask <em>why.</em></>
                )
              ) : newMasteryCount < MASTERY_REQUIRED ? (
                <>Each crossing fires the same neural circuit. Hebb's rule: <em>"neurons that fire together, wire together."</em> {MASTERY_REQUIRED - newMasteryCount} more and this depth crosses from deliberate to reflexive — your natural starting point, not an achievement.</>
              ) : (
                <>Five crossings. The pathway is now <strong>myelinated</strong> — impulse travels faster, effortlessly. Layer {activeGate - 1} thinking is no longer a conscious act. It is your baseline.</>
              )}
            </p>
            <p className="font-mono text-xs mt-2.5" style={{ color: `${meta.color}75` }}>
              {isFoundation ? 'Ausubel (1968) · meaningful learning theory' : 'Hebb (1949) · Fields (2005) · Bengtsson et al. (2005)'}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── 5. DEPTH VISION ── */}
      {vision && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex gap-4 p-5 rounded-2xl"
          style={{
            borderLeft: `4px solid ${targetMeta.color}`,
            backgroundColor: `${targetMeta.bgColor}90`,
            boxShadow: `0 1px 10px ${targetMeta.color}10`,
          }}>
          <span className="text-xl flex-shrink-0 mt-0.5">🔭</span>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: targetMeta.color }}>
              When you reach Layer {targetDepth}
            </div>
            <p className="font-sans text-sm text-ink/70 leading-[1.85]">{vision}</p>
          </div>
        </motion.div>
      )}

      {/* ── 6. HINT ── */}
      {result.hint && !result.qualifies && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          <button onClick={() => setShowHint(h => !h)}
            className="flex items-center gap-2 font-sans text-sm font-semibold text-muted hover:text-ink transition-colors w-full text-left py-1"
          >
            <motion.span animate={{ rotate: showHint ? 90 : 0 }} transition={{ duration: 0.2 }}>▶</motion.span>
            {showHint ? 'Hide depth example' : 'What does the next depth feel like? →'}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3 p-5 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: `${targetMeta.color}45`, backgroundColor: targetMeta.bgColor }}>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest mb-3" style={{ color: targetMeta.color }}>
                    Feel the depth — then ask your own version
                  </div>
                  <p className="font-sans text-sm text-ink/75 leading-[1.85] italic">{result.hint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── 7. SCIENCE ── */}
      {result.scienceInsight && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button onClick={() => setShowScience(s => !s)}
            className="flex items-center gap-2 font-sans text-sm text-muted hover:text-ink transition-colors w-full text-left py-1"
          >
            <motion.span animate={{ rotate: showScience ? 90 : 0 }} transition={{ duration: 0.2 }}>▶</motion.span>
            {showScience ? 'Hide brain science' : 'What just happened in your brain? →'}
          </button>
          <AnimatePresence>
            {showScience && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3 p-5 rounded-2xl"
                  style={{ borderLeft: `4px solid ${meta.color}`, backgroundColor: `${meta.bgColor}80` }}>
                  <p className="font-sans text-sm text-ink/70 leading-[1.85]">{result.scienceInsight}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── CTA ── */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="flex flex-col gap-2.5">
        {!result.qualifies && !gateMastered && (
          <button
            onClick={onStudy}
            className="w-full py-4 rounded-2xl font-display font-bold text-base transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: targetMeta.bgColor,
              color: targetMeta.color,
              border: `2px solid ${targetMeta.color}55`,
            }}
          >
            ↑ Study the gate · return with your eureka question
          </button>
        )}
        <button
          onClick={onContinue}
          className="w-full py-5 rounded-2xl font-display font-extrabold text-lg text-paper transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: gateMastered ? meta.color : result.qualifies ? meta.color : targetMeta.color,
            boxShadow: `0 3px 14px ${(gateMastered || result.qualifies ? meta : targetMeta).color}1e`,
            letterSpacing: '0.01em',
          }}
        >
          {ctaText}
        </button>
      </motion.div>

    </motion.div>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ session, levelMastery, safeTarget, onGoDeeper }: {
  session: Session
  levelMastery: Partial<Record<DepthLayer, number>>
  safeTarget: DepthLayer
  onGoDeeper: () => void
}) {
  const meta = DEPTH_LAYERS[safeTarget]
  const score = computePracticeScore(session.trajectoryVector, levelMastery, safeTarget)
  const scoreColor = score >= 80 ? '#1a6b3a' : score >= 60 ? '#0c447c' : '#c43d0f'
  const totalAttempts = session.trajectoryVector.length
  const qualifyingAttempts = (Object.values(levelMastery) as number[]).reduce((a, b) => a + b, 0)

  useEffect(() => {
    const end = Date.now() + 2500
    const fire = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: [meta.color, '#f9f8f4', '#ffd700'] })
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: [meta.color, '#f9f8f4', '#ffd700'] })
      if (Date.now() < end) requestAnimationFrame(fire)
    }
    fire()
  }, [meta.color])

  const HUMILITY: Record<DepthLayer, string> = {
    1: 'You named the territory with honesty. Every deep inquiry begins here.',
    2: 'You traced the cause across 5 questions. Now teach it to someone — explaining it reveals the gaps you didn\'t know you had.',
    3: 'Five edge cases navigated. Real mastery begins when someone asks you a Layer 3 question you cannot answer.',
    4: 'You questioned the system itself, five times. Layer 4 is the beginning of humility: the recognition that a better question than yours has not yet been asked.',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
      className="flex flex-col gap-6"
    >
      <div className="rounded-3xl p-7" style={{ borderLeft: `6px solid ${meta.color}`, backgroundColor: meta.bgColor }}>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <div className="font-mono text-xs font-bold tracking-widest uppercase mb-3" style={{ color: meta.color }}>
            All gates mastered · Layer {session.targetDepth} · {meta.tag}
          </div>
          <div className="font-display text-3xl font-extrabold mb-3 leading-tight" style={{ color: meta.color }}>
            {meta.headline}
          </div>
          <p className="font-sans text-base font-medium text-ink/70 leading-[1.8]">{meta.scientificBasis}</p>
        </motion.div>
      </div>

      <div className="card-premium p-7">
        <div className="font-mono text-xs text-muted uppercase tracking-widest mb-5">Practice score</div>
        <div className="flex items-end gap-5 mb-6">
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
            className="font-display leading-none text-bulge" style={{ color: scoreColor, fontSize: '5.5rem', fontWeight: 800 }}
          >
            {score}
          </motion.div>
          <div className="pb-3">
            <div className="font-mono text-xs text-muted">out of 100</div>
            <div className="font-display text-lg font-extrabold mt-0.5" style={{ color: scoreColor }}>
              {score >= 88 ? 'Exceptional' : score >= 72 ? 'Strong' : score >= 55 ? 'Solid' : 'Developing'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-line pt-5 mb-6">
          <div>
            <div className="font-mono text-xs text-muted mb-1.5">Depth</div>
            <div className="font-display text-2xl font-extrabold" style={{ color: meta.color }}>L{session.currentDepth}</div>
          </div>
          <div>
            <div className="font-mono text-xs text-muted mb-1.5">Qualifying</div>
            <div className="font-display text-2xl font-extrabold text-ink">{qualifyingAttempts}</div>
          </div>
          <div>
            <div className="font-mono text-xs text-muted mb-1.5">Total tries</div>
            <div className="font-display text-2xl font-extrabold text-ink">{totalAttempts}</div>
          </div>
        </div>

        <div className="border-t border-line pt-5 mb-5">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Gate mastery</div>
          <div className="flex flex-col gap-3">
            {([2, 3, 4] as DepthLayer[]).filter(l => l <= session.targetDepth).map(l => {
              const count = levelMastery[l] ?? 0
              const lmeta = DEPTH_LAYERS[l]
              return (
                <div key={l} className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold w-14 flex-shrink-0" style={{ color: lmeta.color }}>
                    Gate {l - 1}
                  </span>
                  <div className="flex gap-1.5 flex-1">
                    {Array.from({ length: MASTERY_REQUIRED }).map((_, i) => (
                      <div key={i} className="flex-1 h-2.5 rounded-full"
                        style={{ backgroundColor: i < count ? lmeta.color : '#e0ddd5' }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-muted">{count}/{MASTERY_REQUIRED}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="font-sans text-sm text-ink/50 leading-[1.8]">
          This score measures depth and consistency of inquiry — not intelligence. Reaching this same target again tomorrow will feel different.
        </p>
      </div>

      <div className="pl-6 py-2 rounded-r-2xl" style={{ borderLeft: `4px solid ${DEPTH_LAYERS[4].color}`, backgroundColor: `${DEPTH_LAYERS[4].bgColor}60` }}>
        <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: DEPTH_LAYERS[4].color }}>
          The humility principle
        </div>
        <p className="font-sans text-base font-medium leading-[1.8] text-ink/80">{HUMILITY[session.targetDepth]}</p>
        <p className="font-sans text-sm text-ink/50 mt-2 leading-[1.75]">
          Real strength is in helping others become more than your current state. The inquiry does not stop here.
        </p>
      </div>

      {session.targetDepth < 4 && (
        <button
          onClick={onGoDeeper}
          className="w-full py-5 rounded-2xl font-display font-extrabold text-lg text-paper transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: DEPTH_LAYERS[(session.targetDepth + 1) as DepthLayer].color,
            boxShadow: `0 3px 14px ${DEPTH_LAYERS[(session.targetDepth + 1) as DepthLayer].color}1a`,
          }}
        >
          Go deeper → Layer {session.targetDepth + 1} · {DEPTH_LAYERS[(session.targetDepth + 1) as DepthLayer].tag}
        </button>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PrickLoop({ session, onComplete }: Props) {
  const [questionText, setQuestionText] = useState('')
  const [lastResult, setLastResult] = useState<EvaluateResponse | null>(null)
  const [prevDepth, setPrevDepth] = useState<DepthLayer | null>(null)
  const [prevMasteryCount, setPrevMasteryCount] = useState(0)
  const [showInput, setShowInput] = useState(true)
  const [scanStage, setScanStage] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const studyPanelRef = useRef<HTMLDivElement>(null)
  const { addReformulation, completeSession, startSession } = useSessionStore()
  const navigate = useNavigate()

  const levelMastery = session.levelMastery ?? {}
  const safeTarget: DepthLayer = ([1, 2, 3, 4].includes(session.targetDepth) ? session.targetDepth : 3) as DepthLayer
  const activeGate = getActiveGate(levelMastery, safeTarget)
  const isFoundationSession = safeTarget === 1
  const { prefs: voicePrefs } = useVoiceSettings()
  const voiceBaseRef = useRef('')

  const handleVoiceResult = useCallback((text: string) => {
    const combined = voiceBaseRef.current ? `${voiceBaseRef.current} ${text}` : text
    setQuestionText(combined)
    voiceBaseRef.current = combined
  }, [])

  const handleVoiceInterim = useCallback((text: string) => {
    setQuestionText(text
      ? (voiceBaseRef.current ? `${voiceBaseRef.current} ${text}` : text)
      : voiceBaseRef.current
    )
  }, [])

  // STT lang = browser UI language (what the user *speaks*), not the TTS voice language.
  // Using voicePrefs.language here caused Hindi recognition when the user speaks English.
  const sttLang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'

  const { listening: voiceListening, supported: voiceSupported, start: startVoice, stop: stopVoice } = useVoiceInput(
    handleVoiceResult,
    sttLang,
    'auto',
    handleVoiceInterim,
  )
  const masteryCount = getMasteryCount(levelMastery, activeGate)
  const isComplete = isMasteryComplete(levelMastery, safeTarget)

  const evaluate = useMutation({
    mutationFn: () =>
      evaluateQuestion({
        question: questionText.trim(),
        topic: session.topic,
        appMode: session.appMode,
        examBoard: session.examBoard,
        targetDepth: session.targetDepth,
        activeGate,
        reformulationIndex: session.reformulations.length,
        previousReformulations: session.reformulations.map(r => ({
          question: r.question,
          depthScore: r.depthScore,
        })),
        vignette: session.vignette,
      }),
    onSuccess: (data) => {
      setPrevDepth(session.reformulations[session.reformulations.length - 1]?.depthScore ?? null)
      setPrevMasteryCount(masteryCount)
      setLastResult(data)
      setShowInput(false)

      const newMastery = data.qualifies
        ? Math.min(masteryCount + 1, MASTERY_REQUIRED)
        : masteryCount

      const reformulation: Reformulation = {
        id: `${Date.now()}`,
        question: questionText.trim(),
        depthScore: data.depthScore as DepthLayer,
        prickText: data.prickText,
        scienceInsight: data.scienceInsight,
        qualifiesForGate: data.qualifies ? activeGate : null,
        timestamp: Date.now(),
        isResolved: data.qualifies && newMastery >= MASTERY_REQUIRED,
      }
      addReformulation(session.id, reformulation)

      if (data.qualifies && newMastery >= MASTERY_REQUIRED) {
        const nextGate = getActiveGate(
          { ...levelMastery, [activeGate]: MASTERY_REQUIRED },
          session.targetDepth
        )
        if (nextGate === session.targetDepth && isMasteryComplete(
          { ...levelMastery, [activeGate]: MASTERY_REQUIRED },
          session.targetDepth
        )) {
          completeSession(session.id)
          onComplete?.(session)
        }
      }
    },
  })

  useEffect(() => {
    if (evaluate.isPending) {
      setScanStage(0)
      setLastResult(null)
      scanTimers.current.forEach(clearTimeout)
      scanTimers.current = [
        setTimeout(() => setScanStage(1), 80),
        setTimeout(() => setScanStage(2), 680),
        setTimeout(() => setScanStage(3), 1320),
      ]
    }
    return () => scanTimers.current.forEach(clearTimeout)
  }, [evaluate.isPending])

  useEffect(() => {
    if (showInput) setTimeout(() => textareaRef.current?.focus(), 80)
  }, [showInput])

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSubmit = () => {
    if (!questionText.trim() || evaluate.isPending) return
    evaluate.mutate()
  }

  const handleContinue = useCallback(() => {
    setShowInput(true)
    setQuestionText('')
    setLastResult(null)
  }, [])

  const handleStudy = useCallback(() => {
    studyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Brief delay so scroll completes before highlighting
    setTimeout(() => {
      studyPanelRef.current?.animate(
        [{ boxShadow: '0 0 0 3px rgba(99,102,241,0.5)' }, { boxShadow: '0 0 0 0px rgba(99,102,241,0)' }],
        { duration: 1400, easing: 'ease-out' }
      )
    }, 400)
  }, [])

  const handleGoDeeper = useCallback(() => {
    if (session.targetDepth < 4) {
      const next = (session.targetDepth + 1) as DepthLayer
      const s = startSession(session.topic, session.appMode, next, session.examBoard, session.userId ?? undefined)
      navigate(`/session/${s.id}`)
    }
  }, [navigate, session, startSession])

  if (isComplete) {
    return <CompletionScreen session={session} levelMastery={levelMastery} safeTarget={safeTarget} onGoDeeper={handleGoDeeper} />
  }

  const activeGateMeta = DEPTH_LAYERS[activeGate]
  const newMasteryAfterResult = lastResult?.qualifies ? Math.min(prevMasteryCount + 1, MASTERY_REQUIRED) : prevMasteryCount

  return (
    <div className="flex flex-col gap-6">
      <DepthMeter
        currentDepth={session.currentDepth}
        targetDepth={session.targetDepth}
        trajectoryVector={session.trajectoryVector}
      />

      {/* Clinical vignette — case-based sessions */}
      {session.vignette && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${DEPTH_LAYERS[session.targetDepth].bgColor} 0%, #fffcf4 100%)`,
            border: `1.5px solid ${DEPTH_LAYERS[session.targetDepth].color}28`,
          }}
        >
          <div className="font-mono text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: DEPTH_LAYERS[session.targetDepth].color }}>
            ⚕ Clinical vignette · {session.topic}
          </div>
          <p className="font-sans text-sm leading-[1.85]" style={{ color: '#4a3f30' }}>
            {session.vignette}
          </p>
        </motion.div>
      )}

      <div ref={studyPanelRef} style={{ borderRadius: 20 }}>
        <LevelStudyPanel
          activeGate={activeGate}
          appMode={session.appMode}
          masteryCount={masteryCount}
          topic={session.topic}
          defaultOpen={session.reformulations.length === 0}
        />
      </div>

      <AnimatePresence mode="wait">
        {evaluate.isPending ? (
          <motion.div key="scan" exit={{ opacity: 0 }}>
            <ScanAnimation question={questionText.trim()} stage={scanStage} />
          </motion.div>
        ) : lastResult && !showInput ? (
          <motion.div key="result">
            <EvaluationCard
              result={lastResult}
              prevDepth={prevDepth}
              activeGate={activeGate}
              targetDepth={safeTarget}
              newMasteryCount={newMasteryAfterResult}
              lang={voicePrefs.language}
              onContinue={handleContinue}
              onStudy={handleStudy}
            />
          </motion.div>
        ) : (
          <motion.div key="input" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col gap-4">
              <label className="font-mono text-xs text-muted uppercase tracking-widest leading-relaxed">
                {session.reformulations.length === 0
                  ? `Your first question on: `
                  : isFoundationSession
                  ? `Continue exploring: `
                  : `Reformulate — targeting Gate ${activeGate - 1}: `}
                <span className="text-ink font-bold">{session.topic}</span>
              </label>

              {/* Textarea — clean, no waveform inside */}
              <textarea
                ref={textareaRef}
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
                placeholder={
                  voiceListening
                    ? 'Listening… speak your question clearly'
                    : session.reformulations.length === 0
                    ? `Ask anything about "${session.topic}" — start anywhere, the depth will show you where you are.`
                    : isFoundationSession
                    ? `Explore anything about "${session.topic}" — every question counts at this level.`
                    : `Gate ${activeGate - 1}: ${activeGateMeta.criterionTest}`
                }
                rows={4}
                className="w-full p-5 font-sans text-base rounded-2xl bg-white resize-none focus:outline-none placeholder:text-muted/40 leading-[1.75]"
                style={{
                  border: `2px solid ${voiceListening ? activeGateMeta.color : questionText.trim() ? activeGateMeta.color : 'rgba(26,24,37,0.12)'}`,
                  boxShadow: voiceListening
                    ? `0 0 0 5px ${activeGateMeta.color}18`
                    : questionText.trim()
                    ? `0 0 0 3px ${activeGateMeta.color}0e`
                    : '0 1px 3px rgba(26,24,37,0.05)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                disabled={evaluate.isPending}
              />

              {/* Action row — mic circle + submit */}
              <div className="flex items-center gap-3">
                {/* Waveform — visible when listening */}
                <AnimatePresence mode="popLayout">
                  {voiceListening ? (
                    <motion.div
                      key="wave"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex gap-0.5 items-end overflow-hidden flex-1 min-w-0"
                    >
                      {[0,1,2,3,4,5,6,7].map(i => (
                        <motion.div key={i} className="w-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: activeGateMeta.color }}
                          animate={{ height: ['4px', `${6 + (i % 4) * 7}px`, '4px'] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.065, ease: 'easeInOut' }}
                        />
                      ))}
                      <span className="font-mono text-xs ml-2 whitespace-nowrap flex-shrink-0" style={{ color: activeGateMeta.color }}>
                        Listening…
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="count"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <span className="font-mono text-xs text-muted hidden min-[400px]:inline">Cmd+Enter</span>
                      <span className="font-mono text-xs font-bold" style={{ color: activeGateMeta.color }}>
                        {isFoundationSession ? `${masteryCount}/${MASTERY_REQUIRED} explored` : `${masteryCount}/${MASTERY_REQUIRED} qualifying`}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mic — prominent circle, voice-first CTA */}
                {voiceSupported && (
                  <motion.button
                    onMouseDown={e => {
                      e.preventDefault()
                      if (voiceListening) {
                        stopVoice()
                      } else {
                        voiceBaseRef.current = questionText
                        startVoice()
                      }
                    }}
                    className="rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      width: 52, height: 52,
                      backgroundColor: voiceListening ? activeGateMeta.color : `${activeGateMeta.color}12`,
                      color: voiceListening ? '#fff' : activeGateMeta.color,
                      border: `2px solid ${voiceListening ? 'transparent' : `${activeGateMeta.color}28`}`,
                      boxShadow: voiceListening
                        ? `0 0 0 6px ${activeGateMeta.color}1a, 0 4px 16px ${activeGateMeta.color}28`
                        : 'none',
                    }}
                    animate={voiceListening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={voiceListening ? { duration: 1.2, repeat: Infinity } : {}}
                    title={voiceListening ? 'Stop listening' : 'Speak your question'}
                  >
                    {voiceListening ? (
                      <motion.div
                        className="rounded-sm bg-white"
                        style={{ width: 14, height: 14 }}
                        animate={{ scale: [1, 0.75, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                      </svg>
                    )}
                  </motion.button>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!questionText.trim() || evaluate.isPending}
                  className="flex-shrink-0 px-6 py-3.5 rounded-xl text-paper font-display font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{
                    backgroundColor: activeGateMeta.color,
                    boxShadow: questionText.trim() ? `0 2px 8px ${activeGateMeta.color}18` : 'none',
                  }}
                >
                  Evaluate →
                </button>
              </div>

              {evaluate.isError && (
                <p className="font-sans text-sm text-red-600 font-medium leading-relaxed">
                  Error: {(evaluate.error as Error).message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {session.reformulations.length > 0 && (
        <div className="border-t border-line pt-5">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">
            Inquiry history · {session.reformulations.length} attempt{session.reformulations.length !== 1 ? 's' : ''}
          </div>
          <div className="flex flex-col gap-3">
            {session.reformulations.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }} className="flex gap-3 items-start"
              >
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                    style={{
                      backgroundColor: DEPTH_LAYERS[r.depthScore].bgColor,
                      color: DEPTH_LAYERS[r.depthScore].color,
                      border: `1px solid ${DEPTH_LAYERS[r.depthScore].color}30`,
                    }}
                  >
                    L{r.depthScore}
                  </span>
                  {r.qualifiesForGate && (
                    <span className="font-mono text-xs font-bold" style={{ color: DEPTH_LAYERS[r.qualifiesForGate].color }}>✓</span>
                  )}
                </div>
                <p className="font-sans text-sm text-ink/60 leading-[1.75]">{r.question}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
