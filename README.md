# Cognitive Nav

**The question is the answer.**

A depth-graded epistemic engine that trains you to ask better questions — not find better answers. Built on 70 years of neuroscience: five qualifying questions at a depth wires that thinking pattern permanently. The AI never answers. It only measures how deep your question goes, and points precisely at what's missing.

**Live:** https://cognitive-nav.netlify.app

---

## What it does

You pick any topic. You set a target depth (L1–L4). You ask questions. The AI classifies each one and returns a *prick* — a surgical redirect to the exact cognitive act your question didn't perform. Five qualifying questions at a gate, and that way of thinking becomes automatic. Not a skill you apply. A default you inhabit.

```
You ask → AI classifies depth → AI redirects (never answers) → You ask again, deeper
```

Two modes, same engine:

- **General Epistemic** — any topic. TCP/IP, gravity, economics, poetry.
- **Clinical Crucible** — medical topics, calibrated to NEET/USMLE/PLAB/MBBS exam boards.

---

## The four depths

| Layer | Name | What it means |
|-------|------|---------------|
| L1 | Factual | You can name it |
| L2 | Relational | You can explain the mechanism — why it works |
| L3 | Systemic | You can name a specific condition where it breaks |
| L4 | Wisdom | You can question why the system was designed this way at all |

Three gates connect the layers. Each gate requires five qualifying questions to master. The number five is not arbitrary — Hebb (1949) showed that neurons that fire together five times wire together permanently. Bengtsson's MRI studies showed white matter density visibly increasing after five crossings. The gate system is neuroscience, not game design.

---

## Architecture

```
Browser (React + Vite PWA)
    │
    ├── Evaluation loop     →  Netlify Function  →  Groq llama-3.3-70b-versatile
    ├── Voice narration     →  Four-tier cascade (OpenAI → ElevenLabs → Cartesia → Kokoro → Web Speech)
    ├── Voice input (STT)   →  Netlify Function  →  Groq Whisper large-v3-turbo
    ├── Session storage     →  Dexie.js (IndexedDB, offline-first)
    └── Auth (optional)     →  Firebase
```

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion

**AI evaluation:** Groq (`llama-3.3-70b-versatile`, JSON mode) behind a Netlify function proxy. Never exposed to the client.

**TTS cascade** — each tier is a `Promise.race` fallback; a hang or missing key falls to the next:

| Tier | Provider | Voices | Requires |
|------|----------|--------|----------|
| 0 | OpenAI tts-1-hd | Nova (guide) · Onyx (learner) | `OPENAI_API_KEY` |
| 1 | ElevenLabs | Matilda/Liam · Alice/Daniel · Priyanka/Anant (language-aware) | `ELEVENLABS_API_KEY` |
| 2 | Cartesia Sonic-2 | Helpful Woman (guide) · Newsman (learner) | `CARTESIA_API_KEY` |
| 3 | Kokoro-82M WASM | af_bella / am_adam | None (English only, ~45 MB) |
| 4 | Web Speech API | Browser built-in | None (always available) |

TTS audio is cached in Dexie after first generation. One ElevenLabs key generates the full demo once — it plays from cache forever after.

**STT:** Groq Whisper in batch mode (MediaRecorder → base64 → function → transcript), with Web Speech API interim results for live feedback.

---

## Key files

