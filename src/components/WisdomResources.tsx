import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEPTH_LAYERS } from '../core/depthRubric'
import type { DepthLayer } from '../core/types'

interface Technique {
  id: string
  name: string
  origin: string
  tagline: string
  what: string
  how: string
  depthLayers: DepthLayer[]
  quote: string
  quoteAuthor: string
  practice: string
  learnMore: string
}

const TECHNIQUES: Technique[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro Technique',
    origin: 'Francesco Cirillo, 1987',
    tagline: '25 minutes of undivided attention. Then rest. Then again.',
    what: 'Divide work into 25-minute intervals (pomodoros) separated by 5-minute breaks. Every 4 pomodoros, take a longer 20-minute rest.',
    how: 'Your prefrontal cortex — the seat of deep thinking — fatigues under sustained load. The 25-minute unit is calibrated to its natural attention span. The break is not wasted time; it is consolidation time. Working memory replays and encodes during rest.',
    depthLayers: [1, 2],
    quote: 'The way to eat an elephant is one bite at a time.',
    quoteAuthor: 'Attributed to Creighton Abrams',
    practice: 'Before your next inquiry session, set a timer for 25 minutes. Commit to asking only about one topic. When the timer fires, stop — even if you are mid-thought. The pause is part of the practice.',
    learnMore: 'https://en.wikipedia.org/wiki/Pomodoro_Technique',
  },
  {
    id: 'five-whys',
    name: '5 Whys',
    origin: 'Sakichi Toyoda, Toyota Production System, 1930s',
    tagline: 'Ask why five times and you will find the root.',
    what: 'When you encounter a problem or phenomenon, ask "why did this happen?" Then ask why again about that answer. Repeat five times. The fifth answer is usually the root cause.',
    how: 'This is Gate 1 thinking systematized. Each "why" forces you to name a causal mechanism — exactly what Layer 2 requires. By the third why, most people are at Layer 3. By the fifth, you often find yourself asking Layer 4 questions: why does the system allow this to happen at all?',
    depthLayers: [2, 3, 4],
    quote: 'If you ask "why" five times about every matter, you will have a much better understanding of the root cause.',
    quoteAuthor: 'Taiichi Ohno',
    practice: 'Take any fact from your current topic. Ask why it is true. Then ask why that is true. Do this five times. Notice when you cross from Layer 2 (mechanism) to Layer 3 (failure condition) to Layer 4 (design assumption). Write the chain down.',
    learnMore: 'https://en.wikipedia.org/wiki/Five_whys',
  },
  {
    id: 'feynman',
    name: 'Feynman Technique',
    origin: 'Richard Feynman, Nobel Laureate in Physics',
    tagline: 'If you cannot explain it simply, you do not understand it.',
    what: 'Choose a concept. Write an explanation as if teaching it to a complete beginner — no jargon. Where you get stuck or vague, go back to the source. Simplify again. Repeat until the explanation is clean.',
    how: 'Teaching forces mechanism articulation — the hallmark of Layer 2. When you explain to a beginner, every jargon word must be replaced by a structural description. "The membrane becomes permeable" must become "the protein channels open because..." That replacement IS Gate 1 crossing.',
    depthLayers: [1, 2],
    quote: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    quoteAuthor: 'Richard Feynman',
    practice: 'After your next inquiry session, open a blank document. Explain the topic as if writing for a curious 12-year-old. Every place you write a word you cannot further explain — that is your next inquiry target.',
    learnMore: 'https://en.wikipedia.org/wiki/Richard_Feynman',
  },
  {
    id: 'spaced-repetition',
    name: 'Spaced Repetition',
    origin: 'Hermann Ebbinghaus, 1885 — Forgetting Curve',
    tagline: 'Reviewing at the moment of forgetting is ten times more effective than reviewing before.',
    what: 'Study a concept. Review it after 1 day. Then after 3 days. Then after 1 week. Then after 3 weeks. The intervals grow with each successful review. This exploits the Ebbinghaus Forgetting Curve.',
    how: 'Memory is not storage — it is reconstruction. Each retrieval strengthens the reconstructive pathway. Cognitive Nav\'s mastery system is built on this principle: 5 crossings at the optimal interval permanently changes the baseline. FSRS scheduling (coming soon) will bring this to every topic you study here.',
    depthLayers: [1, 2, 3, 4],
    quote: 'The struggle to retrieve a memory makes it stronger. This is the desirable difficulty.',
    quoteAuthor: 'Robert Bjork, UCLA Memory Lab',
    practice: 'After mastering a gate, revisit the same topic in 3 days. Try to reach the same depth without looking at your previous questions. Notice whether the depth comes naturally or whether you have to think hard. That difficulty is the learning.',
    learnMore: 'https://en.wikipedia.org/wiki/Spaced_repetition',
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    origin: 'Cal Newport, 2016',
    tagline: 'Cognitively demanding work done in distraction-free concentration.',
    what: 'Schedule blocks of 1–4 hours of complete focus on a single cognitively demanding task. No notifications. No switching. Protect the block ruthlessly.',
    how: 'Layer 3 and Layer 4 questions cannot be formed in a distracted mind. Holding two system states simultaneously — normal operation and the failure condition — requires working memory that is not partitioned by notifications. Every time you switch context, you drain the exact resource that systemic thinking requires.',
    depthLayers: [3, 4],
    quote: 'Who you are, what you think, feel, and do, what you love — is the sum of what you focus on.',
    quoteAuthor: 'Cal Newport, Deep Work',
    practice: 'Schedule one 90-minute deep work block per day for inquiry. No phone. No other tabs. Use Pomodoro within it. The first week will feel slow. The second week will feel different.',
    learnMore: 'https://en.wikipedia.org/wiki/Cal_Newport',
  },
  {
    id: 'flow',
    name: 'Flow State',
    origin: 'Mihaly Csikszentmihalyi, 1975',
    tagline: 'Optimal experience happens when challenge exactly matches skill.',
    what: 'Flow is a state of effortless concentration where time disappears and performance is at its peak. It requires: a clear goal, immediate feedback, and a challenge that is slightly above current skill.',
    how: 'Cognitive Nav\'s target depth system is designed to place you in flow. When you set Layer 3 as your target and you are currently at Layer 2, the gap is exactly the right size. The prick gives immediate feedback. The mastery count shows progress. When all three conditions are met, inquiry stops feeling like work.',
    depthLayers: [2, 3, 4],
    quote: 'The best moments in our lives are not the passive, receptive, relaxing times. The best moments usually occur if a person\'s body or mind is stretched to its limits.',
    quoteAuthor: 'Mihaly Csikszentmihalyi',
    practice: 'If a gate feels too hard, step back to the previous depth layer for a few questions. If it feels too easy, increase your target. The key is the edge of your current capability — not behind it, not far ahead of it.',
    learnMore: 'https://en.wikipedia.org/wiki/Flow_(psychology)',
  },
  {
    id: 'still-mind',
    name: 'Still Mind / Meditation',
    origin: 'Vipassana, Vedic tradition · Modern: Jon Kabat-Zinn, 1979',
    tagline: 'The mind in stillness can hold a question without rushing to answer it.',
    what: 'Meditation — even 10 minutes of breath observation — measurably reduces default mode network activation (the mind\'s passive rumination mode). This quiets internal noise and restores sustained attention capacity.',
    how: 'The Default Mode Network is the enemy of Layer 3 and 4 inquiry. When it is active, the mind wanders to past events, future plans, and self-referential thought — exactly the opposite of "holding two system states simultaneously." Meditation is not passive. It is training the prefrontal cortex to override the wandering mind.',
    depthLayers: [3, 4],
    quote: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया — Know it through approach, deep inquiry, and service.',
    quoteAuthor: 'Bhagavad Gita 4.34',
    practice: 'Before a depth-3 or depth-4 inquiry session, spend 5 minutes in breath observation. Notice when the mind wanders and return — gently. This is not a spiritual practice. It is cognitive preparation. The same muscle that returns from mind-wandering will hold a system state under pressure.',
    learnMore: 'https://en.wikipedia.org/wiki/Mindfulness',
  },
  {
    id: 'body-mind',
    name: 'Body as the Learning Substrate',
    origin: 'Sleep: Matthew Walker, 2017 · Exercise: John Ratey, 2008',
    tagline: 'Your brain learns during sleep. Your cognition runs on the body.',
    what: 'Sleep is when hippocampal replay consolidates the day\'s learning into long-term memory. Aerobic exercise increases BDNF (brain-derived neurotrophic factor) — the protein that promotes synaptogenesis, the physical substrate of Hebb\'s rule.',
    how: 'Every gate you cross in Cognitive Nav involves synaptic strengthening. That strengthening happens primarily during slow-wave sleep. A session at 11pm after 6 hours of previous sleep is neurologically inferior to the same session at 9am after 8 hours. This is not motivational framing. It is the physical reality of how memory consolidation works.',
    depthLayers: [1, 2, 3, 4],
    quote: 'Sleep is the single most effective thing we can do to reset our brain and body health each day.',
    quoteAuthor: 'Matthew Walker, Why We Sleep',
    practice: 'Protect 7–8 hours of sleep before days when you intend to reach Layer 3 or 4. Take a 20-minute walk before a deep inquiry session. These are not wellness suggestions — they are performance requirements for the cognitive work this app asks of you.',
    learnMore: 'https://en.wikipedia.org/wiki/Sleep_and_memory',
  },
  {
    id: 'blooms',
    name: "Bloom's Taxonomy",
    origin: 'Benjamin Bloom, 1956 — revised Anderson & Krathwohl, 2001',
    tagline: 'There are six identifiable levels of cognitive complexity. You are working through four of them.',
    what: "Bloom's Taxonomy describes a hierarchy: Remember → Understand → Apply → Analyse → Evaluate → Create. Each level builds on the one below and requires different cognitive operations.",
    how: "Layer 1 (Factual) maps to Remember. Layer 2 (Relational) maps to Understand + Apply. Layer 3 (Systemic) maps to Analyse + Evaluate — holding competing conditions and judging which is more significant. Layer 4 (Wisdom) maps to Create and meta-cognition — designing new frameworks. Cognitive Nav's depth gates are not arbitrary. They map to 70 years of cognitive science.",
    depthLayers: [1, 2, 3, 4],
    quote: "The purpose of education is not to fill a bucket but to light a fire.",
    quoteAuthor: 'W.B. Yeats (attrib.)',
    practice: 'When a session feels hard, identify which Bloom level it requires. "Analyse" requires you to break the system into components and show how they interact — that is Gate 2 work. Naming the cognitive operation makes it less mysterious.',
    learnMore: "https://en.wikipedia.org/wiki/Bloom%27s_taxonomy",
  },
]

