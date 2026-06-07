import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DEPTH_LAYERS } from '../core/depthRubric'

const section = (
  title: string,
  body: React.ReactNode,
  color = '#1a1825',
  delay = 0,
) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="mb-10"
  >
    <h2 className="font-display font-extrabold text-2xl leading-tight mb-5" style={{ color }}>
      {title}
    </h2>
    <div className="font-sans text-base leading-[1.85] text-ink/75 flex flex-col gap-4">
      {body}
    </div>
  </motion.section>
)

export function About() {
  const l2 = DEPTH_LAYERS[2]
  const l3 = DEPTH_LAYERS[3]
  const l4 = DEPTH_LAYERS[4]

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl lg:max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">

        {/* Back nav */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <Link to="/" className="font-mono text-sm text-muted hover:text-ink transition-colors">
            ← Back to the game
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <div className="font-mono text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: l2.color }}>
            The philosophy behind the game
          </div>
          <h1 className="font-display font-extrabold leading-[1.05] mb-6 text-bulge"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 4.5rem)', color: '#1a1825' }}>
            The question<br />
            <span style={{ color: l2.color }}>is the answer.</span>
          </h1>
          <p className="font-sans text-xl font-medium leading-[1.8] max-w-sm mx-auto" style={{ color: '#5a5670' }}>
            Every learning tool gives you better answers.
            <br />
            Cognitive Nav trains better questions.
          </p>
        </motion.header>

        {/* ── The core insight ── */}
        {section(
          "Why your question, not your answer",
          <>
            <p>
              A question reveals the exact shape of what you understand. Not roughly — exactly.
            </p>
            <p>
              A factual question (<em>"What is photosynthesis?"</em>) shows you can recall a name.
              A relational question (<em>"Why does ATP synthesis require a proton gradient?"</em>) shows
              you've built a causal model. A systemic question naming a specific failure mode shows
              you've stress-tested that model against reality. A philosophical question about the system's
              very design shows you've transcended it.
            </p>
            <p>
              You cannot fake a Layer 3 question if you don't actually hold two system states simultaneously
              in your mind. The question is proof. That's why we evaluate questions, not answers.
            </p>
          </>,
          l2.color, 0.1
        )}

        {/* ── The four depths ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="font-display font-extrabold text-2xl leading-tight mb-5" style={{ color: '#1a1825' }}>
            The four depths
          </h2>
          <div className="flex flex-col gap-4">
            {([1, 2, 3, 4] as const).map(l => {
              const m = DEPTH_LAYERS[l]
              return (
                <div key={l} className="flex gap-4 items-start p-5 rounded-2xl"
                  style={{ backgroundColor: m.bgColor, border: `1.5px solid ${m.color}25` }}>
                  <div className="font-display text-3xl font-extrabold flex-shrink-0 leading-none text-bulge"
                    style={{ color: m.color }}>{l}</div>
                  <div>
                    <div className="font-display font-extrabold text-base mb-1" style={{ color: m.color }}>
                      {m.tag} — {m.headline}
                    </div>
                    <p className="font-sans text-sm leading-[1.75]" style={{ color: '#4a4460' }}>
                      {m.description}
                    </p>
                    <p className="font-sans text-xs mt-2 leading-[1.7] italic" style={{ color: m.color + 'bb' }}>
                      {m.criterionTest}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── The five crossings ── */}
        {section(
          "The five crossings — why it works",
          <>
            <p>
              One good question at a depth is a lucky moment.
              Five good questions at that depth is a new way of thinking.
            </p>
            <p>
              Hebb (1949) showed that neurons which fire together wire together — co-activation
              builds synaptic bonds that strengthen with each firing. Bengtsson et al. (2005)
              confirmed with MRI that deliberate cognitive practice measurably increases white
              matter density along the tracts that carry that specific thinking pattern.
            </p>
            <p>
              Five qualifying questions is the threshold at which a cognitive depth shifts from
              deliberate to reflexive. Before five: you consciously decide to ask "why" or "what
              fails here." After five: you ask it automatically, without deciding. It has become
              your natural baseline — the floor your thinking starts from, not a ceiling you
              sometimes reach.
            </p>
            <div className="flex flex-col gap-2 py-2">
              {[
                { n: '1 ×', label: 'Pathway opens', sub: 'First synaptic connection forms', color: l2.color, bg: l2.bgColor },
                { n: '5 ×', label: 'Gate mastered', sub: 'Pathway myelinated — reflexive', color: l3.color, bg: l3.bgColor },
                { n: '∞',   label: 'This depth is yours', sub: 'Cannot be unlearned', color: l4.color, bg: l4.bgColor },
              ].map(item => (
                <div key={item.n} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: item.bg, border: `1.5px solid ${item.color}20` }}>
                  <div className="font-display text-2xl font-extrabold w-10 text-center flex-shrink-0 text-bulge"
                    style={{ color: item.color }}>{item.n}</div>
                  <div>
                    <div className="font-sans text-sm font-bold" style={{ color: '#1a1825' }}>{item.label}</div>
                    <div className="font-mono text-xs" style={{ color: '#7a7570' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>,
          l3.color, 0.25
        )}

        {/* ── The gift of the redirect ── */}
        {section(
          "The gift of the redirect",
          <>
            <p>
              When your question doesn't qualify, you receive a precise redirect — we call it the prick.
            </p>
            <p>
              The prick is not a failure notice. It locates the exact gap in your model.
              <em> "You named the concept. What mechanism produces it?"</em> This is the most useful
              sentence anyone can give you about your thinking: not "wrong" but "here is the precise
              step between where you are and where you're going."
            </p>
            <p>
              Every expert alive once wrote Layer 1 questions about their own domain. The prick
              shows the step. The step is the whole game.
            </p>
          </>,
          '#c43d0f', 0.3
        )}

        {/* ── The study panel ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-10"
        >
          <div className="card-premium p-7">
            <div className="font-mono text-xs font-bold tracking-widest uppercase mb-3" style={{ color: l3.color }}>
              The most important feature in this app
            </div>
            <h2 className="font-display font-extrabold text-2xl leading-tight mb-5" style={{ color: l3.color }}>
              The study panel is the game.
            </h2>
            <div className="font-sans text-base leading-[1.85] text-ink/75 flex flex-col gap-4">
              <p>
                Before you type your next question, you see the gate criteria: five measurable
                conditions that a qualifying question must satisfy. Each criterion has scientific
                backing. A calibration example shows what the language looks like — not to copy, but
                to feel the shape.
              </p>
              <p>
                This is not a hint. It is a map.
              </p>
              <p>
                The science of how memory consolidates — through deliberate encoding, structured
                self-testing, and spaced retrieval — tells us that understanding what to reach for
                before reaching is precisely how depth develops. Reading the gate criteria is not
                cheating. Sitting with them, asking yourself what each one means for your specific
                topic, noticing which ones feel clear and which feel uncertain — that is the
                cognitive work.
              </p>
              <p style={{ color: l3.color, fontStyle: 'italic', fontWeight: 600 }}>
                The question that arrives after you understand the map is not a performed question.
                It is a genuine question. Those are the only ones that count.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── No failure ── */}
        {section(
          "No failure. Only discovery.",
          <>
            <p>
              There is no losing state in Cognitive Nav.
            </p>
            <p>
              Every non-qualifying question is data. It tells you something true about where your
              model is right now. That information is valuable — more valuable than the illusion
              that you already understand. The design is intentional: we want you to feel completely
              safe asking. The wrong question combined with the redirect always produces the right
              direction.
            </p>
            <p>
              Your instincts grow stronger with each attempt — including the ones that don't qualify.
              The system is watching your trajectory, not your individual questions. One question
              tells us almost nothing. Five qualifying questions in a row tells us everything.
            </p>
            <div className="py-4 px-5 rounded-2xl"
              style={{ backgroundColor: l2.bgColor, border: `1.5px solid ${l2.color}25` }}>
              <p className="font-sans text-sm leading-[1.8]" style={{ color: l2.color }}>
                <strong>The only way to fail</strong> is to stop asking. As long as you keep
                asking — even badly, even confused — the depth finds itself. Curiosity is the
                engine. Everything else is just calibration.
              </p>
            </div>
          </>,
          l2.color, 0.4
        )}

        {/* ── Supporting anyone ── */}
        {section(
          "This is for anyone",
          <>
            <p>This engine works for:</p>
            <ul className="flex flex-col gap-2 pl-2">
              {[
                "A student approaching an exam topic for the first time",
                "A professional deepening their model of their own domain",
                "A researcher stress-testing assumptions they've held for years",
                "A teacher who wants to model depth for students",
                "Anyone who wants to understand anything more deeply than they do right now",
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="font-display font-extrabold flex-shrink-0 mt-0.5" style={{ color: DEPTH_LAYERS[((i % 4) + 1) as 1 | 2 | 3 | 4].color }}>✦</span>
                  <span className="font-sans text-sm leading-[1.75]">{item}</span>
                </li>
              ))}
            </ul>
            <p>
              There is no prerequisite. You don't need to know anything before you start.
              You need one genuine question — and the curiosity to follow where it leads.
            </p>
          </>,
          '#1a1825', 0.45
        )}

        {/* ── Vedic foundation ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="font-devanagari text-2xl leading-[1.8] mb-3" style={{ color: '#1a1825' }}>
            तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया
          </p>
          <p className="font-sans text-sm italic leading-[1.75] mb-2" style={{ color: '#5a5670' }}>
            "Know through approach, deep investigative inquiry, and service."
          </p>
          <p className="font-mono text-xs text-muted">— Bhagavad Gita 4.34 · Pariprashna</p>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center pb-10"
        >
          <Link to="/"
            className="inline-block font-display font-extrabold text-base px-8 py-4 rounded-2xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: l2.color, boxShadow: `0 4px 20px ${l2.color}40` }}
          >
            Start your inquiry →
          </Link>
        </motion.div>

      </div>
    </div>
  )
}
