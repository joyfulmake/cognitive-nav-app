import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Voices ───────────────────────────────────────────────────────────────────

export const KOKORO_VOICES = {
  af_bella:   { label: 'Bella',   gender: 'f', desc: 'Warm, expressive — Guide voice' },
  af_heart:   { label: 'Heart',   gender: 'f', desc: 'Breathy, natural' },
  af_nicole:  { label: 'Nicole',  gender: 'f', desc: 'Confident, clear' },
  af_sky:     { label: 'Sky',     gender: 'f', desc: 'Upbeat, energetic' },
  am_adam:    { label: 'Adam',    gender: 'm', desc: 'Curious, warm — Learner voice' },
  am_michael: { label: 'Michael', gender: 'm', desc: 'Professional, steady' },
  bm_george:  { label: 'George',  gender: 'm', desc: 'British, measured' },
  bf_emma:    { label: 'Emma',    gender: 'f', desc: 'British, articulate' },
} as const

export type KokoroVoiceId = keyof typeof KOKORO_VOICES

// ─── Singleton model instance shared across all components ────────────────────

type ProgressCallback = (p: number) => void

let _instance: any = null
let _loadPromise: Promise<void> | null = null
const _progressListeners = new Set<ProgressCallback>()

async function loadModel(): Promise<void> {
  if (_instance) return
  if (_loadPromise) return _loadPromise

  _loadPromise = (async () => {
    try {
      // Dynamic import — keeps kokoro-js out of the initial bundle
      const { KokoroTTS } = await import('kokoro-js')
      _instance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0', {
        dtype: 'q4',
        device: 'wasm',
        progress_callback: (info: any) => {
          if (info.progress != null) {
            const p = Math.min(info.progress / 100, 0.99)
            _progressListeners.forEach(cb => cb(p))
          }
        },
      })
      _progressListeners.forEach(cb => cb(1))
    } finally {
      _loadPromise = null
    }
  })()

  return _loadPromise
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface KokoroState {
  ready: boolean
  loading: boolean
  progress: number
  error: string | null
  speaking: boolean
}

export function useKokoroTTS() {
  const [state, setState] = useState<KokoroState>({
    ready: !!_instance,
    loading: !!_loadPromise,
    progress: _instance ? 1 : 0,
    error: null,
    speaking: false,
  })

  const abortRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Subscribe to model load progress
  useEffect(() => {
    if (_instance) {
      setState(s => ({ ...s, ready: true, loading: false, progress: 1 }))
      return
    }
    if (_loadPromise) {
      setState(s => ({ ...s, loading: true }))
      const cb: ProgressCallback = p => setState(s => ({ ...s, progress: p }))
      _progressListeners.add(cb)
      _loadPromise.then(() => {
        setState(s => ({ ...s, ready: !!_instance, loading: false, progress: _instance ? 1 : 0 }))
      }).catch((e: any) => {
        setState(s => ({ ...s, loading: false, error: String(e?.message ?? e) }))
      })
      return () => { _progressListeners.delete(cb) }
    }
  }, [])

  const load = useCallback(async () => {
    if (_instance || _loadPromise) return
    setState(s => ({ ...s, loading: true, error: null, progress: 0 }))

    const cb: ProgressCallback = p => setState(s => ({ ...s, progress: p }))
    _progressListeners.add(cb)

    try {
      await loadModel()
      setState(s => ({ ...s, ready: true, loading: false, progress: 1 }))
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: String(e?.message ?? e) }))
    } finally {
      _progressListeners.delete(cb)
    }
  }, [])

  const speak = useCallback(async (text: string, voice: KokoroVoiceId = 'af_bella', speed = 0.9): Promise<void> => {
    if (!_instance || !text.trim()) return
    abortRef.current = false
    if (audioRef.current) audioRef.current.pause()
    setState(s => ({ ...s, speaking: true }))

    try {
      // Race generate() against a timeout — WASM generation can hang indefinitely on some
      // browsers/OS combinations; without this, the narration loop freezes permanently.
      const genTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('kokoro-gen-timeout')), 9000)
      )
      const audio = await Promise.race([
        _instance.generate(text.slice(0, 500), { voice, speed }),
        genTimeout,
      ])
      if (abortRef.current) return
      const blob = audio.toBlob()
      const url = URL.createObjectURL(blob)
      const el = new Audio(url)
      audioRef.current = el
      await new Promise<void>(resolve => {
        // Floor at 3000ms (not 6000) — 6000ms created a 4.5s "hang" for short clips.
        const estMs = Math.max(text.length * 80, 3000)
        const safety = setTimeout(() => { URL.revokeObjectURL(url); resolve() }, estMs)
        const done = () => { clearTimeout(safety); URL.revokeObjectURL(url); resolve() }
        el.onended = done
        el.onerror = done
        el.play().catch(done)
      })
    } catch {
      // ignore — generation timeout or WASM error; narration falls to Web Speech
    } finally {
      if (!abortRef.current) setState(s => ({ ...s, speaking: false }))
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    setState(s => ({ ...s, speaking: false }))
  }, [])

  return { ...state, load, speak, stop }
}
