# Cognitive Nav — Product Roadmap

_Living document. Requirements Traceability Matrix + upcoming release ideas._

---

## Requirements Traceability Matrix — Current State

Each row: what the feature does, where it lives, what drives it, and its production status.

### Core Evaluation Engine

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| E-01 | Four-depth rubric (L1–L4) | As a learner, I want my question classified into one of four measurable cognitive depths so I know exactly where my thinking is | `depthRubric.ts` + `evaluate.ts` (SYSTEM_PROMPT) | **Live** |
| E-02 | Three gates (L1→L2, L2→L3, L3→L4) | As a learner, I want a clear threshold to cross, not a vague improvement target | `GATES` in `depthRubric.ts`, gate logic in `sessionStore.addReformulation` | **Live** |
| E-03 | The prick (surgical redirect) | As a learner, I want to know exactly what structural element my question missed, not a score | `prickText` from `evaluate.ts`, rendered in `PrickLoop.tsx` | **Live** |
| E-04 | Appreciation | As a learner, I want acknowledgment of what my question DID accomplish | `appreciation` field in `EvaluateResponse`, shown in evaluation card | **Live** |
| E-05 | Science insight | As a learner, I want to know which brain mechanism my question activated | `scienceInsight` field, shown in evaluation card with real research citations | **Live** |
| E-06 | Example hint | As a learner, I want to see what the next depth sounds like | `hint` field (concrete example question), shown when not qualified | **Live** |
| E-07 | Iron rule (borderline → lower) | As a product, we never gift a higher classification | Hard rule in system prompt, counter-examples for each boundary | **Live** |
| E-08 | Exam board calibration | As a medical student, I want evaluation calibrated to my specific exam standard | `examBoard` passed to evaluate function, clinical calibration section in system prompt | **Live** (NEET UG/PG/SS, USMLE 1/2/3, PLAB, MBBS Y1/Y2) |

### Session and Mastery

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| S-01 | 5-question mastery gate | As a learner, I want to know when a thinking pattern has become reflexive, not just tried once | `MASTERY_REQUIRED = 5` in `depthRubric.ts`, `levelMastery` in `Session` | **Live** |
| S-02 | Gate mastery celebration | As a learner, I want a real moment of recognition when a gate is mastered | Confetti + ring burst in `PrickLoop.tsx`, `gate1-mastered` phase in `DemoFlow.tsx` | **Live** |
| S-03 | Practice score (not intelligence score) | As a learner, I want a score that measures quality of inquiry, not my inherent ability | `computePracticeScore()` in `depthRubric.ts` — pure function of depth consistency + efficiency | **Live** |
| S-04 | Journey arc (visual progress) | As a learner, I want to see where I am in the journey at a glance | `JourneyArc` in `PrickLoop.tsx` — circles-only arc, target marker, label row | **Live** |
| S-05 | Level study panel | As a learner, I want to review the gate criteria before asking my next question | `LevelStudyPanel.tsx` — deep science + criteria cards, shown between questions | **Live** |
| S-06 | Session history | As a learner, I want to review my past sessions and see my improvement | `History.tsx` — session list, stats grid, exam board filters | **Live** |
| S-07 | Foundation mode (L1 target) | As a beginner, I want a mode where any question counts | `targetDepth === 1` → any question qualifies; no gate system | **Live** |
| S-08 | Offline-first sessions | As a mobile learner, I want sessions to work without internet | Dexie IndexedDB, Zustand persist, `offlineCreated` flag | **Live** |
| S-09 | Depth-aware context panel | As a learner, I want to build interest in my topic before asking questions at each gate | `ContextPanel` in `LevelStudyPanel.tsx` + `context.ts` Netlify function (Groq). Returns hook, 3 facts, 3 Google search links calibrated to topic + gate depth. Lazy-loaded on button click. | **Live** |

### Two App Modes

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| M-01 | General Epistemic mode | As a curious person, I want to go deep on any topic | `appMode: 'epistemic'`, any topic, no board calibration | **Live** |
| M-02 | Clinical Crucible mode | As a medical student, I want medical topics with exam-calibrated evaluation | `appMode: 'clinical'`, board selector, clinical calibration in eval prompt | **Live** |

