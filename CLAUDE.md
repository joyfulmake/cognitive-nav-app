# Cognitive Nav

Depth-graded epistemic engine. Two apps in one: General Epistemic (any topic) + Clinical Crucible (medical, NEET/USMLE/PLAB calibrated). The question IS the answer. Target depth is chosen by the user; evaluation tracks progress toward it as a game.

## Living documentation — always keep in sync

| File | Purpose | Update when |
|------|---------|-------------|
| `CLAUDE.md` | Build, deploy, env vars, technical decisions | After any change to deploy, env, or implementation detail |
| `ARCHITECTURE.md` | Full technical and product architecture | After any structural change to data flow, file structure, or AI integration |
| `PRODUCT_ROADMAP.md` | RTM of current features + upcoming release ideas | When shipping a feature (move to Live) or adding a new idea |

## Live URL

https://cognitive-nav.pages.dev

## Cloudflare Pages project

`cognitive-nav`

## Deploy command

```bash
npm run build
npx wrangler pages deploy dist --project-name cognitive-nav
```

## Required environment variables

Set via Cloudflare dashboard → cognitive-nav → Settings → Environment variables,
or via CLI: `npx wrangler pages secret put KEY_NAME --project-name cognitive-nav`

| Variable | Purpose | Required |
|----------|---------|----------|
| `GROQ_API_KEY` | LLM evaluation (`evaluate.ts`) + Whisper STT (`whisper.ts`) | Yes |
| `ELEVENLABS_API_KEY` | Human TTS voices in demo narration (`tts.ts`) | **Required** — demo experience degrades to robotic voice without it |
| `OPENAI_API_KEY` | OpenAI tts-1-hd TTS for demo narration (`openai-tts.ts`) | Optional — Tier 0 voices (Nova/Onyx), best multilingual quality |
| `CARTESIA_API_KEY` | Cartesia Sonic-2 TTS for live session feedback (`cartesia-tts.ts`) | Optional — enables 🔊 button on EvaluationCard |

- Groq free tier: 14k requests/day. Key at console.groq.com/keys
- ElevenLabs free tier: 10k chars/month. Key at elevenlabs.io → Settings → API Keys
- EL free tier is sufficient: demo audio is cached in Dexie after first generation; each device only calls EL once per demo run
- Cartesia free tier: 10k chars/month. Key at play.cartesia.ai → Settings. **Not cached** — each session eval is unique.
- `ANTHROPIC_API_KEY` is NOT used — replaced with Groq on 2026-06-02

**VITE_ vars** (Firebase, if used) are baked at build time. Always `npm run build` after changing them.

## Cartesia TTS (session feedback voice)

`src/lib/useCartesiaTTS.ts` → `functions/api/cartesia-tts.ts`

- Model: `sonic-2`, ultra-low latency (<135ms first chunk)
- Used in: EvaluationCard (🔊 button reads appreciation + prickText aloud)
- No Dexie cache — each eval result is unique
- Voice IDs (update from play.cartesia.ai/voices if they change):
  - Guide: `b7d50908-b17c-442d-ad8d-810c63997ed9` (Helpful Woman, female)
  - Learner: `694f9389-aac1-45b6-b726-9d9369183238` (Newsman, male)
- Speed: `'slowest'|'slow'|'normal'|'fast'|'fastest'` string enum
- Emotion: array of `'positivity:high'`, `'curiosity:low'`, etc.
- `__experimental_controls` only sent when speed ≠ 'normal' or emotion[] not empty

## AI provider

**Groq** — LLM evaluation and Whisper STT:
- Evaluation: `llama-3.3-70b-versatile`, `response_format: { type: 'json_object' }`
- Whisper: `whisper-large-v3-turbo`, accepts base64 audio, returns transcript text
- Same `GROQ_API_KEY` for both

## Cloudflare Pages Functions

| File | Endpoint | Purpose |
|------|----------|---------|
| `functions/api/evaluate.ts` | `POST /api/evaluate` | Groq LLM depth evaluation proxy — enhanced with diff-dx Gate 2 and management Gate 3 clinical criteria |
| `functions/api/whisper.ts` | `POST /api/whisper` | Groq Whisper STT — accepts `{ audioBase64, mimeType, language? }` |
| `functions/api/tts.ts` | `POST /api/tts` | ElevenLabs TTS proxy — accepts `{ text, voice_id, model_id, style, stability, output_format }`, returns audio/mpeg |
| `functions/api/cartesia-tts.ts` | `POST /api/cartesia-tts` | Cartesia Sonic-2 TTS proxy — accepts `{ text, voice_id, language, speed, emotion[] }`, returns audio/mpeg (no cache) |
| `functions/api/guide-qa.ts` | `POST /api/guide-qa` | Interactive guide Q&A — accepts `{ question, lang }`, answers in character as the Guide, max 120 tokens |
| `functions/api/openai-tts.ts` | `POST /api/openai-tts` | OpenAI tts-1-hd proxy — accepts `{ text, voice, speed }`, returns audio/mpeg (cached in Dexie `oa2:` prefix) |
| `functions/api/context.ts` | `POST /api/context` | Depth-aware context generator — accepts `{ topic, gate, lang }`, returns `{ hook, facts[], searches[] }` via Groq |
| `functions/api/vignette.ts` | `POST /api/vignette` | Clinical case vignette generator — accepts `{ topic, examBoard }`, returns `{ vignette, differentials[] }` via Groq |

