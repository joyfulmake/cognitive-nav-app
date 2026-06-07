import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceSettings, VOICE_PRESETS, SUPPORTED_LANGUAGES } from '../lib/useVoiceSettings'
import { elGuideOptions, elLearnerOptions } from '../lib/useElevenLabsTTS'

// ─── Native script font stack ─────────────────────────────────────────────────
const NOTO_FONT = '"Noto Sans Devanagari","Noto Sans Tamil","Noto Sans Telugu","Noto Sans Kannada","Noto Sans Arabic","Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif'

// ─── Sample preview text per language ────────────────────────────────────────
const SAMPLE_TEXT: Record<string, string> = {
  'en-US': "Welcome! Ask deeply — the depth finds itself.",
  'en-GB': "Welcome! Ask deeply — the depth finds itself.",
  'hi-IN': "स्वागत है! गहराई से पूछें।",
  'ta-IN': "வரவேற்கிறோம்! ஆழமாக கேளுங்கள்.",
  'te-IN': "స్వాగతం! లోతుగా అడగండి.",
  'kn-IN': "ಸ್ವಾಗತ! ಆಳವಾಗಿ ಕೇಳಿ.",
  'mr-IN': "स्वागत आहे! खोलवर विचारा.",
  'es-ES': "Bienvenido! Pregunta profundamente.",
  'pt-BR': "Bem-vindo! Pergunte profundamente.",
  'fr-FR': "Bienvenue! Posez vos questions en profondeur.",
  'ar-SA': "مرحباً! اسأل بعمق.",
  'de-DE': "Willkommen! Fragen Sie tief.",
  'zh-CN': "欢迎！深度提问。",
  'ja-JP': "ようこそ！深く問いかけましょう。",
  'ko-KR': "환영합니다! 깊이 질문하세요.",
  'ru-RU': "Добро пожаловать! Спрашивайте глубже.",
  'tr-TR': "Hoş geldiniz! Derinlemesine sorun.",
  'id-ID': "Selamat datang! Tanyakan dengan mendalam.",
}

// ─── Gender detection from voice name ────────────────────────────────────────
// Web Speech API has no gender field — we infer from well-known name patterns.

const FEMALE_NAMES = ['female', 'girl', 'woman', 'zira', 'cortana', 'samantha', 'victoria',
  'karen', 'moira', 'tessa', 'fiona', 'ava', 'susan', 'siri', 'alexa', 'kyoko', 'mizuki',
  'haruka', 'meijia', 'sinji', 'yuna', 'yuri', 'anna', 'nora', 'sara', 'laura', 'helena',
  'amelie', 'audrey', 'julie', 'marie', 'zosia', 'paulina', 'lekha', 'heera', 'kalpana',
  'veena', 'raveena', 'aditi', 'priya']
const MALE_NAMES   = ['male', 'man', 'boy', 'david', 'mark', 'george', 'daniel', 'alex',
  'tom', 'oliver', 'diego', 'jorge', 'james', 'gordon', 'fred', 'junior', 'paulo', 'rodrigo',
  'reed', 'luca', 'matteo', 'hans', 'stefan', 'rakesh', 'hemant', 'kalpana']

type Gender = 'all' | 'female' | 'male'

function detectGender(voice: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
  const n = voice.name.toLowerCase()
  if (FEMALE_NAMES.some(w => n.includes(w))) return 'female'
  if (MALE_NAMES.some(w => n.includes(w))) return 'male'
  return 'unknown'
}

// ─── Install guide ────────────────────────────────────────────────────────────

type PlatformKey = 'windows' | 'mac' | 'android' | 'ios'

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  windows: 'Windows',
  mac: 'macOS',
  android: 'Android',
  ios: 'iPhone / iPad',
}