```
src/
├── components/
│   ├── DemoFlow.tsx          # Full game loop demo — topic → gates → completion
│   ├── PrickLoop.tsx         # Live session loop, EvaluationCard, JourneyArc
│   ├── LevelStudyPanel.tsx   # Gate criteria study panel + context panel
│   └── VoiceSettings.tsx     # Voice picker UI (Guide + Learner + presets)
├── core/
│   ├── depthRubric.ts        # Layer metadata, gate definitions, scoring
│   └── types.ts              # All shared types
├── lib/
│   ├── useElevenLabsTTS.ts   # EL TTS — emotion-aware, accent-aware, Dexie cache
│   ├── useOpenAITTS.ts       # OpenAI TTS — multilingual, Dexie cache
│   ├── useCartesiaTTS.ts     # Cartesia Sonic-2 — ultra-low latency, two voices
│   ├── useKokoroTTS.ts       # Kokoro WASM — English-only, module singleton
│   ├── useVoiceSettings.ts   # Web Speech API + prefs persistence
│   ├── useVoiceInput.ts      # STT — WebSpeech mode + Whisper batch mode
│   └── db.ts                 # Dexie schema v2 (sessions, voicePrefs, ttsCache)
├── pages/
│   ├── Home.tsx              # Topic input, depth selector, demo, gates accordion
│   ├── History.tsx           # Session history and stats
│   └── About.tsx             # Philosophy: Pariprashna (Gita 4.34), science
└── stores/
    └── sessionStore.ts       # Session state, gate logic, Dexie persistence

netlify/functions/
├── evaluate.ts               # Groq evaluation proxy
├── tts.ts                    # ElevenLabs TTS proxy
├── openai-tts.ts             # OpenAI TTS proxy
├── cartesia-tts.ts           # Cartesia Sonic-2 proxy
├── whisper.ts                # Groq Whisper STT proxy
├── guide-qa.ts               # Interactive guide Q&A (in-demo)
└── context.ts                # Depth-aware context generator
```

---

## Environment variables

Set in Netlify dashboard → Site configuration → Environment variables.

| Variable | Purpose | Required |
|----------|---------|----------|
| `GROQ_API_KEY` | LLM evaluation + Whisper STT | **Yes** |
| `ELEVENLABS_API_KEY` | Human TTS voices (Tier 1) | Strongly recommended |
| `OPENAI_API_KEY` | OpenAI tts-1-hd (Tier 0) | Optional |
| `CARTESIA_API_KEY` | Cartesia Sonic-2 (Tier 2 narration + session 🔊 button) | Optional |

The free tier of each is sufficient. ElevenLabs audio caches in IndexedDB after first generation — the full demo script uses the free 10k chars once, then plays from cache forever.

Groq free tier: 14k requests/day. ElevenLabs: 10k chars/month. Cartesia: 10k chars/month.

---

## Local development

```bash
# Clone and install
git clone <repo-url>
cd cognitive-nav-app
npm install

# Start dev server (Vite HMR + Netlify functions)
npm run dev

# Type-check + build
npm run build
```

The dev server at `localhost:8888` runs both the Vite frontend and Netlify functions via `netlify dev`.

Netlify functions need env vars — put them in a `.env` file at the repo root:

```
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=...
```

---

## Deploy

```bash
npm run build
netlify deploy --prod --dir=dist --no-build
```

`--no-build` is required in WSL — Netlify's remote build fails due to an extension fetch issue. It uploads the pre-built `dist/` directly. No build minutes consumed.

`netlify env:set` fails on this machine ("Missing required path variable 'account_id'"). Use the Netlify dashboard instead.

---

## The philosophy

*Bhagavad Gita 4.34 — Pariprashna.* Knowledge through deep investigative inquiry. The prick is the guru function. Real strength is helping others surpass your current state.

The score measures how consistently you reached the depth you chose. Not speed. Not intelligence. The quality of your curiosity.

> "The question IS the answer."

---

## What's live

- 18-language multilingual narration and voice input
- Full demo: topic → depth choice → gates → celebration → completion (13–17 phases)
- Session history with exam board filters
- Offline-first IndexedDB sessions
- Four-tier TTS cascade with per-role voices and emotion-aware audio settings
- Voice input: Web Speech (live interim) + Groq Whisper (batch fallback)
- Interactive guide Q&A panel inside the demo
- Depth-aware context panel (hook + 3 facts + 3 search links per gate)
- Two app modes: General Epistemic + Clinical Crucible
- Responsive from 280px (old phones) to 4K

---

*Built with Groq · ElevenLabs · Cartesia · OpenAI · Netlify · React · Vite · Tailwind*
