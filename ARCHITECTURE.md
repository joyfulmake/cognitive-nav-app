# Cognitive Nav — Architecture

_One document. Everything a new contributor, PM, or returning developer needs to understand the whole system._

---

## The one problem this solves

Most learning tools deliver information. This one trains the learner to generate better questions.

The depth of a question is a measurable proxy for the depth of understanding. A person who asks "What is TCP?" understands the label. A person who asks "Why does TCP place reliability at the transport layer rather than the network — what assumption about end-host intelligence does this encode?" understands the design philosophy. These are not opinions about question quality — they are objectively different cognitive acts, activable on a rubric grounded in decades of neuroscience.

Cognitive Nav makes that depth visible, immediate, and improvable through repetition. Five qualifying questions at a depth rewires the brain to ask at that depth automatically — without deciding to. That is the whole product.

---

## What this is NOT

| Not this | Why it matters to be clear |
|----------|--------------------------|
| A quiz or test | Questions are evaluated, not answers. The user asks, the AI classifies. |
| A flashcard/spaced-repetition system | FSRS schema exists but is not yet the core loop. This is inquiry training, not recall training. |
| An AI tutor that gives answers | The AI explicitly does NOT answer. It redirects. The prick is never an answer. |
| A content library or curriculum | No fixed paths. Any topic. Any depth target. User sets both. |
| A performance evaluator | Practice score measures inquiry quality, not intelligence or knowledge. |
| A chatbot or conversation assistant | The interaction pattern is: human asks → AI classifies depth → human asks again. Not dialogue. |
| A note-taking or knowledge management tool | No KB, no graph (yet). Sessions are for training, not storage. |

---

## The workflow — from a human perspective

```
┌─────────────────────────────────────────────────────────────┐
│  1. CHOOSE A TOPIC                                          │
│     Anything: physics, medicine, TCP/IP, economics, poetry  │
│     Clinical mode: medical topics with exam calibration     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. SET YOUR TARGET DEPTH                                   │
│     L1 Foundation  — name what exists                       │
│     L2 Relational  — trace how and why it works             │
│     L3 Systemic    — engage failure modes and edge cases    │
│     L4 Wisdom      — question why the system exists at all  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ASK A QUESTION                                          │
│     Any question. There is no wrong starting point.        │
│     Voice input or keyboard. Any of 18 languages.          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. AI EVALUATES DEPTH (never answers)                     │
│     Returns: depthScore (1–4), which gate was or wasn't    │
│     cleared, what cognitive act was or wasn't performed.   │
└───────┬───────────────────────────────────────┬────────────┘
        │ depth < target                        │ depth ≥ gate
        ▼                                       ▼
┌──────────────────────┐           ┌───────────────────────────┐
│  THE PRICK           │           │  QUALIFIES FOR GATE       │
│  A surgical redirect │           │  Mastery count +1         │
│  names the EXACT gap │           │  (need 5 to master gate)  │
│  in what was asked.  │           │                           │
│  Not an answer.      │           │  After 5: gate mastered   │
│  A pointing finger.  │           │  → unlock next gate       │
└──────────┬───────────┘           └─────────────┬─────────────┘
           │                                     │
           └──────────────────┬──────────────────┘
                              │ loop until target reached
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. COMPLETION                                              │
│     Practice score: inquiry quality, not right/wrong.      │
│     Score = how consistently you reached your target depth  │
│     weighted by efficiency (fewer attempts = better).      │
└─────────────────────────────────────────────────────────────┘
```

---

## How the app stays coherent across everyone's expectations

The evaluation is not AI opinion. It is a rubric applied by AI.

Each gate has exactly one measurable criterion:
- **Gate 1**: Question explicitly names a cause or mechanism between two specific components.
- **Gate 2**: Question introduces a named, specific failure mode, edge case, or competing mechanism.
- **Gate 3**: Question steps outside the system to question its design assumptions.

The AI is given counter-examples for each boundary. Borderline cases are always classified lower — this is a hard rule in the system prompt. Users cannot accidentally receive a higher classification than their question earned.

This removes the "my answer was correct but marked wrong" problem that plagues other evaluation systems. The classification is structural, not subjective. The prick names what structural element was missing — not what answer was wrong.

As the bar rises (L1 → L2 → L3 → L4), the criteria do not become vaguer — they become more specific. L3 requires naming a condition that is testable and concrete. L4 requires stepping entirely outside the system. Both are verifiable.

---

## Technical architecture — plain language

