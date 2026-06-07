import { useState, useRef, useCallback } from 'react'

// Cartesia public voice IDs — find more at https://play.cartesia.ai/voices
// Update these IDs if voices are renamed; the sonic-2 model is stable.
export const CARTESIA_VOICES = {
  guide:   { id: 'b7d50908-b17c-442d-ad8d-810c63997ed9', name: 'Helpful Woman', gender: 'f' as const },
  learner: { id: '694f9389-aac1-45b6-b726-9d9369183238', name: 'Newsman',       gender: 'm' as const },
} as const

// Maps the dialogue speed hint (s) to Cartesia speed enum + emotion tag
function registerForHint(s: number | undefined): { speed: string; emotion: string[] } {
  if (s == null)   return { speed: 'normal',  emotion: [] }
  if (s >= 1.0)    return { speed: 'fast',    emotion: ['positivity:high'] }
  if (s <= 0.81)   return { speed: 'slow',    emotion: [] }
  if (s <= 0.85)   return { speed: 'slow',    emotion: [] }
  if (s <= 0.88)   return { speed: 'normal',  emotion: ['positivity:low'] }
  return              { speed: 'normal',  emotion: [] }
}

export function useCartesiaTTS() {
  const [speaking, setSpeaking]   = useState(false)
  const availableRef = useRef<boolean | null>(null)
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const abortRef     = useRef(false)

  const canTry = () => availableRef.current !== false

  const speak = useCallback(async (
    text: string,
    role: 'g' | 'l',
    lang?: string,
    speedHint?: number,
    onPlayStart?: () => void,
  ): Promise<'ok' | 'unconfigured' | 'error'> => {
    if (!text.trim() || !canTry()) {
      return availableRef.current === false ? 'unconfigured' : 'ok'
    }
    abortRef.current = false
    setSpeaking(true)

    const voice_id = role === 'g' ? CARTESIA_VOICES.guide.id : CARTESIA_VOICES.learner.id
    const language = lang ? lang.split('-')[0].toLowerCase() : 'en'
    const { speed, emotion } = registerForHint(speedHint)

    try {
      const res = await fetch('/.netlify/functions/cartesia-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id, language, speed, emotion }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if ((err as { code?: string }).code === 'NO_KEY' || res.status === 503) {
          availableRef.current = false
          setSpeaking(false)
          return 'unconfigured'
        }
        setSpeaking(false)
        return 'error'
      }

      if (availableRef.current === null) availableRef.current = true

      if (abortRef.current) { setSpeaking(false); return 'ok' }

      const buf = (await res.arrayBuffer()).slice(0)
      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url  = URL.createObjectURL(blob)

      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      const el = new Audio(url)
      audioRef.current = el

      await new Promise<void>(resolve => {
        el.onended  = () => { URL.revokeObjectURL(url); resolve() }
        el.onerror  = () => { URL.revokeObjectURL(url); resolve() }
        el.play().then(() => onPlayStart?.()).catch(() => { URL.revokeObjectURL(url); resolve() })
      })
    } catch {
      // silent
    } finally {
      if (!abortRef.current) setSpeaking(false)
    }
    return 'ok'
  }, []) // stable — availableRef is a ref, not state

  const stop = useCallback(() => {
    abortRef.current = true
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    setSpeaking(false)
  }, [])

  return {
    speaking,
    speak,
    stop,
    canTry,
    isAvailable: () => availableRef.current,
  }
}