## Voice input UI (Wispr-style — redesigned 2026-06-05)

**PrickLoop.tsx (session page)**:
- Mic button: 52px filled circle, co-equal with Submit in the action row below the textarea
- When listening: pulsing scale animation, square stop icon inside
- Waveform: 8 animated bars in the action row (replaces tiny corner waveform)
- AnimatePresence: waveform fades in/out smoothly as listening state toggles
- Textarea: clean (no waveform inside), border glows on listening/filled

**Home.tsx (topic input)**:
- Mic button: 44px circle, inside right of input
- When listening: full-width animated waveform bar below the input (pill background)

**VoiceSettings.tsx**:
- Added "AI voice providers" section at top — shows ElevenLabs + Cartesia with purpose + setup instructions

## Voice system — four-tier cascade

Tier 0 → Tier 1 → Tier 2 → Tier 3 → Tier 4, each a fallback of the previous.

### Tier 0: OpenAI tts-1-hd (optional — highest multilingual quality)

`src/lib/useOpenAITTS.ts` → `functions/api/openai-tts.ts`

- Requires `OPENAI_API_KEY` in CF Pages env — set via wrangler or dashboard
- Model: `tts-1-hd`, auto-detects language from text, no per-language voice IDs needed
- Guide voice: `nova` (warm, clear female — natural in English AND Hindi/Tamil/etc.)
- Learner voice: `onyx` (deep, resonant male — very distinct texture from nova; contrast is the point)
- Celebration (s ≥ 1.0): Guide switches to `shimmer` (brighter, expressive) — ok at phase breaks
- Speed modulation: 0.88 (deep reflection) → 1.0 (normal) → 1.10 (energised) → 1.18 (celebration)
- Cache prefix: `oa2:` — stored in Dexie `ttsCache` as ArrayBuffer
- If OPENAI_API_KEY not set: function returns 503 with `code: 'NO_KEY'`, hook marks self unconfigured, narration falls through to Tier 1 (ElevenLabs)
- Badge: `✦ Nova & Onyx · HD` when active
- **Testing**: Set `OPENAI_API_KEY` via `npx wrangler pages secret put OPENAI_API_KEY --project-name cognitive-nav`, then redeploy. Listen to first run demo; audio caches in Dexie after first play.

### Tier 1: ElevenLabs (real trained human voices)

`src/lib/useElevenLabsTTS.ts`