```
Browser (React PWA)
│
├── UI Layer
│   ├── pages/         — Home, Session, History, About, Auth
│   ├── components/    — PrickLoop, DemoFlow, LevelStudyPanel, JourneyArc, VoiceSettings
│   └── State management
│       ├── Zustand    — session state (fast, reactive, in-memory)
│       ├── Dexie.js   — IndexedDB (offline-first persistence)
│       └── TanStack Query — API call state (loading, error, retry)
│
├── Core Logic (no network)
│   ├── depthRubric.ts — layer metadata, gate criteria, scoring functions
│   ├── types.ts       — all data shapes
│   └── topicSuggestions.ts — curated topic lists per mode/board
│
└── Network calls → Netlify Functions (serverless)
    ├── evaluate.ts      — Groq LLM depth evaluation
    ├── tts.ts           — ElevenLabs TTS proxy (audio cached in Dexie)
    ├── whisper.ts       — Groq Whisper STT (base64 audio → transcript)
    ├── openai-tts.ts    — OpenAI tts-1-hd proxy — Nova/Onyx/Shimmer (Tier 0, optional)
    ├── cartesia-tts.ts  — Cartesia Sonic-2 proxy — session feedback voice (not cached)
    ├── context.ts       — Depth-aware context generator — interest hook + facts + search links
    └── guide-qa.ts      — Interactive guide Q&A (demo sidebar, in-character, 120 tokens max)

External Services
├── Groq API          — LLaMA 3.3 70B (evaluation + context generation) + Whisper large-v3-turbo (STT)
├── OpenAI API        — tts-1-hd (Tier 0 TTS) — Nova (guide), Onyx (learner), Shimmer (celebration). Optional.
├── ElevenLabs API    — Matilda/Liam (en-US), Alice/Daniel (en-GB), Priyanka/Anant (hi-IN), Matilda/Josh (multilingual)
├── Cartesia API      — Sonic-2 ultra-low-latency TTS for EvaluationCard 🔊 button. Optional.
└── Firebase          — Auth + Firestore (optional, graceful fallback to local identity)
```

No dedicated backend. No custom database. All state is either in-browser (Dexie/Zustand) or passed through stateless Netlify Functions. Sessions created offline persist locally and sync when online if Firebase is configured.

---

## How tasks are generated — the evaluation engine

Every question the user submits goes through one evaluation pass:

1. **Request assembled** (`src/lib/api.ts:evaluateQuestion`):
   - `question` — what the user typed
   - `topic`, `appMode`, `examBoard` — session context
   - `targetDepth` — the user's chosen ceiling
   - `activeGate` — which gate is currently being worked on (computed by `getActiveGate()`)
   - `previousReformulations` — the last few questions, so the AI can see the trajectory

2. **Netlify function** (`netlify/functions/evaluate.ts`):
   - Sends to Groq `llama-3.3-70b-versatile` with `response_format: json_object`
   - System prompt contains the full rubric, counter-examples for each gate boundary, the iron rule (borderline = lower), and output format
   - `max_tokens: 600` — enough for a tight JSON response, not a monologue

3. **Server computes `isResolved`** — this is NOT done by the AI. Server-side: `depthScore >= targetDepth`. The model cannot gift a resolved state.

4. **Response** (`EvaluateResponse`):
   - `depthScore` (1–4) — what layer was reached
   - `prickText` — the redirect (null if qualifies)
   - `appreciation` — one specific thing the question did well (not generic)
   - `scienceInsight` — which brain mechanism was or was not activated, with research refs
   - `hint` — a concrete example of what the next layer sounds like
   - `imageQuery` — a Wikipedia article title for contextual visual reference

5. **State update** (`sessionStore.addReformulation`):
   - Adds reformulation to session
   - Updates `levelMastery[activeGate]` if qualifies
   - Recomputes `activeGate` for next question
   - Persists to Dexie immediately

---

## How the AI fits in

The AI does three things. Only three.