### Voice System

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| V-01 | ElevenLabs human voice (Tier 1) | As a demo viewer, I want genuinely human narration, not synthetic TTS | `useElevenLabsTTS.ts` + `tts.ts` Netlify function; Matilda/Liam (en-US), Alice/Daniel (en-GB), Priyanka/Anant (hi-IN), Matilda/Josh (multilingual). Deliberately NOT Rachel/Charlie which are recognizable "AI demo" voices. Cache key `el11:` | **Live** (requires `ELEVENLABS_API_KEY`) |
| V-02 | Kokoro neural voice (Tier 2) | As a user without EL key, I want better-than-browser TTS | `useKokoroTTS.ts` — `kokoro-82M-v1.0`, WASM, ~45MB, cached. English only. | **Live** (English only) |
| V-03 | Web Speech API (Tier 3) | As a user on any browser, I want at least some narration | `useVoiceSettings.ts` — prioritises Microsoft Natural Online > Google | **Live** |
| V-04 | TTS cache (Dexie) | As a user, I want audio generated once and never again for the same line | Dexie `ttsCache` table; EL key `el11:{voiceId}:{model}:{format}:{hash}`, OpenAI key `oa2:{voice}:{hash}`. Cartesia NOT cached — each eval is unique. | **Live** |
| V-05 | Emotion-aware TTS | As a listener, I want the voice to feel different during celebration vs reflection | Stability/style mapped to dialogue `s` hint; different bitrates per register | **Live** |
| V-06 | Accent-aware voice selection | As a UK English user, I want British voices | `pickVoiceForLang()` — en-GB → Alice + Daniel; en-US → Matilda + Liam; hi-IN → Priyanka + Anant; other → multilingual model | **Live** |
| V-07 | Multilingual narration (18 languages) | As a non-English speaker, I want the demo narrated in my language | `DIALOGUE` object (en, hi, ta, te, kn, mr, es, pt, fr, de, ar) + `NARRATIONS` fallback | **Live** |
| V-08 | Voice input (STT) | As a user, I want to speak my question instead of typing, in any language | `useVoiceInput.ts` — WebSpeech mode + Whisper mode. Whisper passes language code; evaluation responds in the user's language. | **Live** |
| V-10 | Interactive guide Q&A | As a demo viewer, I want to ask the guide about how the app works in real-time | `guide-qa.ts` Netlify function + DemoFlow expandable panel. Guide answers in character, speaks via EL if configured. | **Live** |
| V-09 | Voice settings UI | As a user, I want to choose my preferred voice, language, rate | `VoiceSettings.tsx` — preset selector, language picker, guide + learner voice pickers | **Live** |
| V-11 | OpenAI tts-1-hd (Tier 0) | As a demo viewer, I want the best multilingual narration quality available | `useOpenAITTS.ts` + `openai-tts.ts` — Nova (guide), Onyx (learner), Shimmer (celebration). Auto language detection. Falls through to EL (Tier 1) if `OPENAI_API_KEY` not set. Cache prefix `oa2:`. | **Live** (requires `OPENAI_API_KEY`) |
| V-12 | Cartesia Sonic-2 session feedback voice | As a learner, I want to hear my evaluation read back to me immediately | `useCartesiaTTS.ts` + `cartesia-tts.ts` — 🔊 button on EvaluationCard reads appreciation + prickText. <135ms first chunk. Guide voice: Helpful Woman. Learner voice: Newsman. Not cached. | **Live** (requires `CARTESIA_API_KEY`) |

