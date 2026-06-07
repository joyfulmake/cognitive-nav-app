import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveVoicePrefs, DEFAULT_VOICE_PREF, type VoicePreference } from './db'

// ─── Voice presets ────────────────────────────────────────────────────────────

export const VOICE_PRESETS: Record<VoicePreference['preset'], { rate: number; pitch: number; label: string; desc: string }> = {
  calm:      { rate: 0.78, pitch: 1.00, label: 'Soulful',  desc: 'Deep and still — for reflection and inner listening' },
  warm:      { rate: 0.87, pitch: 1.12, label: 'Heartful', desc: 'Warm and present — learns alongside you, like a true guide' },
  teacher:   { rate: 0.91, pitch: 1.05, label: 'Guide',    desc: 'Firm and clear — purposeful, grounded, no-nonsense' },
  energetic: { rate: 1.02, pitch: 1.18, label: 'Alive',    desc: 'Energetic and celebratory — for eureka moments' },
  custom:    { rate: 0.87, pitch: 1.12, label: 'Custom',   desc: 'Your own rate and pitch' },
}

// ─── Language list ────────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)',        nativeName: 'English',    flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)',        nativeName: 'English',    flag: '🇬🇧' },
  { code: 'hi-IN', label: 'Hindi',               nativeName: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'ta-IN', label: 'Tamil',               nativeName: 'தமிழ்',      flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu',              nativeName: 'తెలుగు',     flag: '🇮🇳' },
  { code: 'kn-IN', label: 'Kannada',             nativeName: 'ಕನ್ನಡ',     flag: '🇮🇳' },
  { code: 'mr-IN', label: 'Marathi',             nativeName: 'मराठी',      flag: '🇮🇳' },
  { code: 'es-ES', label: 'Spanish',             nativeName: 'Español',    flag: '🇪🇸' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeName: 'Português',  flag: '🇧🇷' },
  { code: 'fr-FR', label: 'French',              nativeName: 'Français',   flag: '🇫🇷' },
  { code: 'ar-SA', label: 'Arabic',              nativeName: 'العربية',    flag: '🇸🇦' },
  { code: 'de-DE', label: 'German',              nativeName: 'Deutsch',    flag: '🇩🇪' },
  { code: 'zh-CN', label: 'Mandarin (China)',    nativeName: '中文',        flag: '🇨🇳' },
  { code: 'ja-JP', label: 'Japanese',            nativeName: '日本語',      flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean',              nativeName: '한국어',      flag: '🇰🇷' },
  { code: 'ru-RU', label: 'Russian',             nativeName: 'Русский',    flag: '🇷🇺' },
  { code: 'tr-TR', label: 'Turkish',             nativeName: 'Türkçe',     flag: '🇹🇷' },
  { code: 'id-ID', label: 'Indonesian',          nativeName: 'Indonesia',  flag: '🇮🇩' },
]

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useVoiceSettings() {
  const [prefs, setPrefs] = useState<VoicePreference>(DEFAULT_VOICE_PREF)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Live query: all hook instances react when prefs are saved anywhere in the app
  const savedPrefs = useLiveQuery(() => db.voicePrefs.get('user'), [])
  useEffect(() => {
    if (savedPrefs && savedPrefs.id) setPrefs(savedPrefs)
  }, [savedPrefs])

  const loaded = savedPrefs !== undefined

  // Load voices
  useEffect(() => {
    if (!hasSpeech) return
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length) setVoices(v)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [hasSpeech])

  const save = useCallback(async (updated: Omit<VoicePreference, 'id'>) => {
    const full: VoicePreference = { id: 'user', ...updated }
    setPrefs(full)
    await saveVoicePrefs(updated)
  }, [])

  // Normalize lang codes — Firefox/Android emit en_GB (underscore); browsers spec says en-GB (hyphen)
  const normLang = (l: string) => l.replace('_', '-')

  // Voices filtered by current language — prefer exact locale, fall back to lang root for playback
  const exactLangVoices = voices.filter(v => normLang(v.lang).startsWith(prefs.language))
  const languageVoices = exactLangVoices.length > 0
    ? exactLangVoices
    : voices.filter(v => normLang(v.lang).startsWith(prefs.language.split('-')[0]))

  // Best auto-pick for a language — priority: Microsoft Natural Online > Microsoft Natural > Google > default
  function bestVoiceFor(lang: string): string {
    const exact = voices.filter(v => normLang(v.lang).startsWith(lang))
    const matches = exact.length > 0 ? exact : voices.filter(v => normLang(v.lang).startsWith(lang.split('-')[0]))
    if (matches.length === 0) return ''
    const msNaturalOnline = matches.find(v => v.name.includes('Online') && v.name.includes('Natural'))
    const msNatural       = matches.find(v => v.name.includes('Natural'))
    const googleFemale    = matches.find(v => v.name.includes('Google') && v.name.toLowerCase().includes('female'))
    const google          = matches.find(v => v.name.includes('Google'))
    const def             = matches.find(v => v.default)
    return (msNaturalOnline ?? msNatural ?? googleFemale ?? google ?? def ?? matches[0]).name
  }

  // Speak using current prefs (or override)
  const speak = useCallback((text: string, overrides?: Partial<VoicePreference>) => {
    if (!hasSpeech || !text) return
    const p = { ...prefs, ...overrides }
    const langCode = p.language.split('-')[0]
    const hasNative = voices.some(v => normLang(v.lang).startsWith(langCode))
    const useLang = hasNative ? p.language : 'en-US'
    const lc = useLang.split('-')[0]
    window.speechSynthesis.cancel()
    const startTimer = setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text)
      u.lang   = useLang
      u.rate   = p.rate
      u.pitch  = p.pitch
      u.volume = 1.0
      // Exact-locale pool first (en-GB wins over en-US), then language root
      const exactPool = voices.filter(vv => normLang(vv.lang).startsWith(useLang))
      const rootPool  = voices.filter(vv => normLang(vv.lang).startsWith(lc))
      const pool = exactPool.length > 0 ? exactPool : rootPool
      const v = voices.find(vv => vv.name === p.voiceName && normLang(vv.lang).startsWith(lc))
             ?? pool.find(vv => vv.name.includes('Online') && vv.name.includes('Natural'))
             ?? pool.find(vv => vv.name.includes('Natural'))
             ?? pool.find(vv => vv.name.includes('Google'))
             ?? pool[0]
             ?? null
      if (v) u.voice = v
      const ka = setInterval(() => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume()
      }, 2000)
      let resumeTimer: ReturnType<typeof setTimeout>
      u.onend  = () => { clearInterval(ka); clearTimeout(resumeTimer) }
      u.onerror = () => { clearInterval(ka); clearTimeout(resumeTimer) }
      window.speechSynthesis.speak(u)
      // Chrome leaves synthesis paused after cancel() — this kick-starts it reliably
      resumeTimer = setTimeout(() => window.speechSynthesis.resume(), 80)
    }, 150)
    return () => clearTimeout(startTimer)
  }, [hasSpeech, prefs, voices])

  const stopSpeaking = useCallback(() => {
    if (hasSpeech) window.speechSynthesis.cancel()
  }, [hasSpeech])

  return {
    prefs,
    voices,
    languageVoices,
    loaded,
    hasSpeech,
    save,
    speak,
    stopSpeaking,
    bestVoiceFor,
  }
}