| Role | Service | What it decides |
|------|---------|----------------|
| Depth evaluator | Groq LLaMA 3.3 70B | Which layer a question reached (1–4) and what structural element was missing. Works in any language — prick and hint respond in the user's question language. |
| Guide Q&A | Groq LLaMA 3.3 70B | Answers user questions about the app in character as the Guide (demo sidebar feature). Max 120 tokens. |
| Context generator | Groq LLaMA 3.3 70B | Generates depth-calibrated interest hook, 3 key facts, and 3 web search links for any topic + gate. Shown in LevelStudyPanel on demand. |
| Voice narrator (Tier 0) | OpenAI tts-1-hd | Demo dialogue delivery when `OPENAI_API_KEY` is set. Nova (guide), Onyx (learner), Shimmer (celebration). Best multilingual quality. Cached in Dexie prefix `oa2:`. |
| Voice narrator (Tier 1) | ElevenLabs (Matilda/Liam en-US, Alice/Daniel en-GB, Priyanka/Anant hi-IN) | Demo dialogue delivery when EL key is set. Accent-aware voice selection, emotion-aware stability/style. Cached in Dexie prefix `el11:`. |
| Session feedback voice | Cartesia Sonic-2 | Reads EvaluationCard appreciation + prickText aloud via 🔊 button. Ultra-low latency (<135ms first chunk). Not cached (each eval result is unique). |
| Transcriber | Groq Whisper large-v3-turbo | Converting spoken audio to text for the question input. All languages. |

What the AI does NOT decide:
- Whether a session is complete (`isResolved` is a server-side arithmetic check: `depthScore >= targetDepth`)
- What the mastery count is (counted locally in `sessionStore`)
- What the practice score is (`computePracticeScore` in `depthRubric.ts` — pure function)
- What the next gate is (`getActiveGate` — pure function)

This separation matters. The AI is a classifier in a defined rubric system, not an oracle. Scores and state transitions are deterministic and auditable without looking at any LLM.

---

## Data flow — one full pass

```
User types question
         │
         ▼
PrickLoop.tsx: handleSubmit()
         │
         ▼
useMutation → evaluateQuestion(api.ts)
         │
         │  POST /.netlify/functions/evaluate
         │  body: { question, topic, appMode, examBoard,
         │          targetDepth, activeGate, reformulationIndex,
         │          previousReformulations }
         │
         ▼
netlify/functions/evaluate.ts
  ├── Build system prompt (SYSTEM_PROMPT constant)
  ├── Build user message (topic + context + trajectory)
  └── Groq API call → llama-3.3-70b-versatile
              │
              ▼
         JSON response parsed
         │
         │  qualifies = depthScore >= activeGate  (server-side)
         │  isResolved = depthScore >= targetDepth (server-side)
         │
         ▼
Response → PrickLoop mutation.onSuccess
         │
         ├── useSessionStore.addReformulation()
         │     ├── Append reformulation to session
         │     ├── Update levelMastery[activeGate] if qualifies
         │     ├── Append depthScore to trajectoryVector
         │     └── saveSession() → Dexie IndexedDB
         │
         ├── UI re-renders:
         │     ├── Depth badge (L1/L2/L3/L4 pill)
         │     ├── Mastery bar fills
         │     ├── Prick text displays (if not qualified)
         │     ├── Appreciation + science insight card
         │     └── Wikipedia contextual image (useWikiImage hook)
         │
         └── If levelMastery[activeGate] === 5:
               ├── Gate mastered celebration (confetti, ring burst)
               └── Next gate becomes active OR session completes
```

---

## Why this structure reduces chaos in the process of learning

**Most learning feels chaotic because the feedback loop is broken.**

You study → you take a test days later → you get a score → you don't know what you actually don't understand. The feedback is delayed, coarse, and tells you about your memory, not your thinking.

Cognitive Nav closes the loop at the moment of question formation — before an answer is given, before a test is taken. You ask → you immediately see which cognitive act you performed → you try again from a more precise starting point. The prick is the feedback, and it arrives in the same second as the question.

Structurally, this keeps things coherent because:

1. **The rubric never changes mid-session.** Gates have fixed criteria. L2 today means L2 tomorrow.
2. **State is local and immediate.** No server-side session state. Zustand updates are synchronous; Dexie writes happen in the background. The UI never waits on a database.
3. **Failure is impossible to hide.** Every question produces a classified output. There is no "partially correct" that obscures actual depth. The score is a number from a defined rubric.
4. **Progress is granular enough to feel.** Five steps per gate means you can see yourself moving forward with every qualifying question, not just at the end of a study session.
5. **The mastery signal is physiological, not academic.** Five crossings of a gate (Hebb, 1949) is the threshold at which a thinking pattern becomes reflexive. The 5-question gate is calibrated to neuroscience, not exam convention.

---

## File map — where to find things