### UI and Experience

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| U-01 | Demo (DemoFlow) | As a visitor, I want to see the full game loop before committing | `DemoFlow.tsx` — 13 phase types, spotlight sync, voice narration | **Live** |
| U-02 | Animated depth selection | As a learner, I want choosing a target depth to feel intentional | Framer Motion cards, color transition, criterion preview | **Live** |
| U-03 | Gates accordion (Home) | As a learner, I want to understand the rules before playing | CSS max-height accordion (never AnimatePresence — see pitfalls) | **Live** |
| U-04 | Wikipedia contextual image | As a learner, I want a visual reference for what I just engaged | `useWikiImage.ts` → Wikipedia REST API → image card in evaluation result | **Live** |
| U-05 | PWA (installable) | As a mobile learner, I want this on my home screen | `manifest.json`, service worker, `apple-mobile-web-app-capable` | **Live** |
| U-06 | Responsive design (all viewports) | As a user on any device, I want the app to fit my screen | `overflow-x: hidden`, fluid containers `max-w-2xl lg:max-w-3xl xl:max-w-4xl`, `clamp()` typography | **Live** |
| U-07 | About page | As a visitor, I want to understand the philosophy and science behind the app | `About.tsx` — 8 sections, depth cards, Vedic foundation | **Live** |
| U-08 | Binaural ambient audio | As a session participant, I want subtle focus audio | `useAmbientAudio.ts` — active when authenticated | **Live** (auth-gated) |
| U-09 | Dark hero + paper body | As a user, I want an aesthetic that feels serious but warm | `bg-paper (#fefcf8)`, Manrope display, Plus Jakarta Sans body | **Live** |

### Auth and Sync

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| A-01 | Local identity (offline) | As a user, I want sessions to be mine even without signing in | `identity.ts` — UUID stored in localStorage | **Live** |
| A-02 | Firebase auth (optional) | As a user, I want my history to sync across devices | `firebase.ts` + `authStore.ts` — graceful stub if not configured | **Live** (optional) |
| A-03 | Firestore session sync | As an authed user, I want sessions backed up | `firestoreSync.ts` — syncs on session complete or page load | **Live** (when authed) |

### Team / Multi-User (Nyaya Darshana)

| ID | Feature | User Story | Implementation | Status |
|----|---------|-----------|----------------|--------|
| N-01 | Team session data model | As a team, we want to practice together | `TeamSession` type, `teamSessions` Dexie table | **Schema live, UI partial** |
| N-02 | Nyaya debate modes | As a team, we want structured debate formats | `NyayaDebateMode: 'vada' | 'jalpa' | 'vitanda'`, `nyayaRules.ts` | **Rules defined, UI partial** |
| N-03 | Collective depth | As a team, our collective depth is our weakest member | `computeCollectiveDepth()` — min of all member depths | **Logic live, UI partial** |
| N-04 | Prick chain (peer redirect) | As a team member, I want to send a prick to another member | `prickChain` in `TeamSession` type | **Schema live, UI partial** |

---

## Upcoming Release Ideas

Ordered by estimated value / effort ratio. Not committed dates — ideas for consideration.

### Release 2.0 — Depth Over Time

**Theme**: Make the practice score meaningful by tracking it over sessions.

| Idea | What it does | Why |
|------|-------------|-----|
| Topic mastery profile | Show `conceptCoverage: Record<string, DepthLayer>` per topic on the History page | Users can see which topics they've reached L3/L4 on. `UserProfile.conceptCoverage` already typed. |
| Session streak | Track consecutive days with qualifying questions | Creates daily habit loop. Dexie `sessions.createdAt` already stored. |
| Depth trajectory chart | Line chart of `trajectoryVector` within a session | Visual rhythm of how depth evolved during one session. |
| Comparative score history | Plot practice scores over time per topic | Shows whether training is making a measurable difference. |
| Personal prick library | Save pricked questions the user wants to revisit | Lightweight bookmarking. Already have `prickText` in reformulations. |

### Release 2.1 — Spaced Repetition (FSRS)

**Theme**: Surface the right topic at the right time to prevent regression.

| Idea | What it does | Why |
|------|-------------|-----|
| FSRS scheduling | Use `fsrsCards` Dexie table (already in schema v2) to schedule topic review | The schema exists. Algorithm implementation is the only missing piece. |
| Due today panel | Show topics due for review on Home page | Turns one-time sessions into a daily practice queue. |
| Mastered vs due distinction | Separate "I can ask at L3" from "I can ask at L3 today without prompting" | True mastery requires demonstrating without the system suggesting it. |

### Release 2.2 — Nyaya Darshana (Full Team Mode)

