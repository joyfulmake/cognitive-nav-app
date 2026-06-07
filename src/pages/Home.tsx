import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppMode, ExamBoard, DepthLayer } from '../core/types'
import { DEPTH_LAYERS, GATES } from '../core/depthRubric'
import { useSessionStore } from '../stores/sessionStore'
import { useUserStore } from '../stores/userStore'
import { getSuggestions } from '../core/topicSuggestions'
import { useVoiceInput } from '../lib/useVoiceInput'
import { DemoFlow } from '../components/DemoFlow'
import { WisdomResources } from '../components/WisdomResources'
import { AuthPanel } from '../components/AuthPanel'

const EXAM_BOARDS: { value: ExamBoard; label: string }[] = [
  { value: 'general', label: 'General (no board)' },
  { value: 'mbbs-y1', label: 'MBBS Year 1' },
  { value: 'mbbs-y2', label: 'MBBS Year 2' },
  { value: 'neet-ug', label: 'NEET UG' },
  { value: 'neet-pg', label: 'NEET PG' },
  { value: 'neet-ss', label: 'NEET SS' },
  { value: 'usmle-1', label: 'USMLE Step 1' },
  { value: 'usmle-2', label: 'USMLE Step 2' },
  { value: 'usmle-3', label: 'USMLE Step 3' },
  { value: 'plab', label: 'PLAB' },
]

const INTELLIGENCE_COLORS: Record<string, string> = {
  IQ: '#0c447c',
  EQ: '#1a6b3a',
  Spatial: '#7c2d96',
}

// Example questions for each level by mode — make the depth immediately tangible
const LEVEL_EXAMPLES: Record<AppMode, Record<DepthLayer, string>> = {
  epistemic: {
    1: '"What is photosynthesis?"',
    2: '"Why does ATP synthesis require a proton gradient?"',
    3: '"What if Complex I is inhibited — does substrate-level phosphorylation in glycolysis compensate for the ATP deficit?"',
    4: '"Why did evolution use a proton gradient for ATP synthesis rather than direct chemical synthesis — what does this reveal about the thermodynamic logic of life?"',
  },
  clinical: {
    1: '"What is bilirubin?"',
    2: '"Why does hemolysis specifically raise unconjugated bilirubin?"',
    3: '"What if a patient has simultaneous haemolysis and hepatocellular damage — how do the two bilirubin fractions compete and what do labs show?"',
    4: '"Why does the body produce unconjugated bilirubin as an intermediate at all — what evolutionary tradeoff between heme recycling efficiency and neurotoxicity risk does this design reveal?"',
  },
}

