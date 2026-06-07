import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Groq Whisper batch transcription ────────────────────────────────────────

async function transcribeWithWhisper(blob: Blob): Promise<string> {
  const reader = new FileReader()
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  const res = await fetch('/.netlify/functions/whisper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: blob.type || 'audio/webm',
      // No `language` hint — Whisper auto-detects; forcing a language causes junk output
      // when the spoken language differs from the UI language preference.
    }),
  })
  if (!res.ok) throw new Error(`Whisper ${res.status}`)
  const data = await res.json()
  return data.text as string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
// mode: 'auto'      — try Web Speech (interim results live) first; on permanent error fall back to Whisper
//       'webspeech' — Web Speech only, interim results enabled
//       'whisper'   — batch MediaRecorder → Groq, no interim
//
// onResult(text)  — called with each finalized chunk; caller appends to field
// onInterim(text) — called with live partial text (replace, not append); '' = clear interim

export function useVoiceInput(
  onResult: (text: string) => void,
  lang = 'en-US',
  mode: 'webspeech' | 'whisper' | 'auto' = 'auto',
  onInterim?: (text: string) => void,
) {
  const [listening, setListening]     = useState(false)
  const [supported, setSupported]     = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const recognitionRef = useRef<any>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<BlobPart[]>([])
  const wsFailedRef    = useRef(false)   // Web Speech permanently failed this session

  useEffect(() => {
    const hasSR    = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
    const hasMedia = !!navigator.mediaDevices?.getUserMedia && 'MediaRecorder' in window
    setSupported(mode === 'whisper' ? hasMedia : (hasSR || hasMedia))
  }, [mode])

  // ── Whisper (batch) ──────────────────────────────────────────────────────
  const startWhisper = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setListening(false)
        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
          const text = await transcribeWithWhisper(blob)
          if (text.trim()) {
            onInterim?.('')
            onResult(text.trim())
          }
        } catch (e) {
          console.warn('Whisper transcription failed', e)
        } finally {
          setTranscribing(false)
        }
      }
      recorder.start()
      setListening(true)
    } catch (e) {
      console.warn('Microphone access denied', e)
    }
  }, [onResult, onInterim, lang])

  // ── Web Speech (streaming interim results) ───────────────────────────────
  const startWebSpeech = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      wsFailedRef.current = true
      startWhisper()
      return
    }
    try { recognitionRef.current?.abort() } catch {}

    const r = new SR()
    r.lang           = lang
    r.continuous     = false   // stops automatically after a pause — clean single-utterance UX
    r.interimResults = true    // emit text live as user speaks

    r.onstart = () => setListening(true)

    r.onresult = (e: any) => {
      let interim = ''
      let final   = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (interim) onInterim?.(interim)
      if (final.trim()) {
        onInterim?.('')
        onResult(final.trim())
      }
    }

    r.onerror = (e: any) => {
      if (e.error === 'no-speech') return  // normal pause, keep alive
      // Permission denied → truly permanent: Web Speech will never work without user action
      const permissionDenied = ['not-allowed', 'service-not-allowed'].includes(e.error)
      if (permissionDenied && mode === 'auto') {
        wsFailedRef.current = true   // permanent: don't retry
        setListening(false)
        onInterim?.('')
        startWhisper()
        return
      }
      // Transient failures (network blip, audio device glitch): fall back to Whisper for
      // THIS press only — do NOT set wsFailedRef so Web Speech is retried next press.
      if (['network', 'audio-capture'].includes(e.error) && mode === 'auto') {
        setListening(false)
        onInterim?.('')
        startWhisper()
        return
      }
      setListening(false)
      onInterim?.('')
    }

    r.onend = () => {
      setListening(false)
      onInterim?.('')
    }

    recognitionRef.current = r
    try { r.start() } catch { setListening(false) }
  }, [onResult, onInterim, lang, mode, startWhisper])

  // ── Public API ───────────────────────────────────────────────────────────
  const start = useCallback(() => {
    const useW = mode === 'whisper' || (mode !== 'webspeech' && wsFailedRef.current)
    if (useW) startWhisper()
    else startWebSpeech()
  }, [mode, startWebSpeech, startWhisper])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    } else {
      setListening(false)
    }
    onInterim?.('')
  }, [onInterim])

  return { listening, transcribing, supported, start, stop }
}
