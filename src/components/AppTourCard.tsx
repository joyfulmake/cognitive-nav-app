import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDES = [
  {
    phase: 'Ask',
    icon: '✍',
    headline: 'Ask any question, on any topic',
    sub: 'General knowledge, medical, engineering — anything. Speak or type, in 18 languages.',
    preview: (
      <div className="rounded-xl p-4" style={{ background: '#fdf8f0', border: '1.5px solid #e4dace' }}>
        <div className="font-mono text-xs mb-2" style={{ color: '#b86a14' }}>TOPIC · Cardiac physiology</div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#fff', border: '1.5px solid #b86a14', boxShadow: '0 0 0 3px rgba(184,106,20,0.08)' }}>
          <span className="font-sans text-sm leading-snug" style={{ color: '#1c1a14' }}>
            Why does the heart need coronary arteries to supply the myocardium?
          </span>
        </div>
        <div className="mt-2 flex justify-end">
          <div className="px-3 py-1 rounded-full font-sans text-xs font-bold" style={{ background: '#b86a14', color: '#fff' }}>Submit →</div>
        </div>
      </div>
    ),
  },
  {
    phase: 'Measure',
    icon: '⚡',
    headline: 'AI measures the depth — instantly',
    sub: 'Not right or wrong. How deep. L1 (name it) → L4 (question why it was designed this way at all).',
    preview: (
      <div className="rounded-xl p-4" style={{ background: '#fdf8f0', border: '1.5px solid #e4dace' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold" style={{ background: '#edf4fa', color: '#1a5c8a' }}>L2 · Relational</div>
          <span className="font-sans text-xs" style={{ color: '#8a7d6e' }}>Mechanism traced — Gate 1 in progress</span>
        </div>
        <div className="rounded-lg px-3 py-2.5" style={{ background: '#fff8f0', border: '1.5px solid #b86a1430' }}>
          <div className="font-mono text-xs font-bold mb-1" style={{ color: '#b86a14' }}>THE PRICK</div>
          <p className="font-sans text-sm leading-relaxed" style={{ color: '#3a2f1e' }}>
            You've traced supply. What specific property of myocardial cells makes them unable to survive even brief ischaemia?
          </p>
        </div>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 0, 0, 0].map((v, i) => (
            <div key={i} className="flex-1 rounded-full" style={{ height: 4, background: v ? '#1a5c8a' : '#e4dace' }} />
          ))}
        </div>
        <div className="font-mono text-xs mt-1" style={{ color: '#8a7d6e' }}>2 / 5 to Gate 1</div>
      </div>
    ),
  },
  {
    phase: 'Master',
    icon: '✦',
    headline: 'Five crossings wire it permanently',
    sub: 'Hebb (1949): neurons that fire together five times wire together. The gate isn\'t game design. It\'s neuroscience.',
    preview: (
      <div className="rounded-xl p-4" style={{ background: '#fdf8f0', border: '1.5px solid #e4dace' }}>
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.6 }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: '#1a5c8a', color: '#fff' }}
          >✓</motion.div>
          <div>
            <div className="font-sans text-sm font-bold" style={{ color: '#1c1a14' }}>Gate 1 Mastered</div>
            <div className="font-mono text-xs" style={{ color: '#8a7d6e' }}>Mechanism thinking — now reflexive</div>
          </div>
        </div>
        <div className="flex gap-1.5 mb-2">
          {[1, 1, 1, 1, 1].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.07, duration: 0.25 }}
              className="flex-1 rounded-full"
              style={{ height: 6, background: '#1a5c8a', transformOrigin: 'left' }}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {['L1 ✓', 'L2 ✓', 'L3 →'].map((l, i) => (
            <div key={i} className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: i < 2 ? '#edf4fa' : '#f5f5f5', color: i < 2 ? '#1a5c8a' : '#8a7d6e' }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export function AppTourCard() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 3200)
    return () => clearInterval(t)
  }, [paused])

  const slide = SLIDES[idx]

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(150deg, #1c1a14 0%, #2a261d 70%, rgba(28,90,138,0.18) 100%)',
        boxShadow: '0 8px 40px rgba(28,26,20,0.18), 0 2px 8px rgba(28,26,20,0.1), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="font-mono text-xs font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          How it works
        </div>
        <button
          onClick={() => setPaused(p => !p)}
          className="font-mono text-xs px-2 py-0.5 rounded"
          style={{ color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.06)' }}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 px-5 mb-4">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setPaused(true) }}
            className="flex-1 py-1.5 rounded-lg font-mono text-xs font-bold transition-all"
            style={{
              background: i === idx ? 'rgba(255,255,255,0.13)' : 'transparent',
              color: i === idx ? '#fff' : 'rgba(255,255,255,0.32)',
              border: i === idx ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            }}
          >
            <span className="mr-1">{s.icon}</span>{s.phase}
          </button>
        ))}
      </div>

      {/* Slide content */}
      <div className="px-5 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
          >
            <p className="font-sans text-sm font-semibold mb-1" style={{ color: '#fff' }}>
              {slide.headline}
            </p>
            <p className="font-sans text-xs mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {slide.sub}
            </p>
            <div className="transform scale-[0.92] origin-top-left" style={{ width: '109%' }}>
              {slide.preview}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-4 justify-center">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === idx ? 20 : 6, opacity: i === idx ? 1 : 0.3 }}
              transition={{ duration: 0.25 }}
              className="rounded-full"
              style={{ height: 4, background: '#b86a14' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