function getInstallSteps(platform: PlatformKey, langLabel: string): string[] {
  switch (platform) {
    case 'windows':
      return [
        'Open Settings → Time & Language → Language & Region.',
        `Click "Add a language", search for ${langLabel}, and add it.`,
        'Click the language you added → Options → under "Speech", click Download.',
        'Wait for the download to finish, then restart your browser.',
        'Come back here, refresh the page — the voice will appear.',
      ]
    case 'mac':
      return [
        'Open System Settings (or System Preferences) → Accessibility → Spoken Content.',
        'Click "Manage Voices…" next to the System Voice selector.',
        `Find ${langLabel} in the list — click the download icon beside a voice.`,
        'After it downloads, restart your browser and refresh this page.',
      ]
    case 'android':
      return [
        'Open Settings → General Management → Language → Text-to-Speech output.',
        '(On some phones: Settings → Accessibility → Text-to-Speech output.)',
        'Tap the gear icon next to "Google Text-to-Speech Engine".',
        `Select "Install voice data", choose ${langLabel}, then download.`,
        'Refresh this browser tab — the voice will be available.',
      ]
    case 'ios':
      return [
        'Open Settings → Accessibility → Spoken Content → Voices.',
        `Find ${langLabel} — tap it to expand, then tap a voice.`,
        'Tap the cloud/download icon to install it.',
        'Return to this page and refresh — then select the voice here.',
      ]
  }
}

function detectPlatform(): PlatformKey {
  const ua = navigator.userAgent
  if (/iPhone|iPad/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Macintosh|MacIntel/.test(ua) && !/iPhone|iPad/.test(ua)) return 'mac'
  return 'windows'
}