**Theme**: Make the prick a gift between people, not just from AI.

| Idea | What it does | Why |
|------|-------------|-----|
| Live room with WebSocket | Real-time member depth display | `TeamSession` data model exists. Need WebSocket layer (Ably, Supabase Realtime, or Pusher). |
| Cross-prick UI | Member A sends a prick to Member B | `prickChain` already in TeamSession type. Need sender/receiver UI. |
| Collective depth gate | Room only advances when all members reach the gate | `computeCollectiveDepth()` already implemented. |
| Vada / Jalpa / Vitanda debate modes | Different structured formats: Vada = truth-seeking, Jalpa = debate to win, Vitanda = pure refutation | `nyayaRules.ts` has mode definitions. UI to be built. |
| Session invite by link | Join a room via URL | Simple: encode roomId in URL, redirect to Session page with room join flow. |

### Release 2.3 — Clinical Depth Expansion

**Theme**: Make Clinical Crucible the best-in-class exam prep tool for high-stakes medical exams.

| Idea | What it does | Why |
|------|-------------|-----|
| Case-based sessions | Start from a clinical vignette, not just a topic | Mirrors USMLE Step 2 and PLAB format. |
| Differential diagnosis mode | Questions must eliminate competing diagnoses, not just trace one mechanism | L3 in clinical = holding two diagnoses at once and asking what breaks the symmetry. |
| Management decision gates | Add a Gate 2.5 for management decisions between mechanism and systems | Particularly relevant for NEET SS and USMLE 2/3. |
| Topic bank with exam-weighted suggestions | Curate topics by frequency in each exam board's actual question bank | High-yield topic coverage, not just arbitrary curiosity. |
| Performance by system (cardiology, neuro, etc.) | Show which body systems the user has reached L3 on vs still at L1/L2 | Targeted study: know your weakest system at a glance. |

### Release 2.4 — Voice and Accessibility

**Theme**: Make the app usable by someone who cannot type or see the screen.

| Idea | What it does | Why |
|------|-------------|-----|
| Full voice mode | All interaction via voice: speak question → hear depth result + prick | Whisper STT already proxied. ElevenLabs already integrated. Need flow wiring. |
| Screen-reader audit | ARIA labels on all interactive elements, focus management | Accessibility is not optional for an educational tool. |
| Language-specific Web Speech quality detection | Detect if good neural voices are available in the browser; if not, fall back to EL | Web Speech quality varies wildly by browser + OS. |
| Keyboard navigation throughout | All interactions reachable without mouse | Already partially true; needs a full audit. |

### Release 3.0 — Institutional / Educator Access

**Theme**: Give educators a way to use Cognitive Nav as a teaching instrument, not just a personal tool.

| Idea | What it does | Why |
|------|-------------|-----|
| Teacher dashboard | See aggregate depth trajectories for a class | Educator can see which students are stuck at L1, which have reached L3. |
| Curriculum path builder | Sequence topics and set per-topic target depths | Structured curriculum: "For this week, reach L3 on renal physiology." |
| Anonymous depth analytics | View class depth distribution without individual identification | Privacy-safe aggregate view. |
| Export session data | CSV or JSON of sessions for use in institutional LMS | Interoperability with existing tools. |
| LMS integration (Canvas, Moodle) | Embed sessions into existing course environments | Reduces friction for institutional adoption. |

---

## Things deliberately NOT on the roadmap

These come up often but are out of scope for this product:

| Thing | Why not |
|-------|---------|
| Content library (notes, articles, videos) | Cognitive Nav is a trainer, not a content platform. Adding content shifts the product identity entirely. |
| Answer checking (right/wrong) | The product philosophy is: questions, not answers. Answer evaluation is a different product. |
| AI tutoring / "explain this to me" | The prick is the explanation. Full explanations remove the productive struggle. |
| Gamification (badges, leaderboards) | The mastery gate IS the game. Adding badges on top cheapens the signal. |
| Native mobile app | PWA covers the mobile use case. Native app justified only if PWA proves insufficient for key flows. |
| Social feed / sharing by default | Inquiry is personal. Social features should be opt-in and purpose-built (team rooms) not generic. |