**Accent-aware voice selection** (set by user's language preference):

Voice design rule: DO NOT use Rachel (21m00Tcm4TlvDq8ikWAM) or Charlie (IKne3meq5aSn9XLyUdCD) — these are ElevenLabs' most-recognized "AI demo voices" and immediately sound synthetic. Cache key prefix `el11:` (bumped 2026-06-06).

| Language | Guide | Learner | Model |
|----------|-------|---------|-------|
| en-US | Matilda `XrExE9yKIg1WjnnlVkGX` (warm, upbeat American) | Liam `TX3LPaxmHKxFdv7VOQHJ` (youthful, confident) | `eleven_turbo_v2_5` |
| en-GB | Alice `Xb7hH8MSUJpSbSDYk0k2` (British professional educator, strong RP) | Daniel `onwK4e9ZLuTAKqWW03F9` (BBC formal broadcaster, deep RP) | `eleven_turbo_v2_5` |
| hi-IN | Priyanka `T536A2SFCG4AEDVTRucQ` (warm Indian female, native Hindi) | Anant `T3s9anIvGvoeogXyFyMt` (clear, warm Indian male) | `eleven_multilingual_v2` |
| Other | Matilda `XrExE9yKIg1WjnnlVkGX` (warmth translates naturally) | Josh `TxGEqnHWrfWFTfGW9XjX` (deep, clear, young) | `eleven_multilingual_v2` |

**Hindi note**: Priyanka + Anant are Voice Library voices (community, native speakers). Requires EL Starter tier ($5/mo). On free tier they error-out and the demo degrades to Kokoro/Web Speech. Dorothy (`ThT5KcBeYPX3keUQqHPh`) and George (`JBFqnCBsd6RMkjVDRZzb`) are deprecated (no longer in EL premade list as of 2026-06-06).

**Emotion-aware audio settings** (driven by dialogue line `s` speed hint):

**Critical ElevenLabs parameter insight (updated 2026-06-06):**
- The old mistake: chasing "close to training data" by flooring style at 0.08–0.10. Result: flat, robotic — because flat IS what we associate with machines.
- Real humans are warm even when quiet. Warmth requires style ≥ 0.22, not 0.08.
- `style` 0.50+ = theatrical, performing emotion rather than feeling it — avoid.
- `stability` 0.30–0.52 = natural human variation. Above 0.52 = artificially consistent (robot-like).
- `similarity_boost` sweet spot: 0.78–0.82. Above 0.88 = over-compressed artifacts.

| Register | `s` value | stability | style | bitrate |
|----------|----------|-----------|-------|---------|
| Celebration | ≥ 1.0 | 0.30 | 0.48 | 192kbps |
| Energised/warm | ≥ 0.90 | 0.34 | 0.43 | 192kbps |
| Teaching | ≤ 0.88 | 0.40 | 0.36 | 192kbps |
| Wonder | ≤ 0.85 | 0.44 | 0.30 | 192kbps |
| Deep reflection | ≤ 0.81 | 0.50 | 0.22 | 192kbps |
| Conversation | default | guide 0.44 / learner 0.38 | 0.30 | 192kbps |
| Non-English celebration | s≥1.0 | baseStability−0.08 | 0.34 | 192kbps |
| Non-English energised | s≥0.90 | baseStability−0.04 | 0.28 | 192kbps |
| Non-English default | any | guide 0.50 / learner 0.46 | 0.22 | 192kbps |
| Non-English reflection | s≤0.81 | baseStability+0.04 | 0.17 | 192kbps |

`similarity_boost: 0.82`, `use_speaker_boost: true`. Cache version prefix `el11:`.

**Key implementation details:**
- `speakLine(text, role, lang, speedHint)` — the single public method for DemoFlow
- `pickVoiceForLang(role, lang)` — selects voice ID + model based on BCP-47 language code
- `emotionSettings(s, baseStability, isEnglish)` — maps `s` → stability + style + output_format
- `availableRef` is `useRef` (NOT useState) — never triggers narration effect re-runs
- Cache key: `el:{voiceId}:{modelSuffix}:{formatTag}:{textHash}` — different quality = different cache entry
- Audio stored as `ArrayBuffer` in Dexie `ttsCache` — each line generated once, cached forever
- Demo script ≈ 3k chars, well within ElevenLabs 10k free tier

### Tier 2: Cartesia Sonic-2 (DemoFlow narration — 2026-06-30)

`src/lib/useCartesiaTTS.ts` → `functions/api/cartesia-tts.ts`

- Requires `CARTESIA_API_KEY` in CF Pages env (same key used by EvaluationCard 🔊 button)
- Guide voice: Helpful Woman `b7d50908-b17c-442d-ad8d-810c63997ed9`; Learner voice: Newsman `694f9389-aac1-45b6-b726-9d9369183238`
- Consistent voice pair across ALL demo phases (including newly-added `gate1-study`) — solves speaker continuity
- No Dexie cache in demo narration (same as EvaluationCard); each line fetched live from Cartesia Sonic-2
- Falls back gracefully to Tier 3 (Kokoro) when `CARTESIA_API_KEY` not set (503/NO_KEY) or on error
- Badge: `✦ Helpful Woman & Newsman · Sonic` when active
- **Free tier**: 10k chars/month. One full demo ≈ 5k chars. Two plays per month on free tier.

### Tier 3: Kokoro-82M (browser WASM, free, offline after first load)

`src/lib/useKokoroTTS.ts`

- `kokoro-js` package, dynamically imported — never in initial bundle
- Vite alias: `'kokoro-js'` → `node_modules/kokoro-js/dist/kokoro.web.js` (browser WASM build)
- Model: `onnx-community/Kokoro-82M-v1.0`, dtype `q4` (~45MB, cached in browser Cache API)
- Guide voice: `af_bella`; Learner voice: `am_adam`; celebration: `af_sky`; reflection: `af_heart`/`am_michael`
- **English only** — falls back to Tier 4 for other languages
- Module-level singleton — model loads once, shared across all components
- UI: "Upgrade to AI voices ✦" button appears in demo narration row; progress bar during load

### Tier 4: Web Speech API (browser built-in)

- Always available, no API key, supports all languages
- Guide/Learner differentiated by pitch/rate adjustments
- Separate Guide voice and Learner voice pickers in VoiceSettings
- `learnerVoiceName` stored in Dexie `voicePrefs` table
- **Voice priority** (upgraded 2026-06-05): Microsoft Natural Online > Microsoft Natural > Google > default
  - Edge on Windows: Microsoft Aria/Guy Online (Natural) — genuinely human neural quality
  - Chrome: Google US/UK English voices — decent quality
  - Fallback: first available voice for the language

### Voice input (STT)

`src/lib/useVoiceInput.ts` — three modes:
- `mode: 'auto'` (default) — tries Web Speech API first (interim results live as user speaks); on permanent error (network/permission/no-support) automatically falls back to Whisper batch mode
- `mode: 'webspeech'` — Web Speech only, shows text in real-time as user speaks (`interimResults: true`, `continuous: false`)
- `mode: 'whisper'` — batch: MediaRecorder → base64 → `/.functions/api/whisper` → text

`onInterim(text)` callback: called with live partial text during Web Speech — component shows it immediately in the input field. Empty string = clear interim (called on `onend` and after final result).

Components use `voiceBaseRef` to track the text in the field when mic starts; interim text is shown as `base + interim`; final result replaces the interim portion.

## DemoFlow component

`src/components/DemoFlow.tsx` — animated full game loop on the Home page.

### Phases (in order)

1. `topic-select` — chip suggestions + text input
2. `target-select` — depth layer cards (L2/L3/L4)
3. `intro-question` — TypeWriter showing first question
4. `l1-detected` — prick shown, mastery bar at 0
5. **`gate1-study`** — **THE KEY PHASE**: gate criteria list + deep science + calibration example
6. `gate1-q` × 2 — TypeWriter questions with mechanic label
7. `gate1-progress` × 2 — AnimatedMasteryCount filling 0→2, 3→5
8. `gate1-mastered` — celebration
9. `gate2-intro` — challenge escalation
10. `gate2-q` × 2 — systemic questions
11. `gate2-progress` × 2
12. `gate2-mastered`
13. `completion` — score + stats + humility quote

### Dialogue system

`DIALOGUE` object: `Record<language, Record<phaseType, DL[]>>`

`DL` type: `{ r: 'g'|'l', t: string, v?: KokoroVoiceId, s?: number, spo?: string }`
- `v` — Kokoro voice override per line (e.g. `af_sky` for celebration)
- `s` — speed override 0.77–1.07 (slow = reflective, fast = excited)
- `spo` — spotlight element ID to lock visual to this line

Full English dialogue rewritten as genuine two-person conversation: greeting → app discovery → science (Hebb/myelination) → rules → play-through all levels → transformation arc. No AI-tutorial clichés ("Great instinct", "Exactly that"). Each line carries `v`/`s`/`spo` metadata.

Other languages (hi, ta, te, kn, mr, es, pt, fr, de, ar, zh, ja, ko, ru, tr, id) have `{ r, t }` only — ElevenLabs speaks them via `eleven_multilingual_v2` with Rachel/Charlie voices.

### Voice cascade in narration loop

```
for each line:
  Tier 0: if OpenAI configured  → speak(text, nova|onyx, speedHint)   [cached in Dexie]
  Tier 1: if ElevenLabs configured → speak(text, role-voice, styleHint) [cached in Dexie]
  Tier 2: if Cartesia configured → speak(text, HelpfulWoman|Newsman, speedHint) [no cache]
  Tier 3: if Kokoro loaded + English → speak(text, kokoro-voice, speed)
  Tier 4: Web Speech API
```

`elAvailableRef` and `cartesia.canTry()` are ref-based — NOT in effect dependency array. No re-run when availability is determined.

### Spotlight sync

`spotlightOverride` state set at line start from `spo` metadata. When a line says "look at the prick", the prick element glows. Reset on phase change.

### Header

Minimal: 🔊 Voice ⏸ ✕ — essential controls only. Voice quality badge (Human ✦ / AI ✦ / Upgrade button) is in the narration indicator row below the header, not the header itself.

## Dexie schema (v2)

`src/lib/db.ts` — 5 tables:

| Table | Key | Notes |
|-------|-----|-------|
| `sessions` | `id` | All game sessions |
| `teamSessions` | `id` | Nyaya Darshana team rooms |
| `voicePrefs` | `id='user'` | Language, voice, rate, pitch, preset, learnerVoiceName |
| `fsrsCards` | `id` | Spaced repetition cards (future) |
| `ttsCache` | `key` | ElevenLabs audio cache. key=`el:{voiceId}:{hash}`, audio=`ArrayBuffer` |

Version bump from 1→2 added `ttsCache`. Existing data preserved.

**Pitfall**: Store TTS audio as `ArrayBuffer` (not `Uint8Array`). `buf.slice(0)` creates a clean copy before storing. `new Blob([audioBuf])` plays correctly from cache. Uint8Array with offset causes silent playback failures.

## Gates accordion (Home.tsx)

Standalone `<div>` with `<button type="button">` and CSS `max-height` transition (`0px` → `2000px`, `cubic-bezier(0.4,0,0.2,1)`). Completely independent of any framer-motion component — framer-motion v12 silently fails `AnimatePresence` exit animations in some conditions. Content stays in DOM; chevron rotates 180° on open. `setShowRules(r => !r)` functional form.

## Journey Arc (PrickLoop.tsx)

Circles-only arc — no tag labels beside/below circles (they crowded at <380px). Structure:
- Row of circles: `L1 ✓ ─── L2 (current, pulsing) ─── L3 ─── L4`
- Target marker: small animated ▲ below target circle
- Label row below arc: "L2 · Relational — now" left, "target L4 · Wisdom" right
- Works at 280px+

## Responsive design (RWD)

All major grids have responsive breakpoints using Tailwind's `min-[Xpx]:` syntax:

**Container widths** (updated 2026-06-05):
- Home: `max-w-2xl lg:max-w-3xl xl:max-w-4xl` with `px-5 sm:px-8 lg:px-10`
- Session: `max-w-5xl` with `px-4 sm:px-6 lg:px-8`
- About: `max-w-2xl lg:max-w-3xl` with `px-5 sm:px-8 lg:px-10`

**Overflow protection**: `html` and `body` both have `overflow-x: hidden`. Body also has `word-break: break-word`. Base font size is `clamp(15px, 1.8vw+11px, 17px)`.

| Component | Narrow (<360px) | Wide |
|-----------|----------------|------|
| Home `1×/5×/∞` grid | `grid-cols-1`, row layout | `min-[380px]:grid-cols-3` |
| DemoFlow target cards | stacked list | `min-[360px]:grid-cols-3` |
| History stats | merged 2×3 grid | same |
| VoiceSettings languages | `grid-cols-1` | `min-[360px]:grid-cols-2` |
| DemoFlow header | 4 controls (🔊 Voice ⏸ ✕) | same — no overflow |
| PrickLoop submit row | `flex-wrap`, hint hidden | full |

## About page

`src/pages/About.tsx` — route `/about`. Linked from Home footer.

Sections: Why questions not answers · The four depths (visual cards) · The five crossings (Hebb + Bengtsson) · The gift of the redirect · The study panel is the game · No failure only discovery · This is for anyone · Vedic foundation.

## Core mechanic

Four depth layers: Factual (1) → Relational (2) → Systemic (3) → Wisdom (4).

User selects **target depth** before starting. AI evaluates each question against three gates:
- **Gate 1** (L1→L2): Mechanism named — explicitly identifies cause or interaction
- **Gate 2** (L2→L3): Conditions engaged — specific failure mode, edge case, competing mechanism
- **Gate 3** (L3→L4): Philosophy reached — questions the design assumptions of the system itself

`isResolved` computed server-side: `depthScore >= targetDepth`. Model does not decide this.

## Mastery mechanic

Each gate requires `MASTERY_REQUIRED=5` qualifying questions. `getActiveGate` / `isMasteryComplete` in `depthRubric.ts`. L1 target = foundation mode (no gate system, any 5 questions).

## Gate strictness

Iron rule in system prompt: **when borderline, classify LOWER always**. Counter-examples included for each gate boundary.

## Scoring

`computePracticeScore(trajectoryVector, targetDepth)`:
- Below target: 0–55 (partial credit)
- Reaches target: 60–100 (efficiency bonus)

Score = quality of inquiry practice, not intelligence.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind (PWA)
- **State**: Zustand + TanStack Query + Dexie.js (IndexedDB)
- **AI eval**: Groq → Cloudflare Pages Function proxy (`/api/evaluate`)
- **TTS**: ElevenLabs → Cloudflare Pages Function proxy (`/api/tts`, cached in Dexie)
- **STT**: Groq Whisper → Cloudflare Pages Function proxy (`/api/whisper`)
- **Auth**: Firebase (optional, graceful fallback to local identity)
- **Storage**: Dexie.js (offline-first)

## Key files

| File | Purpose |
|------|---------|
| `functions/api/evaluate.ts` | Groq LLM evaluation (enhanced: diff-dx + management gates) |
| `functions/api/tts.ts` | ElevenLabs TTS proxy |
| `functions/api/whisper.ts` | Groq Whisper STT proxy |
| `functions/api/vignette.ts` | Clinical vignette generator — case-based session mode |
| `src/core/clinicalBodySystems.ts` | 13 body system types, color tokens, `classifyTopicToSystem()` |
| `src/lib/db.ts` | Dexie schema v2 (5 tables including ttsCache) |
| `src/lib/useElevenLabsTTS.ts` | EL TTS hook with Dexie cache, ref-based availability |
| `src/lib/useKokoroTTS.ts` | Kokoro WASM TTS, module singleton |
| `src/lib/useVoiceSettings.ts` | Web Speech TTS hook, Dexie prefs |
| `src/lib/useVoiceInput.ts` | STT hook (webspeech + whisper modes) |
| `src/core/depthRubric.ts` | Layer metadata, criteria, scoring |
| `src/core/types.ts` | All types |
| `src/pages/Home.tsx` | Depth selector, gates accordion, demo, topic input |
| `src/pages/About.tsx` | Philosophy/science page |
| `src/pages/History.tsx` | Session history + stats |
| `src/components/DemoFlow.tsx` | Demo phases, dialogue, voice cascade |
| `src/components/PrickLoop.tsx` | Session loop, EvaluationCard, JourneyArc |
| `src/components/LevelStudyPanel.tsx` | Gate criteria study panel (before next question) |
| `src/components/VoiceSettings.tsx` | Voice config UI (Guide + Learner voice pickers) |
| `src/stores/sessionStore.ts` | Session state + Dexie persistence |

## Theme (warm nature palette — 2026-06-05)

Base canvas feels like sunlit handmade paper. Cards like warm cream/linen. L3 ocean-blue replaces corporate blue.

| Token | Value | Notes |
|-------|-------|-------|
| `ink` | `#1c1a14` | Warm charcoal (rich dark soil) — was cold purple `#1a1825` |
| `paper` | `#fdf8f0` | Warm linen-cream — was almost-white `#fefcf8` |
| `line` | `#e4dace` | Warm reed tone |
| `muted` | `#8a7d6e` | Warm stone-brown |
| `depth-3` | `#1a5c8a` | Ocean/Mediterranean blue — was corporate `#0c447c` |
| Card bg | `#fffcf4` | Warm cream (`.card`, `.card-raised`) |
| `card-premium` | `#fffcf4 → #faf4e6` | Golden gradient |
| Selection | `#b86a14` | Warm amber |
| Focus ring | `#b86a14` | Warm amber |
| `depthRubric.ts` L3 | `color: #1a5c8a`, `bgColor: #edf4fa` | Updated to match `depth-3` |
| Body background | `linear-gradient(180deg, rgba(184,106,20,0.055) 0%, transparent 28%) + #fdf8f0` | Warm breath from top |
| Prick card border | `5px solid targetMeta.color` | Elevated presence — most important UI moment |
| LevelStudyPanel header | `bgColor` with colored left-border when open | Lighter than full solid |

## Fonts

- Display: **Manrope** — headings, `wght@500;600;700;800`
- Mono: **DM Mono** — labels, scores, code
- Sans: **Plus Jakarta Sans** — body (warm, rounded, with italic variants)
- Devanagari: **Noto Sans Devanagari** — Sanskrit verse, `font-devanagari` Tailwind class

## Demo narration robustness (fixed 2026-06-07 — TRUE root cause)

**Root cause of demo hang (2026-06-07):** `await db.ttsCache.put(...)` in `speakRaw` ran BEFORE audio playback with no timeout. Concurrent `prefetch` calls wrote to the same IndexedDB object store, causing write contention that blocked `put()` indefinitely. The audio safety timeout was unreachable while `put()` was blocked — the narration loop hung forever. The old `lineCapTimer` approach (setTimeout + `lineCapFired` flag) could not interrupt an in-flight `await`.

**Fix (2026-06-07):**
- Module-level `_memCache = new Map<string, ArrayBuffer>()` in `useElevenLabsTTS.ts` — speakRaw and prefetch check memory first (synchronous, never blocks)
- Dexie reads use `Promise.race` with 2s timeout — skip IndexedDB if contended, not hang
- Dexie writes are fire-and-forget (`.catch(() => {})`) — audio plays immediately, IndexedDB catches up in background
- `lineCapTimer` replaced with `Promise.race` per tier in `DemoFlow.tsx` — `setTimeout + flag` cannot interrupt in-flight awaits; `Promise.race` can

**Remaining timeouts:**
- **EL audio playback**: `Math.max(text.length * 90, 2500)` ms safety on `el.onended`
- **OpenAI audio playback**: same safety timeout pattern (floor 2500ms, was 8000ms)
- **Web Speech**: `Math.max(text.length * 65, 2500)` ms safety + `u.onerror = done`
- **EL fetch**: 15s AbortController; **OpenAI fetch**: 12s AbortController
- **Per-tier outer cap**: `Promise.race(speakLine(...), timeout(max(text.length * 130, 5000)))` — defense in depth (was 12000ms, reduced to 5000ms)

`voices.length` removed from narration effect deps — voice loading no longer restarts narration mid-phase. `voicesRef.current` provides the latest list without re-triggering.

**OpenAI TTS fix (2026-06-07):** `useOpenAITTS.ts` had the same blocking Dexie awaits as EL — applied identical `_memCache` fix. This was causing the remaining hang even after the EL fix, because Tier 0 (OpenAI) was tried first and its Dexie `get/put()` had no timeout. Also fixed safety floor from `max(8000, ...)` to `max(text.length*90, 2500)`.

**Web Speech voice differentiation (2026-06-07):** Widened guide/learner rate+pitch gap for single-voice devices (e.g. Hindi with only one Web Speech voice). Guide: rate ×0.84, pitch ×0.78. Learner: rate ×1.15, pitch ×1.24. Previously ×0.88/×0.82 and ×1.10/×1.18.

`voices.length` removed from narration effect deps — voice loading no longer restarts narration mid-phase. `voicesRef.current` provides the latest list without re-triggering.

**Narration prefs deps fix (2026-06-06)**: `prefs.language`, `prefs.rate`, `prefs.pitch`, `prefs.voiceName`, `prefs.learnerVoiceName`, and `kokoro.ready` removed from narration effect deps. Each is now shadowed by a stable ref (`prefsRef`, `kokoroReadyRef`) updated via its own lightweight effect. Root cause: Dexie (IndexedDB) loads saved prefs asynchronously ~50ms after mount — if the user had saved a non-default language, these fields changed after the effect ran, restarting narration mid-phase and making the demo appear frozen at whichever phase was active. Narration now only re-triggers on: `open`, `phaseIdx`, `speakEnabled`, `showVoiceSettings`.

**elVoiceName display fix (2026-06-06)**: subtitle row was showing "Dorothy"/"George" for en-GB while actual voices are Alice/Daniel. Updated `elVoiceName()` to return correct names and added Hindi (Priyanka/Anant).

## VoiceSettings layout (fixed 2026-06-06)

Save & Preview buttons moved to the **top** of VoiceSettings (directly below the header) — always visible without scrolling. Previously they were at the bottom, hidden below fold on short screens.

## Known pitfalls

- **UK/en-GB voice not being used**: `pickRoleVoice` (DemoFlow) and `speak` (useVoiceSettings) must build the voice pool from exact locale (`en-GB`) first, before falling back to root (`en`). Using only `lang.split('-')[0]` makes all English voices pool together and US voices win. Fixed 2026-06-05: build `exactPool` from `lang` first, `rootPool` as fallback.
- **VoiceSettings scroll-after-save**: when onClose restarts the demo (`setPhaseIdx(0)`), the tall settings panel collapses but the viewport doesn't scroll. Fixed: call `demoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` with 80ms delay in the onClose handler.
- **VoiceSettings height inside DemoFlow**: no height constraint means it can push content far below viewport. Fixed: wrap in `div` with `maxHeight: 'min(75vh, 580px)'` + `overflow-y-auto`.
- **framer-motion v12 AnimatePresence exit**: silently fails in some conditions. Use CSS `max-height` transitions for critical show/hide. Never use `AnimatePresence` for the gates accordion.
- **Dexie ttsCache write contention (FIXED 2026-06-07)**: Never `await db.ttsCache.get/put(...)` without a timeout before playing audio. Both `useElevenLabsTTS.ts` and `useOpenAITTS.ts` had this bug — concurrent prefetch writes to the same IndexedDB object store cause write contention. Fix: module-level `_memCache: Map<string, ArrayBuffer>` in both hooks; Dexie reads use `Promise.race` with 2s timeout; Dexie writes fire-and-forget.
- **lineCapTimer cannot interrupt awaits**: `setTimeout + lineCapFired` pattern is broken — setting the flag doesn't abort an in-flight `await`. Use `Promise.race(speakLine(...), makeTierTimeout(ms))` instead. Fixed 2026-06-07.
- **tierCap too high**: `max(text.length*130, 12000)` = 12s minimum per tier. For a 22-char line, all 3 tiers hanging = 36s apparent freeze. Reduced to `max(text.length*130, 5000)` = 5s minimum. Fixed 2026-06-07.
- **Dexie ttsCache**: store as `ArrayBuffer` not `Uint8Array`. `Uint8Array.buffer` may have offset.
- **ElevenLabs availability**: use `useRef` not `useState` for the available flag — putting it in useEffect deps causes narration to restart mid-line.
- **Kokoro English-only**: check `langCode === 'en'` before using Kokoro. ElevenLabs handles all languages.
- **VITE_ vars baked at build time**: always `npm run build` after changing Firebase vars.
- **ElevenLabs key is required**: without `ELEVENLABS_API_KEY` in CF Pages env, demo falls back to Kokoro (robotic WASM) or Web Speech. Set it via wrangler or CF dashboard — free tier is enough because audio caches in Dexie.
- **Web Speech voice quality varies wildly by browser**: Edge on Windows has Microsoft Natural Online voices (near-human). Chrome has Google voices (decent). Firefox often has no quality neural voices. ELEVENLABS_API_KEY removes this variance entirely.
- **ElevenLabs emotion tuning**: `style` drives expressiveness (0=monotone, 1=very expressive). For educational mentoring, `style: 0.68–0.72` for teaching, `style: 0.90–0.92` for celebration. `similarity_boost: 0.92` for authentic voice reproduction.
- **Narration restarts from Dexie prefs loading**: Do NOT put `prefs.*` or `kokoro.ready` in the narration effect deps. Dexie loads saved prefs ~50ms after mount — if any of these are deps, the narration effect re-fires mid-phase whenever prefs change, causing the demo to loop on the current phase forever. Use `prefsRef.current` and `kokoroReadyRef.current` inside the effect instead.
- **elVoiceName() must match actual EL voices**: if voice IDs change (e.g. en-GB updated from Dorothy/George to Alice/Daniel), update both `pickVoiceForLang` in `useElevenLabsTTS.ts` AND `elVoiceName()` in `DemoFlow.tsx`. The subtitle row reads from `elVoiceName` — a mismatch makes the display show the wrong voice name while a different one speaks.

## Clinical Crucible — Release 2.3 (2026-06-30)

Five new features shipped as one deploy. All live at https://cognitive-nav.pages.dev.

### Case-based sessions

- Home.tsx: "Session mode" toggle (Topic-based / Case-based) shown in Clinical mode
- Selecting "Case-based" triggers `fetchVignette(topic, examBoard)` → `/api/vignette`
- Debounced 900ms auto-fetch when topic changes while case-based mode is active
- Vignette card rendered in Home before suggestions (shimmer loading + ↻ regenerate button)
- `functions/api/vignette.ts`: Groq → `{ vignette: string, differentials: string[] }`. Board-aware style: USMLE gets Step 2-format 3-4 sentence case, NEET UG gets mechanism-depth case.
- Vignette injected into `evaluate.ts` user message as `CLINICAL VIGNETTE` block
- Shown in PrickLoop.tsx above the question input throughout the session

### Differential diagnosis gate (enhanced evaluate.ts clinical Gate 2)

Clinical Gate 2 now promotes questions that:
- Name a competing diagnosis and the one distinguishing finding
- Identify a condition that changes how you interpret a clinical finding
- Name a specific clinical population or edge case where the mechanism differs

### Management philosophy gate (enhanced evaluate.ts clinical Gate 3)

Applicable to neet-ss, usmle-2, usmle-3. Gate 3 benefits from questions probing:
- WHY a treatment threshold was set (not just what it is)
- What competing management frameworks (e.g. conservative vs surgical) reveal about the disease model

### Performance by body system (History.tsx)

- `src/core/clinicalBodySystems.ts`: 13 BodySystem types, BODY_SYSTEM_COLORS map, `classifyTopicToSystem(topic)` — keyword-regex maps topic string to system
- `PerformanceBySystem` component in History.tsx — appears above session list in clinical mode
- Shows a 2-3 column grid of colored system cards, each with highest depth reached + session count
- Only shown for clinical sessions with at least one scored question

### Session type fields

`Session` type (types.ts) now has:
- `sessionMode?: 'topic' | 'case'` — default `'topic'`
- `vignette?: string` — the generated case text; travels with session for display in PrickLoop

`EvaluateRequest` (types.ts):
- `vignette?: string` — passed through api.ts to evaluate.ts; injected into LLM user message when present

## Vedic foundation

Bhagavad Gita 4.34 (Pariprashna) — knowledge through deep investigative inquiry. The prick IS the guru function. Real strength is helping others surpass your current state.