const DEPTH_FILTER_LABELS: Record<number, string> = {
  0: 'All techniques',
  1: 'Foundation (L1)',
  2: 'Relational (L2)',
  3: 'Systemic (L3)',
  4: 'Wisdom (L4)',
}

export function WisdomResources() {
  const [open, setOpen] = useState(false)
  const [depthFilter, setDepthFilter] = useState<number>(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = depthFilter === 0
    ? TECHNIQUES
    : TECHNIQUES.filter(t => t.depthLayers.includes(depthFilter as DepthLayer))

  return (
    <div className="card-premium">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-7 text-left"
      >
        <div>
          <div className="font-mono text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: '#7a7570' }}>
            The conditions for depth
          </div>
          <div className="font-display font-extrabold text-xl leading-tight" style={{ color: '#1a1825' }}>
            Techniques that build the mind
            <br />
            <span style={{ color: DEPTH_LAYERS[4].color }}>for deeper inquiry</span>
          </div>
          <p className="font-sans text-sm text-muted mt-2 leading-[1.75]">
            Every depth level has its own eligibility. Interest and willingness are just the beginning.
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono text-muted text-xl flex-shrink-0 ml-4"
        >▼</motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-7 flex flex-col gap-5 border-t border-line pt-5">

              {/* Depth filter */}
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4].map(d => (
                  <button key={d}
                    onClick={() => setDepthFilter(d)}
                    className="font-mono text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: depthFilter === d
                        ? (d === 0 ? '#1a1825' : DEPTH_LAYERS[d as DepthLayer].color)
                        : '#fff',
                      color: depthFilter === d ? '#fff' : '#7a7570',
                      border: `1.5px solid ${depthFilter === d
                        ? (d === 0 ? '#1a1825' : DEPTH_LAYERS[d as DepthLayer].color)
                        : 'rgba(26,24,37,0.10)'}`,
                    }}>
                    {DEPTH_FILTER_LABELS[d]}
                  </button>
                ))}
              </div>

              {/* Technique cards */}
              <div className="flex flex-col gap-3">
                {filtered.map(t => {
                  const isExpanded = expanded === t.id
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ border: '1.5px solid rgba(26,24,37,0.08)', background: '#fff' }}
                    >
                      <button
                        onClick={() => setExpanded(isExpanded ? null : t.id)}
                        className="w-full flex items-start gap-4 p-5 text-left"
                      >
                        {/* Depth layer dots */}
                        <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                          {t.depthLayers.map(l => (
                            <div key={l} className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: DEPTH_LAYERS[l].color }} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-display font-extrabold text-base text-ink leading-tight">
                                {t.name}
                              </div>
                              <div className="font-mono text-xs text-muted mt-0.5">{t.origin}</div>
                            </div>
                            <motion.span
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="font-mono text-muted flex-shrink-0 mt-1"
                            >▶</motion.span>
                          </div>
                          <p className="font-sans text-sm font-medium text-ink/70 mt-2 leading-[1.7] italic">
                            {t.tagline}
                          </p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {t.depthLayers.map(l => (
                              <span key={l}
                                className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: DEPTH_LAYERS[l].bgColor,
                                  color: DEPTH_LAYERS[l].color,
                                }}>
                                L{l} · {DEPTH_LAYERS[l].tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-line pt-4">

                              <div>
                                <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#7a7570' }}>
                                  What it is
                                </div>
                                <p className="font-sans text-sm text-ink/70 leading-[1.85]">{t.what}</p>
                              </div>

                              <div className="pl-4 py-3 rounded-r-xl"
                                style={{ borderLeft: `4px solid ${DEPTH_LAYERS[t.depthLayers[t.depthLayers.length - 1]].color}`, backgroundColor: `${DEPTH_LAYERS[t.depthLayers[t.depthLayers.length - 1]].bgColor}80` }}>
                                <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2"
                                  style={{ color: DEPTH_LAYERS[t.depthLayers[t.depthLayers.length - 1]].color }}>
                                  How it connects to depth
                                </div>
                                <p className="font-sans text-sm text-ink/70 leading-[1.85]">{t.how}</p>
                              </div>

                              <div className="rounded-2xl p-4"
                                style={{ backgroundColor: '#faf8f4', border: '1px solid rgba(26,24,37,0.06)' }}>
                                <p className="font-sans text-sm italic text-ink/70 leading-[1.8] mb-1">
                                  "{t.quote}"
                                </p>
                                <p className="font-mono text-xs text-muted">— {t.quoteAuthor}</p>
                              </div>

                              <div>
                                <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#7a7570' }}>
                                  Your practice
                                </div>
                                <p className="font-sans text-sm text-ink/70 leading-[1.85]">{t.practice}</p>
                              </div>

                              <a href={t.learnMore} target="_blank" rel="noopener noreferrer"
                                className="font-mono text-xs font-semibold transition-colors hover:opacity-70 self-start"
                                style={{ color: DEPTH_LAYERS[t.depthLayers[0]].color }}>
                                Read more →
                              </a>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