```
cognitive-nav-app/
│
├── netlify/functions/
│   ├── evaluate.ts        LLM depth evaluation proxy (Groq) — multilingual question support
│   ├── tts.ts             ElevenLabs TTS proxy (emotion-aware, accent-aware)
│   ├── whisper.ts         Groq Whisper STT proxy
│   ├── openai-tts.ts      OpenAI tts-1-hd proxy — Nova/Onyx/Shimmer, cached oa2: prefix
│   ├── cartesia-tts.ts    Cartesia Sonic-2 proxy — session feedback, not cached
│   ├── context.ts         Depth-aware context generator (Groq) — hook + facts + search links
│   └── guide-qa.ts        Interactive guide Q&A for demo — answers questions about the app in character
│
├── src/
│   ├── App.tsx            Route definitions only
│   ├── main.tsx           React root, QueryClient setup
│   ├── index.css          Global styles, depth colours, card classes
│   │
│   ├── core/
│   │   ├── types.ts       All TypeScript types (Session, Reformulation, DepthLayer…)
│   │   ├── depthRubric.ts Layer metadata, gate criteria, scoring functions (pure)
│   │   ├── nyayaRules.ts  Nyaya Darshana team debate mode rules
│   │   └── topicSuggestions.ts  Curated topic lists per mode and exam board
│   │
│   ├── pages/
│   │   ├── Home.tsx       Depth selector, demo, topic input, gates accordion, hero
│   │   ├── Session.tsx    Session wrapper (loads PrickLoop + KnowledgeMap)
│   │   ├── History.tsx    Session history and stats
│   │   ├── About.tsx      Philosophy, science, depth cards
│   │   └── Auth.tsx       Firebase sign-in (optional)
│   │
│   ├── components/
│   │   ├── PrickLoop.tsx       THE CORE LOOP — question input, evaluation, prick display, JourneyArc, LevelStudyPanel
│   │   ├── DemoFlow.tsx        Animated demo (full game loop, voice narration, all phase types)
│   │   ├── LevelStudyPanel.tsx Gate criteria study panel shown before next question
│   │   ├── VoiceSettings.tsx   Voice tier config, language picker, guide/learner voices
│   │   ├── DepthMeter.tsx      Visual depth meter component
│   │   ├── KnowledgeMap.tsx    (Session sidebar, concept coverage visual)
│   │   ├── TeamPanel.tsx       Nyaya Darshana team session UI
│   │   ├── WisdomResources.tsx Vedic/philosophical resource links
│   │   └── AuthPanel.tsx       Compact Firebase auth status
│   │
│   ├── stores/
│   │   ├── sessionStore.ts     Zustand: all session state + Dexie persistence
│   │   ├── userStore.ts        Zustand: user profile, preferences
│   │   └── authStore.ts        Zustand: Firebase auth state
│   │
│   └── lib/
│       ├── api.ts              evaluateQuestion() — the single HTTP call
│       ├── db.ts               Dexie v2 schema (5 tables: sessions, teamSessions, voicePrefs, fsrsCards, ttsCache)
│       ├── useElevenLabsTTS.ts EL TTS hook — accent-aware, emotion-aware, Dexie cache (el11: prefix)
│       ├── useOpenAITTS.ts     OpenAI tts-1-hd hook — Nova/Onyx, Dexie cache (oa2: prefix)
│       ├── useCartesiaTTS.ts   Cartesia Sonic-2 hook — session feedback 🔊 button, no cache
│       ├── useKokoroTTS.ts     Kokoro WASM TTS — browser-side, English only
│       ├── useVoiceSettings.ts Web Speech API hook + voice prefs
│       ├── useVoiceInput.ts    STT hook (webspeech + whisper modes)
│       ├── useAmbientAudio.ts  Binaural background audio (session page)
│       ├── useWikiImage.ts     Wikipedia contextual image for evaluation cards
│       ├── identity.ts         Local user ID generation (offline-first)
│       ├── firebase.ts         Firebase init (graceful stub if unconfigured)
│       └── firestoreSync.ts    Session sync to Firestore when online + authed
│
├── public/
│   ├── manifest.json      PWA manifest
│   └── favicon.svg
│
├── CLAUDE.md              Build, deploy, env vars, architecture decisions for Claude Code
├── ARCHITECTURE.md        This file
└── PRODUCT_ROADMAP.md     Features, release ideas, traceability matrix
```

---

## Summary

Cognitive Nav is a question-depth trainer. One interaction: you ask, the AI classifies the depth your question reached, tells you exactly what structural element would unlock the next depth, and you ask again. Five qualifying questions per gate wires that cognitive act into your default thinking.

The architecture is deliberately minimal: no custom backend, no server-side state, no database to manage. Everything the user does lives in their browser (Dexie/Zustand). The only server-side work is the LLM call (Groq) and audio generation (ElevenLabs), both proxied through Netlify Functions to keep keys off the client.

The rubric is the product. The AI is the rubric applier. The score is arithmetic. The prick is a precise redirect. Nothing is opinion.