function VoiceInstallGuide({ langLabel }: { langLabel: string }) {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<PlatformKey>('windows')

  useEffect(() => { setPlatform(detectPlatform()) }, [])

  return (
    <div className="mt-2.5 rounded-2xl overflow-hidden"
      style={{ border: '1.5px solid #f59e4a55', backgroundColor: '#fffbf0' }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        style={{ backgroundColor: open ? '#fff3d4' : 'transparent' }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <div>
            <div className="font-sans text-xs font-bold leading-tight" style={{ color: '#b45309' }}>
              No {langLabel} voice on this device
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: '#92710a' }}>
              Narration will use English until you install it
            </div>
          </div>
        </div>
        <span className="font-mono text-xs font-bold flex-shrink-0 ml-2" style={{ color: '#b45309' }}>
          {open ? 'Hide ▲' : 'How to fix ▼'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Platform tabs */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {(Object.keys(PLATFORM_LABELS) as PlatformKey[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all"
                    style={{
                      backgroundColor: platform === p ? '#b45309' : 'rgba(180,83,9,0.10)',
                      color: platform === p ? '#fff' : '#b45309',
                    }}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>

              {/* Steps */}
              <ol className="flex flex-col gap-2">
                {getInstallSteps(platform, langLabel).map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold text-white"
                      style={{ backgroundColor: '#b45309', fontSize: '0.6rem' }}>
                      {i + 1}
                    </span>
                    <span className="font-sans text-xs leading-[1.65]" style={{ color: '#78350f' }}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-3 pt-3 flex items-start gap-2" style={{ borderTop: '1px solid #f59e4a40' }}>
                <span style={{ fontSize: '0.9rem' }}>💡</span>
                <p className="font-sans text-xs leading-[1.6]" style={{ color: '#92710a' }}>
                  After installing and refreshing, come back here and your new voice will appear in the picker. Preview it before saving.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  onClose: (savedLang?: string) => void
}

export function VoiceSettings({ onClose }: Props) {
  const { prefs, voices, save, speak, stopSpeaking, bestVoiceFor, hasSpeech } = useVoiceSettings()
  const [draft, setDraft] = useState({
    ...prefs,
    learnerVoiceName: prefs.learnerVoiceName ?? '',
    elGuideVoiceId:   prefs.elGuideVoiceId   ?? '',
    elLearnerVoiceId: prefs.elLearnerVoiceId  ?? '',
  })
  const [previewing, setPreviewing] = useState(false)
  const [genderFilter, setGenderFilter] = useState<Gender>('all')

  // Exact locale match only — no cross-accent fallback in the picker.
  // If no en-GB voices installed the picker is hidden and the install guide shows.
  // Normalize underscore form (en_GB) that Firefox and some Android browsers emit.
  const normLang = (l: string) => l.replace('_', '-')
  const draftLanguageVoices = voices.filter(v => normLang(v.lang).startsWith(draft.language))
  const hasNativeVoice = draftLanguageVoices.length > 0
  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === draft.language)

  // Which genders are actually available for this language?
  const availableGenders = useMemo<Gender[]>(() => {
    const hasFemale = draftLanguageVoices.some(v => detectGender(v) === 'female')
    const hasMale   = draftLanguageVoices.some(v => detectGender(v) === 'male')
    const options: Gender[] = ['all']
    if (hasFemale) options.push('female')
    if (hasMale)   options.push('male')
    return options
  }, [draftLanguageVoices])

  // Filtered voice list — fall back to 'all' if filter yields nothing
  const filteredVoices = useMemo(() => {
    if (genderFilter === 'all') return draftLanguageVoices
    const subset = draftLanguageVoices.filter(v => detectGender(v) === genderFilter)
    return subset.length > 0 ? subset : draftLanguageVoices
  }, [draftLanguageVoices, genderFilter])

  if (!hasSpeech) {
    return (
      <div className="p-6 text-center">
        <p className="font-sans text-sm text-muted">
          Voice narration isn't available in this browser. For the full experience, try Chrome or Edge.
        </p>
      </div>
    )
  }

  const handlePreset = (preset: typeof draft.preset) => {
    const p = VOICE_PRESETS[preset]
    setDraft(d => ({ ...d, preset, rate: p.rate, pitch: p.pitch }))
  }

  const handleLanguageChange = (language: string) => {
    const voiceName = bestVoiceFor(language)
    setDraft(d => ({ ...d, language, voiceName }))
  }

  const handleSave = async () => {
    await save(draft)
    onClose(draft.language)
  }

  const handlePreview = () => {
    if (previewing) {
      stopSpeaking()
      setPreviewing(false)
      return
    }
    setPreviewing(true)
    // Fall back to English text+voice when no native voice is installed
    const text = hasNativeVoice
      ? (SAMPLE_TEXT[draft.language] ?? SAMPLE_TEXT['en-US'])
      : SAMPLE_TEXT['en-US']
    const overrides = hasNativeVoice ? draft : { ...draft, language: 'en-US', voiceName: '' }
    speak(text, overrides)
    setTimeout(() => setPreviewing(false), 6000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-4 sm:p-6"
    >
      {/* Header + Save row — always visible at the top, no scrolling needed */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-extrabold text-lg text-ink">Voice settings</div>
          <div className="font-mono text-xs text-muted mt-0.5">Choose your language and voice, then save.</div>
        </div>
        <button onClick={() => onClose()} className="text-muted hover:text-ink transition-colors font-mono text-lg">✕</button>
      </div>

      {/* Action buttons — at the top so they're always accessible without scrolling */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all"
          style={{
            backgroundColor: previewing ? '#c43d0f' : '#fff',
            border: `2px solid ${previewing ? '#c43d0f' : 'rgba(26,24,37,0.15)'}`,
            color: previewing ? '#fff' : '#1a1825',
          }}
        >
          {previewing ? '⏹ Stop' : '▶ Preview'}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all"
          style={{ backgroundColor: '#1a1825', boxShadow: '0 2px 12px rgba(26,24,37,0.25)' }}
        >
          Save &amp; restart
        </button>
      </div>


      {/* AI voice pickers (ElevenLabs) — at top so always visible without scrolling */}
      {(() => {
        const guideOpts   = elGuideOptions(draft.language)
        const learnerOpts = elLearnerOptions(draft.language)
        return (
          <div className="flex flex-col gap-3 rounded-2xl p-4"
            style={{ backgroundColor: '#fffcf4', border: '1.5px solid rgba(184,106,20,0.25)' }}>
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: '#b86a14' }}>
                ✦ AI voices · ElevenLabs
              </div>
              <div className="font-sans text-xs mt-0.5 leading-[1.6]" style={{ color: '#a09a94' }}>
                Human-quality voices — 3–5 options per language. Requires{' '}
                <code className="font-mono" style={{ fontSize: '0.65rem' }}>ELEVENLABS_API_KEY</code>.{' '}
                Cached after first play — free tier is enough.
              </div>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
              {/* EL guide picker */}
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-1.5 block">
                  Guide voice
                </label>
                <select
                  value={draft.elGuideVoiceId}
                  onChange={e => setDraft(d => ({ ...d, elGuideVoiceId: e.target.value }))}
                  className="w-full rounded-xl py-2.5 px-3 font-sans text-xs bg-white focus:outline-none"
                  style={{ border: '1.5px solid rgba(26,24,37,0.12)' }}
                >
                  <option value="">Auto (default for language)</option>
                  {guideOpts.map(v => (
                    <option key={v.id} value={v.id}>{v.name} · {v.desc}</option>
                  ))}
                </select>
              </div>

              {/* EL learner picker */}
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-1.5 block">
                  Learner voice
                </label>
                <select
                  value={draft.elLearnerVoiceId}
                  onChange={e => setDraft(d => ({ ...d, elLearnerVoiceId: e.target.value }))}
                  className="w-full rounded-xl py-2.5 px-3 font-sans text-xs bg-white focus:outline-none"
                  style={{ border: '1.5px solid rgba(26,24,37,0.12)' }}
                >
                  <option value="">Auto (default for language)</option>
                  {learnerOpts.map(v => (
                    <option key={v.id} value={v.id}>{v.name} · {v.desc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Language */}
      <div>
        <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-2.5 block">
          Language
        </label>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = draft.language === lang.code
            const langHasVoice = voices.some(v => normLang(v.lang).startsWith(lang.code))
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: isSelected ? '#1a1825' : '#fff',
                  border: `1.5px solid ${isSelected ? '#1a1825' : 'rgba(26,24,37,0.10)'}`,
                  boxShadow: isSelected ? '0 2px 8px rgba(26,24,37,0.14)' : '0 1px 3px rgba(26,24,37,0.05)',
                }}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span
                    lang={lang.code}
                    className="text-xs font-semibold leading-tight truncate"
                    style={{
                      color: isSelected ? '#fff' : '#1a1825',
                      fontFamily: NOTO_FONT,
                    }}
                  >
                    {lang.nativeName}
                  </span>
                  <span className="leading-none truncate"
                    style={{ color: isSelected ? 'rgba(255,255,255,0.50)' : '#a09a94', fontSize: '0.57rem', fontFamily: 'DM Mono, monospace' }}>
                    {lang.label}{!langHasVoice ? ' · not installed' : ' · ready'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Install guide — shown only when selected language has no voice */}
        {!hasNativeVoice && selectedLang && (
          <VoiceInstallGuide langLabel={selectedLang.label} />
        )}
      </div>

      {/* Web Speech voice pickers (only if multiple voices available) */}
      {draftLanguageVoices.length > 1 && (
        <div className="flex flex-col gap-4 rounded-2xl p-4"
          style={{ backgroundColor: '#fffcf4', border: '1.5px solid rgba(26,24,37,0.08)' }}>
          <div className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: '#7a7570' }}>
            Browser voice · Web Speech <span style={{ fontWeight: 400 }}>— fallback when no AI key</span>
          </div>

          {/* Guide voice */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted">
                Guide <span style={{ color: '#7a7570', fontWeight: 400 }}>· teacher</span>
              </label>
              {availableGenders.length > 2 && (
                <div className="flex gap-1">
                  {availableGenders.map(g => (
                    <button
                      key={g}
                      onClick={() => setGenderFilter(g)}
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: genderFilter === g ? '#1a1825' : 'rgba(26,24,37,0.07)',
                        color: genderFilter === g ? '#fff' : '#7a7570',
                      }}
                    >
                      {g === 'all' ? 'All' : g === 'female' ? '♀' : '♂'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={draft.voiceName}
              onChange={e => setDraft(d => ({ ...d, voiceName: e.target.value, preset: 'custom' }))}
              className="w-full rounded-xl py-3 px-4 font-sans text-sm bg-white focus:outline-none"
              style={{ border: '1.5px solid rgba(26,24,37,0.12)' }}
            >
              {filteredVoices.map(v => {
                const g = detectGender(v)
                const gLabel = g === 'female' ? ' ♀' : g === 'male' ? ' ♂' : ''
                return (
                  <option key={v.name} value={v.name}>
                    {v.name}{gLabel}{v.default ? ' · default' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Learner voice */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted">
                Learner voice <span style={{ color: '#7a7570', fontWeight: 400 }}>· student</span>
              </label>
            </div>
            <select
              value={draft.learnerVoiceName ?? ''}
              onChange={e => setDraft(d => ({ ...d, learnerVoiceName: e.target.value }))}
              className="w-full rounded-xl py-3 px-4 font-sans text-sm bg-white focus:outline-none"
              style={{ border: '1.5px solid rgba(26,24,37,0.12)' }}
            >
              <option value="">Auto-pick (opposite gender)</option>
              {draftLanguageVoices.map(v => {
                const g = detectGender(v)
                const gLabel = g === 'female' ? ' ♀' : g === 'male' ? ' ♂' : ''
                return (
                  <option key={v.name} value={v.name}>
                    {v.name}{gLabel}{v.default ? ' · default' : ''}
                  </option>
                )
              })}
            </select>
            <p className="font-mono text-xs text-muted mt-1.5">
              Plays during demo narration when the learner character speaks. Pick a contrasting voice.
            </p>
          </div>

        </div>
      )}

      {/* Tone presets */}
      <div>
        <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted mb-2.5 block">
          Tone
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(VOICE_PRESETS) as [typeof draft.preset, typeof VOICE_PRESETS[keyof typeof VOICE_PRESETS]][])
            .filter(([key]) => key !== 'custom')
            .map(([key, p]) => {
              const isSelected = draft.preset === key
              return (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  className="rounded-xl p-3 text-left transition-all"
                  style={{
                    backgroundColor: isSelected ? '#1a1825' : '#fff',
                    border: `1.5px solid ${isSelected ? '#1a1825' : 'rgba(26,24,37,0.10)'}`,
                  }}
                >
                  <div className="font-display font-bold text-sm leading-tight"
                    style={{ color: isSelected ? '#fff' : '#1a1825' }}>
                    {p.label}
                  </div>
                  <div className="font-sans text-xs mt-0.5 leading-snug"
                    style={{ color: isSelected ? 'rgba(255,255,255,0.60)' : '#7a7570' }}>
                    {p.desc}
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      {/* Custom sliders */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted">Speed</label>
            <span className="font-mono text-xs font-bold" style={{ color: '#1a1825' }}>
              {draft.rate < 0.85 ? 'Slow' : draft.rate < 0.98 ? 'Natural' : draft.rate < 1.1 ? 'Brisk' : 'Fast'}
            </span>
          </div>
          <input type="range" min="0.65" max="1.35" step="0.05"
            value={draft.rate}
            onChange={e => setDraft(d => ({ ...d, rate: +e.target.value, preset: 'custom' }))}
            className="w-full accent-ink"
          />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-xs text-muted">Slow</span>
            <span className="font-mono text-xs text-muted">Fast</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-muted">Tone height</label>
            <span className="font-mono text-xs font-bold" style={{ color: '#1a1825' }}>
              {draft.pitch < 0.9 ? 'Deep' : draft.pitch < 1.05 ? 'Neutral' : draft.pitch < 1.2 ? 'Bright' : 'High'}
            </span>
          </div>
          <input type="range" min="0.70" max="1.40" step="0.05"
            value={draft.pitch}
            onChange={e => setDraft(d => ({ ...d, pitch: +e.target.value, preset: 'custom' }))}
            className="w-full accent-ink"
          />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-xs text-muted">Deeper</span>
            <span className="font-mono text-xs text-muted">Brighter</span>
          </div>
        </div>
      </div>

      {!hasNativeVoice && (
        <p className="font-sans text-xs text-center leading-[1.6]" style={{ color: '#a09a94' }}>
          Preview will play in English until {selectedLang?.label} is installed.
          Rate and tone adjustments will still be audible.
        </p>
      )}
    </motion.div>
  )
}