export function Home() {
  const navigate = useNavigate()
  const { startSession } = useSessionStore()
  const { userId, name, preferredMode, preferredExamBoard, initProfile } = useUserStore()

  const [appMode, setAppMode] = useState<AppMode>(preferredMode)
  const [topic, setTopic] = useState('')
  const [examBoard, setExamBoard] = useState<ExamBoard>(preferredExamBoard)
  const [targetDepth, setTargetDepth] = useState<DepthLayer>(1)
  const [showRules, setShowRules] = useState(false)
  const topicInputRef = useRef<HTMLInputElement>(null)
  const voiceBaseRef  = useRef('')   // text in field at the moment mic was clicked
  // onResult: called when Web Speech finalises OR Whisper returns — append to field
  const handleVoiceResult = useCallback((text: string) => {
    const combined = voiceBaseRef.current ? `${voiceBaseRef.current} ${text}` : text
    setTopic(combined)
    voiceBaseRef.current = combined   // next utterance appends to this
  }, [])

  // onInterim: live partial text from Web Speech — show in field immediately; '' = clear interim
  const handleVoiceInterim = useCallback((text: string) => {
    setTopic(text
      ? (voiceBaseRef.current ? `${voiceBaseRef.current} ${text}` : text)
      : voiceBaseRef.current
    )
  }, [])

  // STT lang = browser UI language (what the user *speaks*), not the TTS voice language preference.
  // Using voicePrefs.language here caused Hindi recognition when the user speaks English.
  const sttLang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'

  // 'auto' mode: tries Web Speech (interim results live) first; falls back to Whisper on network/permission error
  const { listening, transcribing, supported: voiceSupported, start: startVoice, stop: stopVoice } = useVoiceInput(
    handleVoiceResult,
    sttLang,
    'auto',
    handleVoiceInterim,
  )

  const suggestions = useMemo(
    () => getSuggestions(appMode, appMode === 'clinical' ? examBoard : undefined, 8),
    [appMode, examBoard]
  )

  const handleStart = async () => {
    if (!topic.trim()) return
    let uid = userId
    if (!uid) {
      await initProfile()
      uid = useUserStore.getState().userId
    }
    const session = startSession(
      topic.trim(), appMode, targetDepth,
      appMode === 'clinical' ? examBoard : undefined,
      uid ?? undefined
    )
    navigate(`/session/${session.id}`)
  }

  const targetMeta = DEPTH_LAYERS[targetDepth]

  // Always start at top — prevent browser scroll restoration
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [])

  // Guided tour — refs and state
  const demoSectionRef = useRef<HTMLElement>(null)
  const playSectionRef = useRef<HTMLElement>(null)
  const [tourDismissed, setTourDismissed] = useState(false)
  const [tourStep, setTourStep] = useState(0) // 0=waiting, 1=demo, 2=play

  useEffect(() => {
    if (tourDismissed) return
    // After 2.2s scroll to demo and advance tour
    const t1 = setTimeout(() => {
      setTourStep(1)
      demoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 2200)
    return () => clearTimeout(t1)
  }, [tourDismissed]) // eslint-disable-line

  return (
    <div className="min-h-screen">

      {/* Depth-reactive ambient nature light — sits behind page content via z-index: -1 */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', width: 520, height: 420,
          top: '-60px', left: '-80px', borderRadius: '50%',
          background: `radial-gradient(circle at 40% 40%, ${targetMeta.color}18, transparent 62%)`,
          filter: 'blur(56px)', transition: 'background 1.4s ease',
          animation: 'float-orb 13s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 360, height: 340,
          top: '40%', right: '-70px', borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(184,106,20,0.13), transparent 62%)',
          filter: 'blur(48px)',
          animation: 'float-orb 9s ease-in-out infinite',
          animationDelay: '-4.5s',
        }} />
        <div style={{
          position: 'absolute', width: 280, height: 240,
          top: '66%', left: '15%', borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%, ${targetMeta.color}12, transparent 62%)`,
          filter: 'blur(40px)', transition: 'background 1.4s ease',
          animation: 'float-orb 16s ease-in-out infinite',
          animationDelay: '-9s',
        }} />
        <div style={{
          position: 'absolute', width: 200, height: 200,
          top: '20%', left: '55%', borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(26,107,58,0.09), transparent 62%)',
          filter: 'blur(36px)',
          animation: 'float-orb 11s ease-in-out infinite',
          animationDelay: '-2s',
        }} />
      </div>

      <div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">

        {/* ── HERO ── */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <div className="font-mono text-xs font-bold tracking-[0.22em] uppercase mb-5"
              style={{ color: targetMeta.color }}>
              Silently · Deeply · Becoming
            </div>

            <h1 className="font-display leading-[1.05] mb-5 text-bulge"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', fontWeight: 700, color: '#1c1a14', animation: 'breathe 5s ease-in-out infinite' }}>
              Cognitive
              <br />
              <span className="text-bulge-color" style={{ color: targetMeta.color }}>Nav</span>
            </h1>

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-5"
              style={{ backgroundColor: targetMeta.bgColor, color: targetMeta.color, border: `1.5px solid ${targetMeta.color}30` }}>
              <span className="font-sans text-sm font-bold">
                {appMode === 'epistemic' ? '✦ General Epistemic' : '⚕ Clinical Crucible'}
              </span>
            </div>

            <p className="font-sans text-xl font-medium leading-[1.85] max-w-xs mx-auto"
              style={{ color: '#7a6858', letterSpacing: '0.01em' }}>
              The question <em>is</em> the practice.
              <br />
              The depth finds itself.
            </p>

            {name && (
              <p className="font-sans text-base mt-4" style={{ color: '#8a7d6e' }}>
                Welcome back, <strong>{name}</strong>.
              </p>
            )}

            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              onClick={() => demoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-7 inline-flex items-center gap-2.5 font-sans font-semibold text-sm px-6 py-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${targetMeta.color} 0%, ${targetMeta.color}cc 100%)`,
                color: '#fff',
                boxShadow: `0 4px 20px ${targetMeta.color}38, 0 1px 4px ${targetMeta.color}20`,
                letterSpacing: '0.01em',
                transition: 'background 0.8s ease, box-shadow 0.8s ease',
              }}
              whileHover={{ scale: 1.03, translateY: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              See it live
              <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>↓</motion.span>
            </motion.button>
          </motion.div>
        </header>

        {/* ── DEMO — first thing after hero ── */}
        <motion.section
          ref={demoSectionRef}
          id="demo"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10"
          style={{ scrollMarginTop: '1.5rem' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-xs font-bold tracking-widest uppercase" style={{ color: targetMeta.color }}>
              Live demo · see it play
            </div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: targetMeta.color }}
            />
          </div>
          <DemoFlow appMode={appMode} />
        </motion.section>

        {/* ── THE CORE IDEA ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <div className="card-premium p-7">
            <div className="font-mono text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8a7d6e' }}>
              What happens here
            </div>
            <p className="font-display font-extrabold leading-[1.3] mb-7"
              style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)', color: '#1c1a14' }}>
              Most tools give you things to remember.
              <br />
              This one grows how you think.
            </p>
            <div className="flex flex-col gap-6">
              {[
                {
                  n: '01',
                  color: DEPTH_LAYERS[1].color,
                  bg: DEPTH_LAYERS[1].bgColor,
                  title: 'The depth of your question is the depth of your understanding.',
                  body: 'Ask at Layer 1 and you name things. Ask at Layer 4 and you question why the system was designed at all. The four depths are measured, not guessed.',
                },
                {
                  n: '02',
                  color: DEPTH_LAYERS[2].color,
                  bg: DEPTH_LAYERS[2].bgColor,
                  title: 'The AI reads your question, not your answer.',
                  body: 'You ask. The system reveals which depth layer your question reached. When it hasn\'t gone deep enough, you receive a prick — a precise pointer to exactly what was missing.',
                },
                {
                  n: '03',
                  color: DEPTH_LAYERS[3].color,
                  bg: DEPTH_LAYERS[3].bgColor,
                  title: 'Five crossings at any depth makes it permanent.',
                  body: 'One good question is a moment. Five qualifying questions at a depth wires it into white matter — you no longer choose to think that way. You simply do.',
                },
              ].map(item => (
                <div key={item.n} className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: item.color }}>
                    {item.n}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-sm text-ink mb-1.5 leading-snug"
                      style={{ letterSpacing: '0.005em' }}>{item.title}</div>
                    <p className="font-sans text-sm leading-[1.9]" style={{ color: '#7a6858' }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── APP MODE ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3"
        >
          <div className="flex gap-3">
            {(['epistemic', 'clinical'] as AppMode[]).map(mode => {
              const active = appMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => setAppMode(mode)}
                  className="flex-1 py-5 px-5 rounded-2xl text-left transition-all duration-200 font-sans"
                  style={{
                    background: active ? '#1c1a14' : 'linear-gradient(135deg, #fffcf4 0%, #faf4e6 100%)',
                    boxShadow: active
                      ? '0 2px 10px rgba(28,26,20,0.14), 0 1px 3px rgba(28,26,20,0.08)'
                      : '0 1px 3px rgba(28,26,20,0.06), 0 3px 10px rgba(28,26,20,0.04)',
                    border: `1.5px solid ${active ? '#1c1a14' : 'rgba(28,26,20,0.09)'}`,
                    transform: active ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <div className="font-display font-extrabold text-lg leading-tight"
                    style={{ color: active ? '#fff' : '#1c1a14' }}>
                    {mode === 'epistemic' ? 'General Epistemic' : 'Clinical Crucible'}
                  </div>
                  <div className="font-sans text-sm mt-1 leading-[1.6]"
                    style={{ color: active ? 'rgba(255,255,255,0.60)' : '#8a7d6e' }}>
                    {mode === 'epistemic' ? 'Any topic · Universal depth engine' : 'Medical · NEET, USMLE, PLAB calibrated'}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="font-sans text-xs mt-3 leading-[1.7]" style={{ color: '#8a8480' }}>
            Clinical Crucible uses the exact same four-depth question engine as General Epistemic —
            the only difference is that topics are medical and evaluation is calibrated to NEET, USMLE and PLAB exams.
            The depth magic is identical.
          </p>
        </motion.section>

        {/* ── EXAM BOARD ── */}
        <AnimatePresence>
          {appMode === 'clinical' && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-7"
            >
              <label className="block font-sans text-sm font-semibold mb-2.5" style={{ color: '#7a6858' }}>
                Exam board calibration
              </label>
              <select
                value={examBoard}
                onChange={e => setExamBoard(e.target.value as ExamBoard)}
                className="w-full rounded-2xl py-4 px-5 font-sans text-base bg-white focus:outline-none transition-all"
                style={{
                  border: '1.5px solid rgba(26,24,37,0.12)',
                  boxShadow: '0 1px 3px rgba(26,24,37,0.05)',
                  color: '#1c1a14',
                }}
              >
                {EXAM_BOARDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── THE FOUR DEPTHS — target selector + level guide ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-7"
        >
          <div className="font-sans text-base font-bold mb-4" style={{ color: '#1c1a14', letterSpacing: '0.01em' }}>
            Choose your depth
          </div>

          <div className="flex flex-col gap-3">
            {([1, 2, 3, 4] as DepthLayer[]).map(layer => {
              const meta = DEPTH_LAYERS[layer]
              const isSelected = targetDepth === layer
              const example = LEVEL_EXAMPLES[appMode][layer]
              return (
                <motion.button
                  key={layer}
                  onClick={() => setTargetDepth(layer)}
                  whileHover={{ translateX: 2 }}
                  whileTap={{ scale: 0.99 }}
                  animate={isSelected ? {
                    boxShadow: [
                      `0 4px 20px ${meta.color}28, 0 1px 4px ${meta.color}18`,
                      `0 6px 30px ${meta.color}42, 0 2px 8px ${meta.color}28`,
                      `0 4px 20px ${meta.color}28, 0 1px 4px ${meta.color}18`,
                    ],
                  } : {}}
                  transition={isSelected ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
                  className="rounded-2xl p-5 text-left relative"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)`
                      : 'linear-gradient(135deg, #fffcf4 0%, #faf4e6 100%)',
                    boxShadow: isSelected
                      ? `0 4px 20px ${meta.color}28, 0 1px 4px ${meta.color}18`
                      : '0 1px 3px rgba(28,26,20,0.06), 0 2px 8px rgba(28,26,20,0.03)',
                    border: `2px solid ${isSelected ? meta.color : 'rgba(28,26,20,0.08)'}`,
                    transform: isSelected ? 'translateX(2px)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className="font-display font-extrabold leading-none text-bulge"
                        style={{ fontSize: '2rem', color: isSelected ? '#fff' : meta.color }}
                      >
                        {layer}
                      </div>
                      {isSelected && (
                        <span className="font-mono text-xs font-bold mt-1 px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: '0.55rem' }}>
                          SET
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="font-display font-extrabold text-base leading-tight"
                          style={{ color: isSelected ? '#fff' : '#1c1a14' }}
                        >
                          {meta.tag}
                        </div>
                        <div
                          className="font-sans text-xs"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.65)' : '#8a7d6e' }}
                        >
                          — {meta.headline}
                        </div>
                      </div>
                      <p className="font-sans text-sm leading-[1.7] mb-2"
                        style={{ color: isSelected ? 'rgba(255,255,255,0.80)' : '#7a6858' }}>
                        {meta.description}
                      </p>
                      <div className="rounded-xl px-3 py-2"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.12)' : meta.bgColor,
                          border: `1px solid ${isSelected ? 'rgba(255,255,255,0.18)' : meta.color + '25'}`,
                        }}>
                        <div className="font-mono text-xs mb-1"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.55)' : meta.color }}>
                          Example question at this depth:
                        </div>
                        <p className="font-sans text-xs italic leading-[1.65]"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : '#1c1a14' }}>
                          {example}
                        </p>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {meta.builds.map(b => (
                          <span key={b} className="font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.18)' : `${INTELLIGENCE_COLORS[b]}14`,
                              color: isSelected ? 'rgba(255,255,255,0.88)' : INTELLIGENCE_COLORS[b],
                              fontSize: '0.6rem',
                            }}>
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Target criterion */}
          <motion.div
            key={targetDepth}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-5 py-4 rounded-2xl"
            style={{ backgroundColor: targetMeta.bgColor, border: `1.5px solid ${targetMeta.color}22` }}
          >
            <p className="font-sans text-sm leading-[1.75]" style={{ color: targetMeta.color }}>
              <strong>Your challenge:</strong> {targetMeta.criterionTest}
            </p>
          </motion.div>
        </motion.section>

        {/* ── THE GATES — standalone accordion, CSS max-height toggle ── */}
        <div className="mb-7">
          <button
            type="button"
            onClick={() => setShowRules(r => !r)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200"
            style={{
              background: showRules
                ? `linear-gradient(135deg, ${targetMeta.bgColor} 0%, ${targetMeta.bgColor} 100%)`
                : 'linear-gradient(135deg, #fff 0%, #faf8f4 100%)',
              border: `1.5px solid ${showRules ? targetMeta.color + '50' : 'rgba(26,24,37,0.10)'}`,
              boxShadow: showRules
                ? `0 2px 10px ${targetMeta.color}14`
                : '0 1px 3px rgba(26,24,37,0.06)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[2, 3, 4].map(l => (
                  <div key={l} className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: DEPTH_LAYERS[l as DepthLayer].color }} />
                ))}
              </div>
              <span className="font-sans text-sm font-bold" style={{ color: '#1c1a14' }}>
                Three gates — how depth is measured
              </span>
            </div>
            <span
              className="font-mono text-sm font-bold transition-all duration-200"
              style={{
                color: showRules ? targetMeta.color : '#8a7d6e',
                display: 'inline-block',
                transform: showRules ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▾
            </span>
          </button>

          {/* CSS max-height accordion — content always in DOM, never unmounts */}
          <div
            style={{
              maxHeight: showRules ? '2000px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="card-premium p-6 mt-3">
              <div className="font-display font-extrabold text-base mb-2" style={{ color: '#1c1a14' }}>
                Three gates. Scientific. Inarguable.
              </div>
              <p className="font-sans text-sm text-muted leading-[1.75] mb-5">
                Each gate has a single, measurable criterion. The AI checks it strictly. Borderline questions are classified lower — always.
              </p>
              <div className="flex flex-col gap-5">
                {GATES.map((gate, i) => {
                  const gd = (i + 2) as DepthLayer
                  const gdMeta = DEPTH_LAYERS[gd]
                  return (
                    <div key={gate.id} className="flex gap-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-display font-extrabold text-sm text-white"
                        style={{ backgroundColor: gdMeta.color, boxShadow: `0 2px 10px ${gdMeta.color}40` }}>
                        {gate.id}
                      </div>
                      <div>
                        <div className="font-sans font-bold text-sm mb-1" style={{ color: gdMeta.color }}>
                          {gate.label} — {DEPTH_LAYERS[gd - 1 as DepthLayer].tag} → {gdMeta.tag}
                        </div>
                        <p className="font-sans text-sm leading-[1.8]" style={{ color: '#7a6858' }}>
                          {gate.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 pt-5 border-t" style={{ borderColor: '#ede9e0' }}>
                <p className="font-sans text-sm leading-[1.8]" style={{ color: '#8a7d6e' }}>
                  5 qualifying questions per gate to master it. Mastery means the depth is now your natural baseline — not a challenge, a habit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* demo section moved — see below after What is this game? */}

        {/* ── AUTH STATUS — compact sync prompt ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-6"
        >
          <AuthPanel compact />
        </motion.section>

        {/* ── WHY PRACTICE WORKS ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div className="card-premium p-7">
            <div className="font-mono text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#8a7d6e' }}>
              Why consistency changes everything
            </div>
            <p className="font-display font-extrabold text-xl leading-[1.35] mb-6" style={{ color: '#1c1a14' }}>
              Each question fires a neural circuit.
              <br />
              Five firings wire it permanently.
            </p>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3 mb-6">
              {[
                { n: '1×', label: 'First crossing', desc: 'Pathway opens', color: DEPTH_LAYERS[2].color, bg: DEPTH_LAYERS[2].bgColor },
                { n: '5×', label: 'Gate mastered', desc: 'Pathway myelinated', color: DEPTH_LAYERS[3].color, bg: DEPTH_LAYERS[3].bgColor },
                { n: '∞', label: 'Reflexive', desc: 'This depth is yours', color: DEPTH_LAYERS[4].color, bg: DEPTH_LAYERS[4].bgColor },
              ].map(item => (
                <div key={item.n} className="flex min-[380px]:flex-col items-center min-[380px]:items-center gap-4 min-[380px]:gap-0 text-left min-[380px]:text-center p-4 rounded-2xl"
                  style={{ backgroundColor: item.bg, border: `1.5px solid ${item.color}20` }}>
                  <div className="font-display font-extrabold text-2xl text-bulge flex-shrink-0 min-[380px]:mb-1.5" style={{ color: item.color }}>
                    {item.n}
                  </div>
                  <div>
                    <div className="font-sans text-xs font-bold text-ink leading-tight">{item.label}</div>
                    <div className="font-sans text-xs text-muted mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="font-sans text-sm leading-[1.85]" style={{ color: '#7a6858' }}>
              Hebb (1949) showed that co-activated neurons build permanent synaptic bonds — <em>"fire together, wire together."</em> Bengtsson et al. (2005) confirmed that deliberate cognitive practice measurably increases white matter density. The 5-question gate is not arbitrary: it is the threshold at which a thinking pattern shifts from deliberate to reflexive, at any depth.
            </p>
          </div>
        </motion.section>

        {/* ── TOPIC ── */}
        <motion.section
          ref={playSectionRef}
          id="play"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-5"
          style={{ scrollMarginTop: '2rem' }}
        >
          <label className="block font-sans text-base font-bold mb-3" style={{ color: '#1c1a14' }}>
            Choose your topic
          </label>

          <div className="relative">
            <input
              ref={topicInputRef}
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder={
                appMode === 'epistemic'
                  ? 'e.g. Quantum entanglement, TCP/IP, Keynesian economics…'
                  : 'e.g. Jaundice pathophysiology, Acute MI management…'
              }
              className="w-full rounded-2xl py-4 px-5 font-sans text-base bg-white transition-all focus:outline-none"
              style={{
                border: `2px solid ${topic.trim() ? targetMeta.color : 'rgba(26,24,37,0.12)'}`,
                boxShadow: topic.trim()
                  ? `0 0 0 4px ${targetMeta.color}12, 0 2px 8px rgba(26,24,37,0.06)`
                  : '0 1px 3px rgba(26,24,37,0.05)',
                color: '#1c1a14',
                fontSize: '16px',
                lineHeight: '1.6',
                paddingRight: voiceSupported ? '3.5rem' : '1.25rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            {/* Mic button — prominent circle */}
            {voiceSupported && (
              <motion.button
                onMouseDown={e => {
                  e.preventDefault()
                  if (listening || transcribing) {
                    stopVoice()
                  } else {
                    voiceBaseRef.current = topic   // anchor: interim will append to this
                    startVoice()
                  }
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all"
                style={{
                  width: 44, height: 44,
                  backgroundColor: listening ? targetMeta.color : 'rgba(26,24,37,0.06)',
                  color: listening ? '#fff' : '#8a7d6e',
                  boxShadow: listening ? `0 0 0 5px ${targetMeta.color}18, 0 2px 12px ${targetMeta.color}35` : 'none',
                }}
                animate={listening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={listening ? { duration: 1.2, repeat: Infinity } : {}}
                title={listening ? 'Stop recording' : 'Speak your topic'}
              >
                {listening ? (
                  <motion.div
                    className="rounded-sm bg-white"
                    style={{ width: 12, height: 12 }}
                    animate={{ scale: [1, 0.7, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                  </svg>
                )}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {(listening || transcribing) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="flex items-center gap-3 px-1 py-2 rounded-xl"
                  style={{ backgroundColor: `${targetMeta.color}0c` }}>
                  {transcribing ? (
                    <>
                      <motion.div
                        className="ml-1 rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: targetMeta.color }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <span className="font-mono text-xs font-bold" style={{ color: targetMeta.color }}>
                        Processing…
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-1 items-end ml-1">
                        {[0,1,2,3,4,5].map(i => (
                          <motion.div key={i} className="w-1 rounded-full"
                            style={{ backgroundColor: targetMeta.color }}
                            animate={{ height: ['4px', `${7 + (i % 3) * 7}px`, '4px'] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.09 }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-xs font-bold" style={{ color: targetMeta.color }}>
                        Listening — speak, then pause
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          <div className="mt-4">
            <div className="font-sans text-sm mb-2.5" style={{ color: '#8a7d6e' }}>Quick start:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.025 }}
                  whileHover={{ scale: 1.03, translateY: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTopic(s.label)}
                  className="font-sans text-sm font-semibold px-4 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: topic === s.label ? targetMeta.color : '#fff',
                    color: topic === s.label ? '#fff' : '#7a6858',
                    border: `1.5px solid ${topic === s.label ? targetMeta.color : 'rgba(26,24,37,0.10)'}`,
                    boxShadow: topic === s.label
                      ? `0 2px 14px ${targetMeta.color}38`
                      : '0 1px 3px rgba(26,24,37,0.05)',
                    lineHeight: '1.5',
                  }}
                >
                  {s.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── BEGIN BUTTON ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <motion.button
            onClick={handleStart}
            disabled={!topic.trim()}
            whileHover={topic.trim() ? { translateY: -2 } : {}}
            whileTap={topic.trim() ? { scale: 0.98 } : {}}
            className="w-full py-5 rounded-2xl font-display font-extrabold text-xl text-white transition-all disabled:opacity-40"
            style={{
              backgroundColor: topic.trim() ? targetMeta.color : '#c8c4bc',
              boxShadow: topic.trim()
                ? `0 3px 14px ${targetMeta.color}20, 0 1px 4px ${targetMeta.color}12`
                : 'none',
            }}
          >
            {topic.trim()
              ? `Begin inquiry → Layer ${targetDepth} · ${targetMeta.tag}`
              : 'Choose a topic above to begin'}
          </motion.button>
        </motion.section>

        <div className="flex items-center justify-center gap-6">
          <Link to="/history"
            className="font-sans text-sm font-semibold transition-colors"
            style={{ color: '#8a7d6e' }}>
            View your inquiry history →
          </Link>
          <span style={{ color: '#e0ddd5' }}>·</span>
          <Link to="/about"
            className="font-sans text-sm font-semibold transition-colors"
            style={{ color: targetMeta.color }}>
            About this game →
          </Link>
        </div>

        {/* ── WISDOM RESOURCES ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <WisdomResources />
        </motion.section>

        {/* ── VEDIC FOUNDATION ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-block px-7 py-6 rounded-3xl"
            style={{ backgroundColor: `${DEPTH_LAYERS[4].color}08`, border: `1.5px solid ${DEPTH_LAYERS[4].color}20` }}>
            <div className="font-devanagari text-2xl font-semibold mb-3 leading-[1.6]"
              style={{ color: DEPTH_LAYERS[4].color }}>
              तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया
            </div>
            <p className="font-sans text-sm leading-[1.8] max-w-xs mx-auto"
              style={{ color: `${DEPTH_LAYERS[4].color}bb` }}>
              Bhagavad Gita 4.34 — Knowledge through approach, deep investigative inquiry, and service.
            </p>
          </div>

          <div className="mt-7 max-w-sm mx-auto">
            <p className="font-sans text-sm leading-[1.85] italic" style={{ color: '#8a7d6e' }}>
              "The naive become great through sincere inquiry.
              The great become greater by helping others surpass them."
            </p>
          </div>
        </motion.footer>

      </div>

      {/* ── Floating guide tour ── */}
      <AnimatePresence>
        {!tourDismissed && tourStep > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, pointerEvents: 'auto',
              background: 'rgba(28,26,20,0.92)',
              backdropFilter: 'blur(12px)',
              borderRadius: 40,
              padding: '10px 8px 10px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)',
              border: '1px solid rgba(255,255,255,0.08)',
              minWidth: 0,
              maxWidth: 'calc(100vw - 40px)',
            }}
          >
            {/* Section dots */}
            {[
              { label: 'Demo', step: 1, ref: demoSectionRef },
              { label: 'Play', step: 2, ref: playSectionRef },
            ].map(({ label, step, ref: sRef }) => (
              <button
                key={step}
                onClick={() => {
                  setTourStep(step)
                  sRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: tourStep === step ? targetMeta.color : 'rgba(255,255,255,0.12)',
                  border: 'none', cursor: 'pointer',
                  padding: '4px 10px', borderRadius: 20,
                  transition: 'background 0.25s',
                }}
              >
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700,
                  color: tourStep === step ? '#fff' : 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.04em',
                }}>
                  {label}
                </span>
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
            <button
              onClick={() => setTourDismissed(true)}
              style={{
                fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none',
                cursor: 'pointer', padding: '4px 8px', borderRadius: 20,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
