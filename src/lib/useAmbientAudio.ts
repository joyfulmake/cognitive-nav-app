import { useEffect, useRef, useState, useCallback } from 'react'

// Alpha-range binaural beat: 180 Hz left ear, 190 Hz right ear → 10 Hz perceived beat
// 10 Hz sits in the alpha band — relaxed focus, ideal for active inquiry.
// Requires stereo headphones for the binaural effect; pink noise works on speakers.
const CARRIER_HZ = 180
const BEAT_HZ    = 10
const BEAT_VOL   = 0.055  // low enough to stay subliminal
const NOISE_VOL  = 0.016  // soft pink noise ambient floor
const FADE_IN_S  = 3.5

// Voss-McCartney pink noise (equal energy per octave — sounds like soft rain)
function buildPinkNoiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const buf  = ctx.createBuffer(2, rate * 20, rate) // 20-second looping buffer
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886*b0 + w*0.0555179
      b1 = 0.99332*b1 + w*0.0750759
      b2 = 0.96900*b2 + w*0.1538520
      b3 = 0.86650*b3 + w*0.3104856
      b4 = 0.55000*b4 + w*0.5329522
      b5 = -0.7616*b5 - w*0.0168980
      d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

export function useAmbientAudio(shouldPlay: boolean) {
  const ctxRef      = useRef<AudioContext | null>(null)
  const masterRef   = useRef<GainNode | null>(null)
  const sourcesRef  = useRef<(OscillatorNode | AudioBufferSourceNode)[]>([])
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [muted, setMuted]   = useState(false)
  const [active, setActive] = useState(false)

  const teardown = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    if (!ctxRef.current) return
    const ctx    = ctxRef.current
    const master = masterRef.current
    // Null refs immediately so re-entry guard works
    ctxRef.current   = null
    masterRef.current = null
    if (master) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    fadeTimerRef.current = setTimeout(() => {
      sourcesRef.current.forEach(s => { try { s.stop() } catch { /**/ } })
      sourcesRef.current = []
      ctx.close()
      setActive(false)
    }, 700)
  }, [])

  const init = useCallback(async () => {
    if (ctxRef.current) return
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    try {
      const ctx = new AudioContext()
      await ctx.resume()
      ctxRef.current = ctx

      const master = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_IN_S)
      master.connect(ctx.destination)
      masterRef.current = master

      // Pink noise ambient floor
      const noise = buildPinkNoiseSource(ctx)
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = NOISE_VOL
      noise.connect(noiseGain)
      noiseGain.connect(master)
      noise.start()
      sourcesRef.current.push(noise)

      // Binaural beat — each oscillator goes to one stereo channel only
      const merger = ctx.createChannelMerger(2)
      merger.connect(master)
      ;[CARRIER_HZ, CARRIER_HZ + BEAT_HZ].forEach((freq, ch) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const g = ctx.createGain()
        g.gain.value = BEAT_VOL
        osc.connect(g)
        g.connect(merger, 0, ch) // hard-pan to left (0) or right (1)
        osc.start()
        sourcesRef.current.push(osc)
      })

      setActive(true)
    } catch {
      // AudioContext blocked — silently skip (happens if browser hasn't seen a user gesture)
    }
  }, [])

  useEffect(() => {
    if (shouldPlay && !muted) {
      init()
    } else {
      teardown()
    }
    return () => { teardown() }
  }, [shouldPlay, muted, init, teardown])

  const toggleMute = useCallback(() => setMuted(m => !m), [])

  return { active, muted, toggleMute }
}
