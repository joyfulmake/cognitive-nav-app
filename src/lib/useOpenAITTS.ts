import { useState, useRef, useCallback } from 'react'
import { db } from './db'

// ─── Voice personas ───────────────────────────────────────────────────────────
// OpenAI tts-1-hd voices. Auto-detect language — same voice works across English, Hindi, etc.
//
// nova   — warm, conversational, clear female   — Guide in all languages
// onyx   — deep, resonant, authoritative male   — Learner in all languages
//          Distinctly different texture from nova: where nova is bright and warm,
//          onyx is low-resonance and weight-bearing. This contrast is what makes
//          conversations feel like two real people, not one voice talking to itself.
// shimmer — bright, expressive, energised female — Guide at peak celebration (s ≥ 1.0)
//           Switching Guide to shimmer at phase breaks (not mid-phase) is ok —
//           it signals a genuine emotional shift, not a character change.

const VOICES: Record<string, { guide: string; learner: string; celebrate: string }> = {
  default: { guide: 'nova', learner: 'onyx', celebrate: 'shimmer' },
}

// Speed → naturalness: 0.88 = deep reflection, 1.0 = normal, 1.10 = energised, 1.18 = celebration
// Range widened vs previous implementation to get genuine emotional contrast.
// OpenAI TTS doesn't have stability/style levers — speed is the primary emotion signal.
function pickSpeed(s: number | undefined): number {
  if (s == null) return 1.0
  if (s >= 1.0)  return 1.18   // celebration — animated, forward-leaning
  if (s >= 0.90) return 1.10   // energised — alive, genuinely engaged
  if (s <= 0.81) return 0.88   // deep reflection — weight, presence, not flat
  if (s <= 0.85) return 0.93   // wonder — slightly held back
  return 1.0
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

function hashText(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return (h >>> 0).toString(36)
}

function cacheKey(voice: string, speed: number, text: string): string {
  // oa2 = onyx learner + widened speed range (echo → onyx + celebration 1.12 → 1.18)
  const spTag = speed.toFixed(2)
  return `oa2:${voice}:${spTag}:${hashText(text)}`
}

// ─── In-session memory cache ──────────────────────────────────────────────────
// Same pattern as useElevenLabsTTS — avoids Dexie read/write contention.
// Concurrent prefetch writes to the same IndexedDB object store cause write
// contention that blocks the main put() indefinitely. _memCache is always instant.
const _memCache = new Map<string, ArrayBuffer>()

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOpenAITTS() {
  const [badge, setBadge]       = useState<'ai-hd' | 'loading' | null>(null)
  const [speaking, setSpeaking] = useState(false)

  const availableRef = useRef<boolean | null>(null)
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const abortRef     = useRef(false)

  const canTry = () => availableRef.current !== false

  const speakLine = useCallback(async (
    text: string,
    role: 'g' | 'l',
    _lang: string,             // kept for API compatibility — OpenAI auto-detects language
    speedHint?: number,
    onPlayStart?: () => void,
  ): Promise<'ok' | 'unconfigured' | 'error'> => {
    if (!text.trim() || !canTry()) {
      return availableRef.current === false ? 'unconfigured' : 'ok'
    }

    abortRef.current = false
    setSpeaking(true)

    const persona  = VOICES.default
    // celebrate (shimmer) is Guide-only — Learner stays onyx even at peak moments
    const voiceId  = (role === 'g' && speedHint != null && speedHint >= 1.0)
                   ? persona.celebrate
                   : role === 'g' ? persona.guide : persona.learner
    const speed    = pickSpeed(speedHint)
    const key      = cacheKey(voiceId, speed, text)

    try {
      let audioBuf: ArrayBuffer | undefined

      // 1. In-memory cache — always instant, never blocks
      const memHit = _memCache.get(key)
      if (memHit) {
        audioBuf = memHit
        if (availableRef.current === null) { availableRef.current = true; setBadge('ai-hd') }
      } else {
        // 2. Dexie with 2s timeout — skip if IndexedDB is contended by concurrent prefetch writes
        const dbHit = await Promise.race([
          db.ttsCache.get(key),
          new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 2000)),
        ])
        if (dbHit) {
          audioBuf = dbHit.audio
          _memCache.set(key, audioBuf)
          if (availableRef.current === null) { availableRef.current = true; setBadge('ai-hd') }
        }
      }

      if (!audioBuf) {
        // 3. Fetch from OpenAI via Netlify function
        setBadge('loading')
        const ctrl = new AbortController()
        const tOut = setTimeout(() => ctrl.abort(), 12000)
        let res: Response
        try {
          res = await fetch('/api/openai-tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: voiceId, speed }),
            signal: ctrl.signal,
          })
        } catch {
          clearTimeout(tOut)
          setSpeaking(false)
          return 'error'  // timeout or network — fall through to next tier
        }
        clearTimeout(tOut)

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const isPermanent = err.code === 'NO_KEY' || res.status === 401 || res.status === 503
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

        // Store in memory immediately — synchronous, no blocking
        _memCache.set(key, audioBuf)
        // Persist to Dexie fire-and-forget — NEVER await before playing audio
        db.ttsCache.put({ key, audio: audioBuf, createdAt: Date.now() }).catch(() => {})

        if (availableRef.current === null) { availableRef.current = true; setBadge('ai-hd') }
      }

      if (abortRef.current) { setSpeaking(false); return 'ok' }

      const blob = new Blob([audioBuf], { type: 'audio/mpeg' })
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      const el = new Audio(url)
      audioRef.current = el

      await new Promise<void>(resolve => {
        // Safety floor at 2500ms — "Alright. Here goes." is ~1.5s of audio; 8000ms floor
        // made every short line feel like the demo froze for 6+ extra seconds.
        const estMs = Math.max(text.length * 90, 2500)
        const safety = setTimeout(() => { URL.revokeObjectURL(url); resolve() }, estMs)
        const done = () => { clearTimeout(safety); URL.revokeObjectURL(url); resolve() }
        el.onended = done
        el.onerror = done
        el.play().then(() => onPlayStart?.()).catch(done)
      })

    } catch {
      // network / DB error — silent
    } finally {
      if (!abortRef.current) setSpeaking(false)
      setBadge(availableRef.current === true ? 'ai-hd' : null)
    }
    return 'ok'
  }, [])

  const prefetch = useCallback(async (
    text: string,
    role: 'g' | 'l',
    _lang: string,
    speedHint?: number,
  ): Promise<void> => {
    if (!canTry() || !text.trim()) return
    const persona = VOICES.default
    const voiceId = (role === 'g' && speedHint != null && speedHint >= 1.0)
                  ? persona.celebrate
                  : role === 'g' ? persona.guide : persona.learner
    const speed   = pickSpeed(speedHint)
    const key     = cacheKey(voiceId, speed, text)
    try {
      // Skip if already in memory (instant) or Dexie (2s max)
      if (_memCache.has(key)) return
      const dbHit = await Promise.race([
        db.ttsCache.get(key),
        new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 2000)),
      ])
      if (dbHit) { _memCache.set(key, dbHit.audio); return }

      const ctrl = new AbortController()
      const tOut = setTimeout(() => ctrl.abort(), 12000)
      let res: Response
      try {
        res = await fetch('/api/openai-tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceId, speed }),
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
  const voiceName   = (role: 'g' | 'l') =>
    role === 'g' ? 'Nova' : 'Onyx'

  return { badge, speaking, speakLine, prefetch, stop, canTry, isAvailable, voiceName }
}
