import { useState, useRef, useCallback } from 'react'
import { db } from './db'

// ─── Voice registry ───────────────────────────────────────────────────────────
// All free-tier ElevenLabs voices with their accent and character

export const EL_VOICES = {
  // American English — female (premade, free tier)
  rachel:   { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',   accent: 'en-US', gender: 'f', desc: 'Avoid — recognised AI demo voice' },
  matilda:  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda',  accent: 'en-US', gender: 'f', desc: 'Warm, upbeat American — default guide' },
  aria:     { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria',     accent: 'en-US', gender: 'f', desc: 'Natural, engaging American female' },
  laura:    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura',    accent: 'en-US', gender: 'f', desc: 'Bright, upbeat American female' },
  jessica:  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica',  accent: 'en-US', gender: 'f', desc: 'Warm, friendly American female' },
  sarah:    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',    accent: 'en-US', gender: 'f', desc: 'Soft, thoughtful American female' },
  emily:    { id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Emily',    accent: 'en-US', gender: 'f', desc: 'Calm, measured — kept for reference' },
  // American English — male (premade, free tier)
  charlie:  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie',  accent: 'en-US', gender: 'm', desc: 'Avoid — recognised AI demo voice' },
  liam:     { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',     accent: 'en-US', gender: 'm', desc: 'Youthful, confident American — default learner' },
  josh:     { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',     accent: 'en-US', gender: 'm', desc: 'Deep, clear — multilingual fallback learner' },
  brian:    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',    accent: 'en-US', gender: 'm', desc: 'Grounded, natural American male' },
  eric:     { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric',     accent: 'en-US', gender: 'm', desc: 'Engaging, clear American male' },
  roger:    { id: 'CwhRBWXHX6C9DoZJuLQ4', name: 'Roger',    accent: 'en-US', gender: 'm', desc: 'Confident, authoritative American male' },
  // British English — female (premade, strong RP)
  alice:    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',    accent: 'en-GB', gender: 'f', desc: 'British professional educator — strong RP' },
  charlotte:{ id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', accent: 'en-GB', gender: 'f', desc: 'British female — clear RP accent' },
  lily:     { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily',     accent: 'en-GB', gender: 'f', desc: 'British female — warm and articulate' },
  dorothy:  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy',  accent: 'en-GB', gender: 'f', desc: 'Warm British — legacy (replaced by Alice)' },
  // British English — male (premade, strong RP)
  daniel:   { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',   accent: 'en-GB', gender: 'm', desc: 'BBC broadcaster, deep baritone RP' },
  harry:    { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry',    accent: 'en-GB', gender: 'm', desc: 'Young British male — adventurous energy' },
  george:   { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',   accent: 'en-GB', gender: 'm', desc: 'Warm British storyteller — legacy' },
  // Hindi (Voice Library — native Indian speakers; requires EL Starter tier or higher)
  priyanka: { id: 'T536A2SFCG4AEDVTRucQ', name: 'Priyanka', accent: 'hi-IN', gender: 'f', desc: 'Warm Indian female — native Hindi (Starter tier)' },
  anant:    { id: 'T3s9anIvGvoeogXyFyMt', name: 'Anant',    accent: 'hi-IN', gender: 'm', desc: 'Clear Indian male — native Hindi (Starter tier)' },
} as const

// ─── Voice options by language — shown in VoiceSettings ──────────────────────

type VoiceOption = { id: string; name: string; desc: string }

export function elGuideOptions(lang: string): VoiceOption[] {
  const lc = lang.split('-')[0].toLowerCase()
  const r = lang.split('-')[1]?.toUpperCase() ?? ''
  if (lc === 'en' && r === 'GB') return [
    { id: EL_VOICES.alice.id,     name: 'Alice',     desc: 'British educator · warm RP' },
    { id: EL_VOICES.charlotte.id, name: 'Charlotte', desc: 'British female · clear RP' },
    { id: EL_VOICES.lily.id,      name: 'Lily',      desc: 'British female · articulate' },
  ]
  if (lc === 'en') return [
    { id: EL_VOICES.matilda.id,  name: 'Matilda',  desc: 'Warm, upbeat American' },
    { id: EL_VOICES.aria.id,     name: 'Aria',     desc: 'Natural, engaging' },
    { id: EL_VOICES.laura.id,    name: 'Laura',    desc: 'Bright, clear' },
    { id: EL_VOICES.jessica.id,  name: 'Jessica',  desc: 'Warm, friendly' },
    { id: EL_VOICES.sarah.id,    name: 'Sarah',    desc: 'Soft, thoughtful' },
  ]
  if (lc === 'hi') return [
    { id: EL_VOICES.priyanka.id, name: 'Priyanka', desc: 'Native Hindi · Starter tier' },
    { id: EL_VOICES.matilda.id,  name: 'Matilda',  desc: 'Multilingual · free tier' },
    { id: EL_VOICES.aria.id,     name: 'Aria',     desc: 'Multilingual · free tier' },
  ]
  return [
    { id: EL_VOICES.matilda.id,  name: 'Matilda', desc: 'Warm multilingual' },
    { id: EL_VOICES.aria.id,     name: 'Aria',    desc: 'Natural multilingual' },
    { id: EL_VOICES.laura.id,    name: 'Laura',   desc: 'Bright multilingual' },
  ]
}

export function elLearnerOptions(lang: string): VoiceOption[] {
  const lc = lang.split('-')[0].toLowerCase()
  const r = lang.split('-')[1]?.toUpperCase() ?? ''
  if (lc === 'en' && r === 'GB') return [
    { id: EL_VOICES.daniel.id, name: 'Daniel', desc: 'BBC broadcaster · deep RP' },
    { id: EL_VOICES.harry.id,  name: 'Harry',  desc: 'Young British male' },
  ]
  if (lc === 'en') return [
    { id: EL_VOICES.liam.id,  name: 'Liam',  desc: 'Youthful, curious' },
    { id: EL_VOICES.josh.id,  name: 'Josh',  desc: 'Deep, clear' },
    { id: EL_VOICES.brian.id, name: 'Brian', desc: 'Grounded, natural' },
    { id: EL_VOICES.eric.id,  name: 'Eric',  desc: 'Engaging, clear' },
    { id: EL_VOICES.roger.id, name: 'Roger', desc: 'Confident' },
  ]
  if (lc === 'hi') return [
    { id: EL_VOICES.anant.id, name: 'Anant', desc: 'Native Hindi · Starter tier' },
    { id: EL_VOICES.josh.id,  name: 'Josh',  desc: 'Multilingual · free tier' },
    { id: EL_VOICES.brian.id, name: 'Brian', desc: 'Multilingual · free tier' },
  ]
  return [
    { id: EL_VOICES.josh.id,  name: 'Josh',  desc: 'Deep multilingual' },
    { id: EL_VOICES.brian.id, name: 'Brian', desc: 'Natural multilingual' },
    { id: EL_VOICES.eric.id,  name: 'Eric',  desc: 'Engaging multilingual' },
  ]
}

export type ELVoiceKey = keyof typeof EL_VOICES

// ─── Accent-aware voice + model selection ─────────────────────────────────────
// ElevenLabs voices carry their accent regardless of the text language.
// For non-English text, eleven_multilingual_v2 gives significantly better prosody.

function pickVoiceForLang(
  role: 'g' | 'l',
  lang: string,          // BCP-47: 'en-US', 'en-GB', 'hi-IN', etc.
): { voiceId: string; modelId: string; baseStability: number } {
  const lc     = lang.split('-')[0].toLowerCase()
  const region = lang.split('-')[1]?.toUpperCase() ?? ''

    // Base stability: enough natural variation to feel human, not so low it glitches
  const gStab = 0.44
  const lStab = 0.38

  if (lc === 'en' && region === 'GB') {
    // Alice (guide) — "British professional educator": strong RP, warm authority — perfect mentor
    // Daniel (learner) — "formal BBC broadcaster": deep baritone RP — clearly different from Alice
    // Both are confirmed EL premade voices (visible in /v1/voices API response)
    return {
      voiceId: role === 'g' ? EL_VOICES.alice.id : EL_VOICES.daniel.id,
      modelId: 'eleven_turbo_v2_5',
      baseStability: role === 'g' ? gStab : lStab,
    }
  }
  if (lc === 'en') {
    // Matilda (guide) — warm, upbeat American. Liam (learner) — youthful, confident.
    return {
      voiceId: role === 'g' ? EL_VOICES.matilda.id : EL_VOICES.liam.id,
      modelId: 'eleven_turbo_v2_5',
      baseStability: role === 'g' ? gStab : lStab,
    }
  }
  if (lc === 'hi') {
    // Priyanka + Anant: native Hindi speakers from EL Voice Library.
    // Requires EL Starter tier ($5/mo) — on free tier these calls error-out and
    // the demo falls through to Kokoro/Web Speech (graceful degradation).
    // Lower baseStability than the Matilda/Josh approach: native speakers don't need
    // the extra rigidity we imposed to protect non-native pronunciation.
    return {
      voiceId: role === 'g' ? EL_VOICES.priyanka.id : EL_VOICES.anant.id,
      modelId: 'eleven_multilingual_v2',
      baseStability: role === 'g' ? 0.46 : 0.40,
    }
  }
  // Other non-English: Matilda (guide) + Josh (learner) via multilingual model.
  // Stability 0.50/0.46 — slightly higher to compensate for non-native accent on dense scripts.
  return {
    voiceId: role === 'g' ? EL_VOICES.matilda.id : EL_VOICES.josh.id,
    modelId: 'eleven_multilingual_v2',
    baseStability: role === 'g' ? 0.50 : 0.46,
  }
}

// ─── Emotion → voice + audio settings ────────────────────────────────────────
// The dialogue `s` (speed hint) encodes emotional register.
// Maps to ElevenLabs stability + style (controls HOW speech is generated)
// and output_format bitrate (controls HOW FAITHFULLY the audio is stored).
//
// Bitrate logic:
//   Quiet/reflective → 192kbps  — micro-pauses, breath, subtle inflection matter most here
//   Normal conversation → 128kbps — good balance
//   Excited/celebration → 96kbps — loud and clear; compression doesn't hurt it
//   Non-English → always 128kbps — consonant clusters need fidelity

// ElevenLabs style + stability insight (learned through iteration):
//
//   The old mistake: chasing "close to training data" by flooring style at 0.08–0.10.
//   Result: flat, robotic — because flat IS what we associate with machines.
//   Real humans are warm even when quiet. Warmth comes from style 0.22+, not from 0.08.
//
//   Style guide (empirical):
//     0.22–0.30 = quiet warmth — reflective, intimate, genuine presence
//     0.30–0.38 = engaged and natural — teaching, wondering, conversation
//     0.38–0.46 = openly warm — mastery moments, energised dialogue
//     0.46–0.48 = celebration peak — genuine joy, still believably human
//     0.50+     = theatrical — performing emotion rather than feeling it — avoid
//
//   Stability guide:
//     0.30–0.38 = celebratory natural variation (humans get animated)
//     0.38–0.46 = conversation baseline (warm, present, human)
//     0.46–0.52 = reflective (quieter, steadier, intimate)
//     0.52+     = stiff — starts to sound artificially consistent
//
//   Non-English: style 0.24 (was 0.10) — that gap is the difference between
//   "flat translation voice" and "warm person speaking their own language."

function emotionSettings(
  s: number | undefined,
  baseStability: number,
  isEnglish: boolean,
): { stability: number; style: number; output_format: string } {
  if (!isEnglish) {
    // Non-English: emotion-aware but with a conservative style ceiling (0.36 vs 0.48 English)
    // to protect pronunciation clarity in dense scripts (Hindi, Tamil, Arabic, CJK, etc.)
    // Guide (baseStability ≈ 0.50) naturally stays calmer; Learner (≈ 0.46) more animated.
    if (s == null) return { stability: baseStability,          style: 0.22, output_format: 'mp3_44100_192' }
    if (s >= 1.0)  return { stability: baseStability - 0.08,   style: 0.34, output_format: 'mp3_44100_192' }  // celebration
    if (s >= 0.90) return { stability: baseStability - 0.04,   style: 0.28, output_format: 'mp3_44100_192' }  // energised
    if (s <= 0.81) return { stability: baseStability + 0.04,   style: 0.17, output_format: 'mp3_44100_192' }  // deep reflection
    if (s <= 0.85) return { stability: baseStability + 0.02,   style: 0.20, output_format: 'mp3_44100_192' }  // wonder
    return { stability: baseStability, style: 0.22, output_format: 'mp3_44100_192' }  // teaching/default
  }
  // English — full emotion curve (style can go up to 0.48 at celebration without sounding theatrical)
  if (s == null) return { stability: baseStability, style: 0.34, output_format: 'mp3_44100_192' }  // warmer baseline
  if (s >= 1.0)  return { stability: 0.30, style: 0.48, output_format: 'mp3_44100_192' }  // celebration — genuine peak joy
  if (s >= 0.90) return { stability: 0.34, style: 0.43, output_format: 'mp3_44100_192' }  // energised — warmly animated
  if (s <= 0.81) return { stability: 0.50, style: 0.22, output_format: 'mp3_44100_192' }  // deep reflection — quiet, warm
  if (s <= 0.85) return { stability: 0.44, style: 0.30, output_format: 'mp3_44100_192' }  // wonder — open, gently lifted
  if (s <= 0.88) return { stability: 0.40, style: 0.36, output_format: 'mp3_44100_192' }  // teaching — engaged, present
  return { stability: baseStability, style: 0.34, output_format: 'mp3_44100_192' }  // conversation — heartfelt, genuine
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

function hashText(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return (h >>> 0).toString(36)
}

function cacheKey(voiceId: string, modelId: string, format: string, text: string) {
  // el11 = en-GB Alice+Daniel (was Dorothy+George); hi Priyanka+Anant (was Matilda+Josh)
  const fmtTag = format.includes('192') ? '192' : format.includes('96') ? '96' : '128'
  return `el11:${voiceId}:${modelId.slice(-4)}:${fmtTag}:${hashText(text)}`
}

// ─── In-session memory cache ──────────────────────────────────────────────────
// Avoids Dexie read/write contention between concurrent prefetch and speakRaw calls.
// prefetch writes here; speakRaw checks here first — Dexie is only a persistence layer.
const _memCache = new Map<string, ArrayBuffer>()

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useElevenLabsTTS() {
  const [badge, setBadge]       = useState<'human' | 'loading' | null>(null)
  const [speaking, setSpeaking] = useState(false)

  const availableRef = useRef<boolean | null>(null)
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const abortRef     = useRef(false)

  const canTry = () => availableRef.current !== false

  // Low-level speak — takes explicit voice ID, model, format, and emotion settings
  const speakRaw = useCallback(async (
    text: string,
    voiceId: string,
    modelId: string,
    style: number,
    stability: number,
    output_format: string,
    onPlayStart?: () => void,
  ): Promise<'ok' | 'unconfigured' | 'error'> => {
    if (!text.trim() || !canTry()) return availableRef.current === false ? 'unconfigured' : 'ok'
    abortRef.current = false
    setSpeaking(true)

    const key = cacheKey(voiceId, modelId, output_format, text)

    try {
      let audioBuf: ArrayBuffer | undefined

      // 1. Check in-memory cache first — always instant, no IndexedDB contention
      const memHit = _memCache.get(key)
      if (memHit) {
        audioBuf = memHit
        if (availableRef.current === null) { availableRef.current = true; setBadge('human') }
      } else {
        // 2. Try Dexie with a 2s timeout — if IndexedDB is blocked by concurrent prefetch
        //    writes (same object store), we skip it rather than hanging the narration loop
        const dbHit = await Promise.race([
          db.ttsCache.get(key),
          new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 2000)),
        ])
        if (dbHit) {
          audioBuf = dbHit.audio
          _memCache.set(key, audioBuf)
          if (availableRef.current === null) { availableRef.current = true; setBadge('human') }
        }
      }

      if (!audioBuf) {
        // 3. Fetch from ElevenLabs API
        setBadge('loading')
        const ctrl = new AbortController()
        const tOut = setTimeout(() => ctrl.abort(), 15000)
        let res: Response
        try {
          res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice_id: voiceId, model_id: modelId, style, stability, output_format }),
            signal: ctrl.signal,
          })
        } catch {
          clearTimeout(tOut)
          setSpeaking(false)
          return 'error'  // timeout / network — fall through to next TTS tier
        }
        clearTimeout(tOut)

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          // Only disable EL entirely when the key is missing or invalid.
          // 422 = bad request (wrong voice_id e.g. Voice Library on free tier) — fail this line, keep EL alive.
          // 429 = quota exceeded — treat as session-permanent.
          // 503 from our proxy always means NO_KEY.
          const isPermanent = err.code === 'NO_KEY' || res.status === 401 || res.status === 429 || res.status === 503
          if (isPermanent) {
            availableRef.current = false
            setBadge(null)
            setSpeaking(false)
            return 'unconfigured'
          }
          setSpeaking(false)
          return 'error'
        }

        audioBuf = (await res.arrayBuffer()).slice(0)

        // Store in memory cache immediately (synchronous — no blocking)
        _memCache.set(key, audioBuf)

        // Persist to Dexie fire-and-forget — NEVER await this before playing audio.
        // Dexie writes can block if IndexedDB has a write lock from concurrent prefetch;
        // the audio plays without waiting, and Dexie catches up in the background.
        db.ttsCache.put({ key, audio: audioBuf, createdAt: Date.now() }).catch(() => {})

        if (availableRef.current === null) { availableRef.current = true; setBadge('human') }
      }

      if (abortRef.current) { setSpeaking(false); return 'ok' }

      const blob = new Blob([audioBuf], { type: 'audio/mpeg' })
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      const el = new Audio(url)
      audioRef.current = el

      await new Promise<void>(resolve => {
        // Safety cap — fires when onended never arrives (known browser bug on short clips).
        // Floor at 2500ms — "Alright. Here goes." is ~1.5s of audio; 3500ms made the demo
        // feel frozen for 2 extra seconds after each short line. Any real-length line still
        // gets text.length * 90ms which is comfortably longer than its audio duration.
        const estMs = Math.max(text.length * 90, 2500)
        const safety = setTimeout(() => { URL.revokeObjectURL(url); resolve() }, estMs)
        const done = () => { clearTimeout(safety); URL.revokeObjectURL(url); resolve() }
        el.onended  = done
        el.onerror  = done
        el.play().then(() => {
          onPlayStart?.()
        }).catch(done)
      })

    } catch {
      // silent — network / DB error
    } finally {
      if (!abortRef.current) setSpeaking(false)
      setBadge(availableRef.current === true ? 'human' : null)
    }
    return 'ok'
  }, []) // stable

  // High-level speak — accent-aware + emotion-aware (stability, style, bitrate all modulated)
  // guideVoiceIdOverride / learnerVoiceIdOverride: user-selected EL voice from VoiceSettings
  const speakLine = useCallback(async (
    text: string,
    role: 'g' | 'l',
    lang: string,                   // user's selected language, e.g. 'en-GB'
    speedHint?: number,             // from dialogue `s` metadata
    onPlayStart?: () => void,
    guideVoiceIdOverride?: string,
    learnerVoiceIdOverride?: string,
  ): Promise<'ok' | 'unconfigured' | 'error'> => {
    const { voiceId: defaultId, modelId, baseStability } = pickVoiceForLang(role, lang)
    const override = role === 'g' ? guideVoiceIdOverride : learnerVoiceIdOverride
    const voiceId = override || defaultId
    const isEnglish = lang.split('-')[0].toLowerCase() === 'en'
    const { stability, style, output_format } = emotionSettings(speedHint, baseStability, isEnglish)
    return speakRaw(text, voiceId, modelId, style, stability, output_format, onPlayStart)
  }, [speakRaw])

  // Fire-and-forget cache warmer — fetches audio for upcoming lines while current line plays.
  // Writes to _memCache (synchronous) then Dexie (background, non-blocking).
  const prefetch = useCallback(async (
    text: string,
    role: 'g' | 'l',
    lang: string,
    speedHint?: number,
    guideVoiceIdOverride?: string,
    learnerVoiceIdOverride?: string,
  ): Promise<void> => {
    if (!canTry() || !text.trim()) return
    const { voiceId: defaultId, modelId, baseStability } = pickVoiceForLang(role, lang)
    const override = role === 'g' ? guideVoiceIdOverride : learnerVoiceIdOverride
    const voiceId = override || defaultId
    const isEnglish = lang.split('-')[0].toLowerCase() === 'en'
    const { stability, style, output_format } = emotionSettings(speedHint, baseStability, isEnglish)
    const key = cacheKey(voiceId, modelId, output_format, text)
    try {
      // Skip if already in memory (instant check) or Dexie (2s max)
      if (_memCache.has(key)) return
      const dbHit = await Promise.race([
        db.ttsCache.get(key),
        new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 2000)),
      ])
      if (dbHit) { _memCache.set(key, dbHit.audio); return }

      const ctrl = new AbortController()
      const tOut = setTimeout(() => ctrl.abort(), 15000)
      let res: Response
      try {
        res = await fetch('/api/tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice_id: voiceId, model_id: modelId, style, stability, output_format }),
          signal: ctrl.signal,
        })
      } catch { clearTimeout(tOut); return }
      clearTimeout(tOut)
      if (!res.ok) return
      const buf = (await res.arrayBuffer()).slice(0)
      _memCache.set(key, buf)
      db.ttsCache.put({ key, audio: buf, createdAt: Date.now() }).catch(() => {})
    } catch { /* silent */ }
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    setSpeaking(false)
  }, [])

  const isAvailable = () => availableRef.current

  return { badge, speaking, speakLine, prefetch, stop, canTry, isAvailable }
}
