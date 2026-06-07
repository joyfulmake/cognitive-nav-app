import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppMode } from '../core/types'
import { DEPTH_LAYERS, MASTERY_REQUIRED } from '../core/depthRubric'
import { useVoiceSettings, SUPPORTED_LANGUAGES } from '../lib/useVoiceSettings'
import { useKokoroTTS } from '../lib/useKokoroTTS'
import { useElevenLabsTTS, EL_VOICES } from '../lib/useElevenLabsTTS'
import { useOpenAITTS } from '../lib/useOpenAITTS'
import { VoiceSettings } from './VoiceSettings'

// ─── Typewriter ───────────────────────────────────────────────────────────────

function TypeWriter({ text, speed = 30, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const doneRef = useRef(false)
  useEffect(() => {
    setDisplayed('')
    doneRef.current = false
    let i = 0
    const t = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length && !doneRef.current) {
        doneRef.current = true
        clearInterval(t)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(t)
  }, [text]) // eslint-disable-line
  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.45, repeat: Infinity }}>|</motion.span>
      )}
    </span>
  )
}

// ─── Spotlight wrapper — gentle glow on the element being narrated ────────────

// NOTO_FONT: explicit stack used wherever non-Latin language names are displayed
const NOTO_FONT = '"Noto Sans Devanagari","Noto Sans Tamil","Noto Sans Telugu","Noto Sans Kannada","Noto Sans Arabic","Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif'

function Spotlight({
  id, active, color, children, radius = 14,
}: {
  id: string; active: string; color: string; children: React.ReactNode; radius?: number
}) {
  const on = id === active
  return (
    <motion.div
      animate={{
        boxShadow: on
          ? `0 0 0 2.5px ${color}88, 0 0 28px ${color}40`
          : '0 0 0 0px transparent',
      }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ borderRadius: radius }}
    >
      {children}
    </motion.div>
  )
}

// Maps phase type → 3 spotlight IDs activated at 0–33%, 33–66%, 66–100% of narration
const PHASE_SPOTLIGHTS: Record<string, [string, string, string]> = {
  'topic-select':   ['chips',    'input',    'input'],
  'target-select':  ['cards',    'target',   'info'],
  'intro-question': ['question', 'question', 'eval'],
  'l1-detected':    ['badge',    'prick',    'bar'],
  'gate1-study':    ['criteria', 'science',  'example'],
  'gate1-q':        ['question', 'mechanic', 'question'],
  'gate1-progress': ['badge',    'count',    'count'],
  'gate1-mastered': ['celebrate','dots',     'text'],
  'gate2-intro':    ['badge2',   'prick2',   'bar2'],
  'gate2-q':        ['question', 'condition','question'],
  'gate2-progress': ['badge2',   'count',    'count'],
  'gate2-mastered': ['celebrate','dots',     'text'],
  'completion':     ['score',    'stats',    'quote'],
}

function getSpotlight(phaseType: string, progress: number): string {
  const seq = PHASE_SPOTLIGHTS[phaseType]
  if (!seq) return ''
  const idx = Math.min(Math.floor(progress * 3), 2)
  return seq[idx]
}

// ─── Demo scripts ─────────────────────────────────────────────────────────────

interface DemoScript {
  appMode: AppMode
  topic: string
  target: 2 | 3
  gate1Questions: string[]
  gate2Questions: string[]
  gate1Prick: string
  gate2Prick: string
}

const EPISTEMIC: DemoScript = {
  appMode: 'epistemic',
  topic: 'TCP/IP reliability',
  target: 3,
  gate1Questions: [
    'Why does TCP use acknowledgments to ensure delivery?',
    'How does the three-way handshake establish a connection?',
    'Why does TCP use sequence numbers for packets?',
    'How does TCP detect packet loss using timers?',
    'Why does TCP use a sliding window for flow control?',
  ],
  gate2Questions: [
    'What if the SYN-ACK is lost during exponential backoff — does the connection establish?',
    'What if two packets arrive out of order — how does TCP decide which to buffer?',
    'What if the receiver window shrinks to zero mid-transfer — what does the sender do?',
    'What if both ends simultaneously close with FIN — is a TIME_WAIT needed on both sides?',
    'What if a retransmit timer fires during a congestion avoidance phase — does ssthresh reset?',
  ],
  gate1Prick: 'TCP is named. What mechanism actually guarantees reliable delivery — and how does the sender know a packet arrived?',
  gate2Prick: 'The mechanism is understood. Now stress it: name a specific condition where normal behavior breaks down.',
}

const CLINICAL: DemoScript = {
  appMode: 'clinical',
  topic: 'Jaundice pathophysiology',
  target: 3,
  gate1Questions: [
    'Why does hemolysis cause a rise in unconjugated bilirubin?',
    'How does the liver conjugate bilirubin and why is that step necessary?',
    'Why does obstructive jaundice cause conjugated bilirubin to rise?',
    'How does unconjugated bilirubin cross the blood-brain barrier?',
    'Why does neonatal jaundice carry a risk of kernicterus?',
  ],
  gate2Questions: [
    'What if a patient has both hemolysis AND hepatocellular damage — how do the bilirubin fractions compete?',
    'What if the bile duct is only partially obstructed — would you see a mixed or pure conjugated picture?',
    'What if albumin binding of unconjugated bilirubin is saturated by sulfonamides — what changes clinically?',
    'What if Gilbert syndrome coexists with haemolysis — does the jaundice severity multiply or add?',
    'What if phototherapy converts bilirubin to lumirubin — does this bypass the normal hepatic pathway entirely?',
  ],
  gate1Prick: 'Bilirubin is named. What is the mechanism by which excess unconjugated bilirubin accumulates — and which step in the pathway fails?',
  gate2Prick: 'The mechanism is clear. Now introduce a specific clinical condition that disrupts it — what breaks, and how do the fractions diverge?',
}

// ─── Multilingual narration scripts ──────────────────────────────────────────
// Warm, unhurried teacher register. Em-dashes and commas create natural breath pauses.
// English is the fallback for all languages not listed here.

const NARRATIONS: Record<string, Record<string, string>> = {
  en: {
    'topic-select':   "Hello! Before we begin — what genuinely puzzles you today? It could be anything: physics, medicine, economics, philosophy. Pick whatever pulls at you. That is always the right starting point. Type it here, or choose one of these suggestions below.",
    'target-select':  "Good. Now, how deep do you want to go? We have four depths to choose from. Layer one names things. Layer two asks how they work. Layer three finds what breaks. Layer four questions why the whole system exists at all. Which level challenges you today?",
    'intro-question': "Go ahead — type your very first question. There is truly no wrong way to start. Ask from wherever you genuinely are right now. We will show you exactly which depth it reaches.",
    'l1-detected':    "Good start! That was Layer 1 — you named the thing. Now look at this redirect below. We call it the prick. It is not a criticism at all — it is a precise gift. It points exactly at what your question missed. Read it carefully.",
    'gate1-q':        "Try this now. Ask how something works — or why it happens. Not what it is called. How it actually functions. Do you feel the difference? The word why, or how — that is the gateway. Watch how these questions are shaped.",
    'gate1-progress': "Yes! That one qualified. One down, four to go. Why five, you ask? Because one good question is a lucky moment. Five is a pattern. Five is where this way of thinking becomes your natural default — without deciding to.",
    'gate1-mastered': "Five crossings! Gate 1 is completely yours now. This is not a skill you applied — it is something you have become. You will ask why automatically, from here on. That is what mastery truly feels like from the inside.",
    'gate2-intro':    "Gate 2 opens now. The game changes here! Not just how it works — but what specific condition makes it fail? Not stress in general. Exactly what breaks, under exactly which circumstances. Precision is everything at this level.",
    'gate2-q':        "Listen to how this question is formed. See how specific it is? It names a concrete failure mode. That precision — right there in the question itself — that is Gate 2 language. Can you feel the difference from Layer 1?",
    'gate2-progress': "Layer 3! You just held two system states at once — normal operation, and a precise edge case. Wonderful. Do that five times, and your mind does it automatically — for any system you ever encounter.",
    'gate2-mastered': "Five again! Gate 2 is yours. Systemic thinking is your natural mode now. Wherever you go — any field, any problem — your mind reaches for the failure modes first. That instinct is permanent. It belongs to you.",
    'completion':     "There — the completion screen. Your score reflects the quality of today's inquiry. Not intelligence, not speed — how consistently you reached your chosen depth. Something just changed in how you think. Right now. In you.",
  },
  hi: {
    'topic-select':   "नमस्ते! शुरू करने से पहले — आज आपको क्या सच में जानना है? कोई भी विषय चलेगा: विज्ञान, चिकित्सा, इतिहास, दर्शन। जो आपको खींचे, वही सही शुरुआत है। यहाँ टाइप करें या नीचे से चुनें।",
    'target-select':  "अच्छा! अब बताइए — आप कितनी गहराई तक जाना चाहते हैं? चार स्तर हैं। Layer 1 नाम लेती है। Layer 2 कारण पूछती है। Layer 3 विफलता खोजती है। Layer 4 पूरी व्यवस्था पर सवाल करती है। आज की चुनौती कौन-सी है?",
    'intro-question': "चलिए — अपना पहला प्रश्न लिखें। कोई गलत शुरुआत नहीं होती। जहाँ हैं, वहाँ से ईमानदारी से शुरू करें। हम बताएंगे यह किस गहराई तक पहुँचा।",
    'l1-detected':    "बढ़िया शुरुआत! यह Layer 1 था — आपने चीज़ का नाम लिया। अब नीचे यह redirect देखें। इसे prick कहते हैं। यह आलोचना नहीं — एक सटीक उपहार है। यह बताता है क्या छूटा। ध्यान से पढ़ें।",
    'gate1-q':        "अब यह करके देखें — पूछें कि कोई चीज़ कैसे काम करती है, या क्यों होती है। नाम नहीं — कार्यप्रणाली। फ़र्क महसूस हो रहा है? शब्द क्यों और कैसे — यही द्वार है।",
    'gate1-progress': "हाँ! यह qualify हुआ। एक हो गया, चार बाकी। पाँच क्यों? क्योंकि एक अच्छा प्रश्न एक खुशनसीब पल है। पाँच से यह सोचने का तरीका आपका स्थायी स्वभाव बन जाता है।",
    'gate1-mastered': "पाँच! Gate 1 पूरी तरह आपका हो गया। यह कोई skill नहीं जो आपने लगाई — यह आप बन गए हैं। अब से आप क्यों अपने आप पूछेंगे। यही असली mastery है।",
    'gate2-intro':    "Gate 2 खुला! अब खेल बदलता है। सिर्फ़ यह नहीं कि कैसे काम करता है — बल्कि कौन-सी specific condition में fail होता है? सामान्य नहीं — बिल्कुल ठीक क्या टूटता है, और किन परिस्थितियों में।",
    'gate2-q':        "सुनें, यह प्रश्न कैसे बना है। कितना specific है? यह एक concrete failure mode का नाम लेता है। वह precision — सीधे प्रश्न में — यही Gate 2 की भाषा है। पहले से अंतर महसूस हो रहा है?",
    'gate2-progress': "Layer 3! आपने एक साथ दो states में सोचा — normal operation और precise edge case। शानदार! पाँच बार ऐसा करें, और आपका मन हर system के लिए यह automatic करेगा।",
    'gate2-mastered': "फिर पाँच! Gate 2 भी आपका। Systemic सोच अब आपका स्वाभाविक तरीका है। जहाँ भी जाएं — मन failure modes पहले खोजेगा। यह क्षमता अब हमेशा के लिए आपकी है।",
    'completion':     "यह रहा completion screen। आपका score आज की inquiry की गुणवत्ता दिखाता है। बुद्धिमत्ता नहीं, speed नहीं — आपकी consistency। अभी, इसी पल, आपके सोचने का तरीका बदल गया।",
  },
  ta: {
    'topic-select':   "வரவேற்கிறோம். உங்கள் ஆர்வத்துடன் பயணம் தொடங்குகிறது. உங்களுக்கு உண்மையில் ஆர்வமான தலைப்பை தேர்வு செய்யுங்கள் — இங்கே தட்டச்சு செய்யுங்கள், அல்லது கீழே உள்ள பரிந்துரையிலிருந்து தேர்வு செய்யுங்கள். தலைப்பு ஒரு விதை மட்டுமே. முக்கியமானது — நீங்கள் கேட்கப்போகும் கேள்வி.",
    'target-select':  "இப்போது ஆழத்தை தேர்வு செய்யுங்கள். நான்கு அடுக்குகள் உள்ளன. Layer 1 பெயரிடுகிறது. Layer 2 காரணம் கேட்கிறது. Layer 3 தோல்வியை ஆராய்கிறது. Layer 4 முழு அமைப்பின் வடிவமைப்பையும் கேள்வி கேட்கிறது. உங்கள் இலக்கை அமைக்கவும்.",
    'intro-question': "உங்கள் முதல் கேள்வி. தவறான தொடக்கம் என்று இல்லை. நீங்கள் இருக்கும் இடத்திலிருந்து நேர்மையாக தொடங்குங்கள். உங்கள் கேள்வி எந்த ஆழத்தை அடைந்தது என்பதை system சரியாக காட்டும்.",
    'l1-detected':    "Layer 1 — உண்மை நிலை. இது நேர்மையான தொடக்கம். ஒவ்வொரு நிபுணரும் இங்கே தொடங்கினார்கள். இந்த திசைமாற்றத்தை பாருங்கள் — இதை prick என்று அழைக்கிறோம். உங்கள் கேள்வி என்ன விடுபட்டது என்பதை அது சுட்டுகிறது.",
    'gate1-q':        "Gate 1. உங்கள் கேள்வி ஒரு காரண உறவை பெயரிட வேண்டும் — எதாவது எப்படி செயல்படுகிறது, அல்லது ஏன் நடக்கிறது. பெயர் அல்ல — செயல்பாடு. ஏன் மற்றும் எப்படி — இவையே வாயில்.",
    'gate1-progress': "அது தகுதி பெற்றது. ஒரு கடக்கல். ஐந்து தேவை — ஒன்று தவறு என்பதால் அல்ல, ஒன்று இன்னும் ஒரு pattern அல்ல. ஐந்தில் relational சிந்தனை நிரந்தரமாகிறது.",
    'gate1-mastered': "Gate 1 முடிந்தது. ஐந்து கடக்கல். Relational சிந்தனை இப்போது உங்கள் இயல்பான தொடக்கம் — முடிவெடுக்காமல் தானாகவே. இதுவே mastery.",
    'gate2-intro':    "Gate 2 திறந்தது. சவால் மாறுகிறது. இப்போது குறிப்பிட்ட நிலையை பெயரிடவும் — பொதுவான அழுத்தம் அல்ல — சரியாக என்ன தோல்வியடைகிறது, எந்த சூழ்நிலையில்.",
    'gate2-q':        "இந்த கேள்வி ஒரு குறிப்பிட்ட நிலையை பெயரிடுகிறது — ஒரு concrete failure mode. அந்த துல்லியம் — கேள்வியிலேயே — Gate 2 மொழி. முன்பிலிருந்து வேறுபாடு கவனியுங்கள்.",
    'gate2-progress': "Layer 3 உறுதிப்பட்டது. நீங்கள் ஒரே நேரத்தில் இரண்டு நிலைகளில் சிந்திக்கிறீர்கள் — normal operation மற்றும் precise edge case. ஐந்து முறை — எந்த system க்கும் இது தானாகவே வரும்.",
    'gate2-mastered': "Gate 2 முடிந்தது. Systemic சிந்தனை இப்போது உங்கள் இயல்பான முறை. எந்த system ஐயும் பாருங்கள் — மனம் failure mode ஐ தேடும். இந்த உள்ளுணர்வு என்றும் உங்களுடையது.",
    'completion':     "முடிவு திரை. உங்கள் மதிப்பெண் இன்றைய inquiry இன் ஆழத்தை அளவிடுகிறது — அறிவுத்திறன் அல்ல, நிலைத்தன்மை. பாதை — இப்போது — உங்களுக்குள் உருவாகிறது.",
  },
  te: {
    'topic-select':   "స్వాగతం. మీ అన్వేషణ ఇక్కడ మొదలవుతుంది — నిజమైన ఆసక్తితో. మీకు నిజంగా ఆసక్తిగా అనిపించే అంశాన్ని ఎంచుకోండి. ఇక్కడ టైప్ చేయండి, లేదా సూచన నుండి ఎంచుకోండి. అంశం ఒక విత్తనం మాత్రమే. ముఖ్యమైనది — మీరు అడగబోయే ప్రశ్న.",
    'target-select':  "ఇప్పుడు — లోతు ఎంచుకోండి. నాలుగు స్థాయిలు ఉన్నాయి. Layer 1 పేరు పెడుతుంది. Layer 2 కారణం అడుగుతుంది. Layer 3 వైఫల్యాన్ని అన్వేషిస్తుంది. Layer 4 వ్యవస్థ రూపకల్పనను ప్రశ్నిస్తుంది. మీ సవాలును నిర్ణయించండి.",
    'intro-question': "మీ మొదటి ప్రశ్న. తప్పు ప్రారంభం అంటూ ఏమీ లేదు. మీరు ఉన్న చోటు నుండి నేరుగా మొదలు పెట్టండి. System మీ ప్రశ్న ఏ లోతును చేరిందో చెప్పగలదు.",
    'l1-detected':    "Layer 1 — వాస్తవ స్థాయి. ఇది నిజాయితీగల ప్రారంభం. ఈ దారిమళ్లింపును చూడండి — దీన్ని prick అంటారు. మీ ప్రశ్న ఏమి మిస్ చేసిందో అది చూపిస్తుంది.",
    'gate1-q':        "Gate 1. మీ ప్రశ్న ఒక కారణ సంబంధాన్ని పేర్కొనాలి — ఏదైనా ఎలా పని చేస్తుందో, లేదా ఎందుకు జరుగుతుందో. పేరు కాదు — విధానం. ఎందుకు మరియు ఎలా — ఇవే ద్వారం.",
    'gate1-progress': "అది అర్హత పొందింది. ఒకటి లెక్కించబడింది. ఐదు అవసరం — ఒకటి తప్పు కాబట్టి కాదు, ఒకటి ఇంకా pattern కాదు. ఐదులో relational ఆలోచన శాశ్వతమవుతుంది.",
    'gate1-mastered': "Gate 1 పూర్తయింది. ఐదు సార్లు. Relational ఆలోచన ఇప్పుడు మీ సహజ ప్రారంభం — నిర్ణయించుకోకుండా, తానంతట తాను.",
    'gate2-intro':    "Gate 2 తెరుచుకుంది. సవాల్ మారింది. ఇప్పుడు నిర్దిష్ట పరిస్థితిని పేర్కొనండి — సాధారణ ఒత్తిడి కాదు — సరిగ్గా ఏది విఫలమవుతుందో, ఏ పరిస్థితులలో.",
    'gate2-q':        "ఈ ప్రశ్న ఒక నిర్దిష్ట పరిస్థితిని పేర్కొంటుంది — ఒక concrete failure mode. ఆ precision — ప్రశ్నలోనే — Gate 2 భాష.",
    'gate2-progress': "Layer 3 నిర్ధారించబడింది. మీరు ఒకేసారి రెండు states లో ఆలోచిస్తున్నారు. ఐదు సార్లు — ఏ system కైనా ఇది స్వయంచాలకంగా అవుతుంది.",
    'gate2-mastered': "Gate 2 పూర్తయింది. Systemic ఆలోచన ఇప్పుడు మీ సహజ తీరు. ఏ వ్యవస్థనైనా చూడండి — మనసు failure mode ను వెతుకుతుంది. ఈ స్వభావం శాశ్వతంగా మీది.",
    'completion':     "పూర్తి చేసే స్క్రీన్. మీ స్కోర్ ఈరోజు inquiry యొక్క లోతును కొలుస్తుంది — తెలివి కాదు, నిలకడ. ఈ పాత్ర — ఇప్పుడే — మీలో రూపొందుతోంది.",
  },
  kn: {
    'topic-select':   "ಸ್ವಾಗತ. ನಿಮ್ಮ ಅನ್ವೇಷಣೆ ಇಲ್ಲಿ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ — ನಿಜವಾದ ಕುತೂಹಲದೊಂದಿಗೆ. ನಿಮಗೆ ಆಸಕ್ತಿ ಇರುವ ಯಾವುದೇ ವಿಷಯ ಆಯ್ಕೆ ಮಾಡಿ. ವಿಷಯ ಕೇವಲ ಒಂದು ಬೀಜ. ಮುಖ್ಯವಾದದ್ದು — ನೀವು ಕೇಳಲಿರುವ ಪ್ರಶ್ನೆ.",
    'target-select':  "ಈಗ — ಆಳವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ನಾಲ್ಕು ಹಂತಗಳಿವೆ. Layer 1 ಹೆಸರಿಡುತ್ತದೆ. Layer 2 ಕಾರಣ ಕೇಳುತ್ತದೆ. Layer 3 ವೈಫಲ್ಯ ಅನ್ವೇಷಿಸುತ್ತದೆ. Layer 4 ವ್ಯವಸ್ಥೆಯ ವಿನ್ಯಾಸವನ್ನೇ ಪ್ರಶ್ನಿಸುತ್ತದೆ.",
    'intro-question': "ನಿಮ್ಮ ಮೊದಲ ಪ್ರಶ್ನೆ. ತಪ್ಪು ಆರಂಭ ಎಂದು ಏನೂ ಇಲ್ಲ. ನೀವಿರುವಲ್ಲಿಂದ ಪ್ರಾಮಾಣಿಕವಾಗಿ ಪ್ರಾರಂಭಿಸಿ.",
    'l1-detected':    "Layer 1 — ವಾಸ್ತವ ಮಟ್ಟ. ಪ್ರಾಮಾಣಿಕ ಆರಂಭ. ಈ ಮರು-ನಿರ್ದೇಶನ ನೋಡಿ — ಇದನ್ನು prick ಎಂದು ಕರೆಯುತ್ತಾರೆ. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಏನನ್ನು ತಪ್ಪಿಸಿಕೊಂಡಿತು ಎಂದು ತೋರಿಸುತ್ತದೆ.",
    'gate1-q':        "Gate 1. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕಾರಣ-ಪರಿಣಾಮ ಸಂಬಂಧ ಹೆಸರಿಸಬೇಕು — ಏನಾದರೂ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಅಥವಾ ಏಕೆ ಆಗುತ್ತದೆ ಎಂದು. ಹೆಸರಲ್ಲ — ಕ್ರಿಯೆ. ಏಕೆ ಮತ್ತು ಹೇಗೆ — ಇವೇ ದ್ವಾರ.",
    'gate1-progress': "ಅದು ಅರ್ಹವಾಯಿತು. ಒಂದು ದಾಟಿಕೆ. ಐದು ಬೇಕು — ಒಂದು ಇನ್ನೂ pattern ಅಲ್ಲ. ಐದರಲ್ಲಿ relational ಚಿಂತನೆ ಶಾಶ್ವತವಾಗುತ್ತದೆ.",
    'gate1-mastered': "Gate 1 ಮುಗಿದಿದೆ. ಐದು ದಾಟಿಕೆ. Relational ಚಿಂತನೆ ಈಗ ನಿಮ್ಮ ಸ್ವಾಭಾವಿಕ ಪ್ರಾರಂಭ.",
    'gate2-intro':    "Gate 2 ತೆರೆದಿದೆ. ಸವಾಲು ಬದಲಾಗಿದೆ. ನಿರ್ದಿಷ್ಟ ಸ್ಥಿತಿ ಹೆಸರಿಸಿ — ಏನು ವಿಫಲವಾಗುತ್ತದೆ, ಯಾವ ಸಂದರ್ಭದಲ್ಲಿ.",
    'gate2-q':        "ಈ ಪ್ರಶ್ನೆ ನಿರ್ದಿಷ್ಟ ಸ್ಥಿತಿ ಹೆಸರಿಸುತ್ತದೆ — ಒಂದು concrete failure mode. ಆ precision Gate 2 ಭಾಷೆ.",
    'gate2-progress': "Layer 3 ದೃಢಪಟ್ಟಿದೆ. ಒಂದೇ ಸಮಯದಲ್ಲಿ ಎರಡು states ಯಲ್ಲಿ ಯೋಚಿಸುತ್ತಿದ್ದೀರಿ. ಐದು ಬಾರಿ — ಯಾವ system ಗೂ ಇದು ಸ್ವಯಂಚಾಲಿತವಾಗುತ್ತದೆ.",
    'gate2-mastered': "Gate 2 ಮುಗಿದಿದೆ. Systemic ಚಿಂತನೆ ಈಗ ನಿಮ್ಮ ಸ್ವಾಭಾವಿಕ ಮಾರ್ಗ. ಯಾವ system ನೋಡಿದರೂ — ಮನಸ್ಸು failure mode ಹುಡುಕುತ್ತದೆ. ಈ ಸ್ವಭಾವ ಶಾಶ್ವತವಾಗಿ ನಿಮ್ಮದು.",
    'completion':     "ಮುಕ್ತಾಯ ಪರದೆ. ನಿಮ್ಮ ಸ್ಕೋರ್ ಇಂದಿನ inquiry ಆಳ ಅಳೆಯುತ್ತದೆ — ಬುದ್ಧಿಮತ್ತೆ ಅಲ್ಲ. ಈ ಹಾದಿ — ಈಗ — ನಿಮ್ಮಲ್ಲಿ ರೂಪುಗೊಳ್ಳುತ್ತಿದೆ.",
  },
  mr: {
    'topic-select':   "स्वागत आहे. तुमची जिज्ञासा येथून सुरू होते. तुम्हाला खरोखर आवडणारा कोणताही विषय निवडा — येथे टाइप करा किंवा सुचवण्यातून निवडा. विषय एक बीज आहे. महत्त्वाचे — तुम्ही विचारणार असलेला प्रश्न.",
    'target-select':  "आता — खोली निवडा. चार स्तर आहेत. Layer 1 नाव देते. Layer 2 कारण विचारते. Layer 3 अपयश शोधते. Layer 4 संपूर्ण व्यवस्थेवर प्रश्न करते.",
    'intro-question': "पहिला प्रश्न. चुकीची सुरुवात नसते. जिथे आहात तिथून प्रामाणिकपणे सुरू करा.",
    'l1-detected':    "Layer 1 — वास्तव स्तर. प्रामाणिक सुरुवात. हा redirect पहा — याला prick म्हणतात. तुमचा प्रश्न काय चुकला ते हे दाखवते.",
    'gate1-q':        "Gate 1. प्रश्नात कार्यकारण संबंध असणे आवश्यक आहे — काहीतरी कसे कार्य करते, किंवा का होते. नाव नाही — कार्यपद्धती. का आणि कसे — हेच द्वार.",
    'gate1-progress': "ते qualify झाले. एक मोजले. पाच आवश्यक — एकच pattern बनवत नाही. पाच मध्ये relational विचार कायमचा होतो.",
    'gate1-mastered': "Gate 1 पूर्ण. पाच वेळा. Relational विचार आता तुमची स्वाभाविक सुरुवात — न ठरवता, आपोआप.",
    'gate2-intro':    "Gate 2 उघडले. आव्हान बदलले. विशिष्ट परिस्थिती नाव द्या — काय अयशस्वी होते, कोणत्या परिस्थितीत.",
    'gate2-q':        "हा प्रश्न विशिष्ट परिस्थिती पाहा — एक ठोस failure mode. ती precision Gate 2 भाषा.",
    'gate2-progress': "Layer 3 पुष्टी. एकाच वेळी दोन states मध्ये विचार करत आहात. पाच वेळा — कोणत्याही system साठी स्वयंचलित.",
    'gate2-mastered': "Gate 2 पूर्ण. Systemic विचार आता स्वाभाविक पद्धत. कोणतीही system पहा — मन failure mode शोधते. हे कायमचे तुमचे.",
    'completion':     "समाप्ती screen. स्कोर आजच्या inquiry ची खोली दाखवतो — बुद्धिमत्ता नाही. हा मार्ग — आत्ता — तुमच्यात तयार होत आहे.",
  },
  es: {
    'topic-select':   "Bienvenido. Tu investigación comienza aquí — con genuina curiosidad. Elige cualquier tema que realmente te atraiga. Escríbelo aquí, o elige una sugerencia. El tema es solo una semilla. Lo que importa — es la pregunta que estás a punto de hacer.",
    'target-select':  "Ahora — elige qué tan profundo quieres ir. Cuatro profundidades disponibles. Layer 1 nombra lo que existe. Layer 2 traza cómo funciona. Layer 3 explora qué falla, y por qué. Layer 4 cuestiona el diseño mismo. Establece tu desafío.",
    'intro-question': "Tu primera pregunta. No hay punto de partida incorrecto. Empieza con honestidad — desde donde estás. El sistema te dirá exactamente qué profundidad alcanzó tu pregunta.",
    'l1-detected':    "Layer 1 — el nivel factual. Un punto de partida honesto. Todo experto comenzó aquí. Esta redirección — el prick — nombra lo que faltó. Apunta al mecanismo que hay debajo. Síguelo.",
    'gate1-q':        "Gate 1. Tu pregunta debe nombrar una relación causal — cómo algo funciona, o por qué sucede. No cómo se llama. Cómo funciona. Las palabras por qué y cómo — son la puerta.",
    'gate1-progress': "Calificó. Un cruce. Se necesitan cinco — no porque uno sea incorrecto, sino porque uno no es aún un patrón. Cinco es donde el pensamiento relacional se vuelve permanente — automático.",
    'gate1-mastered': "Gate 1 dominado. Cinco cruces. El nivel relacional es ahora tu base — preguntarás por qué, automáticamente, sin decidirlo. Eso es maestría.",
    'gate2-intro':    "Gate 2 abierto. El desafío cambia. Tu pregunta debe nombrar una condición específica — no el estrés en general, sino exactamente qué falla — y bajo qué circunstancias concretas.",
    'gate2-q':        "Esta pregunta nombra una condición específica — un modo de fallo concreto. Esa precisión — ahí mismo en la pregunta — es el lenguaje del Gate 2.",
    'gate2-progress': "Layer 3 confirmado. Sostienes dos estados del sistema a la vez — operación normal y el caso límite preciso. Cinco repeticiones — y esto se vuelve automático.",
    'gate2-mastered': "Gate 2 dominado. El pensamiento sistémico es tu modo natural. Cuando encuentras cualquier sistema — tu mente busca los modos de fallo. Ese instinto es tuyo — permanentemente.",
    'completion':     "La pantalla de finalización. Tu puntuación mide qué tan consistentemente llegaste a tu profundidad objetivo. No inteligencia — no velocidad. La calidad de la indagación de hoy. El camino se está formando.",
  },
  pt: {
    'topic-select':   "Bem-vindo. Sua investigação começa aqui — com genuína curiosidade. Escolha qualquer tema que realmente te atraia. Digite aqui, ou escolha uma sugestão. O tema é só uma semente. O que importa — é a pergunta que você está prestes a fazer.",
    'target-select':  "Agora — escolha sua profundidade. Quatro profundidades disponíveis. Layer 1 nomeia o que existe. Layer 2 traça como funciona. Layer 3 explora o que falha, e por quê. Layer 4 questiona o próprio design. Defina seu desafio.",
    'intro-question': "Sua primeira pergunta. Não há ponto de partida errado. Comece com honestidade — de onde você está. O sistema dirá exatamente qual profundidade sua pergunta alcançou.",
    'l1-detected':    "Layer 1 — o nível factual. Um ponto de partida honesto. Todo especialista começou aqui. Este redirecionamento — o prick — nomeia o que faltou. Aponta para o mecanismo abaixo. Siga-o.",
    'gate1-q':        "Gate 1. Sua pergunta deve nomear uma relação causal — como algo funciona, ou por que acontece. Não como é chamado. Como funciona. As palavras por que e como — são a porta.",
    'gate1-progress': "Qualificou. Uma travessia. Cinco são necessárias — não porque uma está errada, mas porque uma ainda não é um padrão. Cinco é onde o pensamento relacional se torna permanente.",
    'gate1-mastered': "Gate 1 dominado. Cinco travessias. O nível relacional é agora sua base — você perguntará por quê, automaticamente, sem decidir. Isso é maestria.",
    'gate2-intro':    "Gate 2 aberto. O desafio muda. Sua pergunta deve nomear uma condição específica — não o estresse em geral, mas exatamente o que falha — e sob quais circunstâncias concretas.",
    'gate2-q':        "Esta pergunta nomeia uma condição específica — um modo de falha concreto. Essa precisão — ali mesmo na pergunta — é a linguagem do Gate 2.",
    'gate2-progress': "Layer 3 confirmado. Você mantém dois estados do sistema simultaneamente. Cinco repetições — e isso se torna automático para qualquer sistema.",
    'gate2-mastered': "Gate 2 dominado. Pensamento sistémico é seu modo natural. Encontre qualquer sistema — sua mente busca os modos de falha. Esse instinto é seu — permanentemente.",
    'completion':     "A tela de conclusão. Sua pontuação mede quão consistentemente você alcançou sua profundidade alvo. Não inteligência — não velocidade. A qualidade da investigação de hoje.",
  },
  fr: {
    'topic-select':   "Bienvenue. Votre investigation commence ici — avec une curiosité sincère. Choisissez n'importe quel sujet qui vous attire vraiment. Tapez-le ici, ou choisissez une suggestion. Le sujet n'est qu'une graine. Ce qui compte — c'est la question que vous allez poser.",
    'target-select':  "Maintenant — choisissez votre profondeur. Quatre niveaux disponibles. Layer 1 nomme ce qui existe. Layer 2 trace comment ça fonctionne. Layer 3 explore ce qui échoue, et pourquoi. Layer 4 questionne le design lui-même. Choisissez votre défi.",
    'intro-question': "Votre première question. Il n'y a pas de mauvais point de départ. Commencez honnêtement — depuis où vous êtes. Le système vous dira exactement quelle profondeur votre question a atteinte.",
    'l1-detected':    "Layer 1 — le niveau factuel. Un point de départ honnête. Tout expert a commencé ici. Cette redirection — le prick — nomme ce qui manquait. Elle pointe vers le mécanisme en dessous. Suivez-la.",
    'gate1-q':        "Gate 1. Votre question doit nommer une relation causale — comment quelque chose fonctionne, ou pourquoi ça se produit. Pas son nom. Son fonctionnement. Les mots pourquoi et comment — sont la porte.",
    'gate1-progress': "Qualifiée. Une traversée. Cinq sont nécessaires — pas parce qu'une est fausse, mais parce qu'une n'est pas encore un schéma. Cinq, c'est là où la pensée relationnelle devient permanente.",
    'gate1-mastered': "Gate 1 maîtrisé. Cinq traversées. Le niveau relationnel est maintenant votre référence — vous demanderez pourquoi, automatiquement, sans le décider. C'est la maîtrise.",
    'gate2-intro':    "Gate 2 ouvert. Le défi change. Votre question doit nommer une condition spécifique — pas le stress en général, mais exactement ce qui échoue — et dans quelles circonstances concrètes.",
    'gate2-q':        "Cette question nomme une condition spécifique — un mode de défaillance concret. Cette précision — là, dans la question — est le langage du Gate 2.",
    'gate2-progress': "Layer 3 confirmé. Vous maintenez deux états du système simultanément. Cinq répétitions — et cela devient automatique pour n'importe quel système.",
    'gate2-mastered': "Gate 2 maîtrisé. La pensée systémique est votre mode naturel. Rencontrez n'importe quel système — votre esprit cherche les modes de défaillance. Cet instinct est le vôtre — en permanence.",
    'completion':     "L'écran de complétion. Votre score mesure à quel point vous avez atteint votre profondeur cible. Pas l'intelligence — pas la vitesse. La qualité de l'investigation d'aujourd'hui.",
  },
  de: {
    'topic-select':   "Willkommen. Ihre Untersuchung beginnt hier — mit echter Neugier. Wählen Sie ein Thema, das Sie wirklich anzieht. Geben Sie es hier ein, oder wählen Sie einen Vorschlag. Das Thema ist nur ein Saatgut. Was zählt — ist die Frage, die Sie stellen werden.",
    'target-select':  "Jetzt — wählen Sie Ihre Tiefe. Vier Ebenen verfügbar. Layer 1 benennt was existiert. Layer 2 verfolgt wie es funktioniert. Layer 3 erkundet was versagt, und warum. Layer 4 hinterfragt das Design selbst. Wählen Sie Ihre Herausforderung.",
    'intro-question': "Ihre erste Frage. Es gibt keinen falschen Ausgangspunkt. Beginnen Sie ehrlich — von wo Sie sind. Das System zeigt Ihnen genau, welche Tiefe Ihre Frage erreicht hat.",
    'l1-detected':    "Layer 1 — die faktische Ebene. Ein ehrlicher Ausgangspunkt. Jeder Experte hat hier begonnen. Diese Weiterleitung — der Prick — benennt was fehlte. Sie zeigt auf den Mechanismus darunter. Folgen Sie ihr.",
    'gate1-q':        "Gate 1. Ihre Frage muss eine kausale Beziehung nennen — wie etwas funktioniert, oder warum es passiert. Nicht wie es heißt. Wie es funktioniert. Die Wörter warum und wie — sind das Tor.",
    'gate1-progress': "Qualifiziert. Eine Durchquerung. Fünf sind nötig — nicht weil eine falsch ist, sondern weil eine noch kein Muster ist. Fünf ist wo relationales Denken permanent wird.",
    'gate1-mastered': "Gate 1 gemeistert. Fünf Durchquerungen. Die relationale Ebene ist jetzt Ihre Grundlage — Sie werden warum fragen, automatisch, ohne es zu entscheiden. Das ist Meisterschaft.",
    'gate2-intro':    "Gate 2 geöffnet. Die Herausforderung ändert sich. Ihre Frage muss eine spezifische Bedingung nennen — nicht Stress im Allgemeinen, sondern genau was versagt — und unter welchen konkreten Umständen.",
    'gate2-q':        "Diese Frage benennt eine spezifische Bedingung — einen konkreten Fehlermodus. Diese Präzision — genau da in der Frage — ist Gate 2 Sprache.",
    'gate2-progress': "Layer 3 bestätigt. Sie halten zwei Systemzustände gleichzeitig. Fünf Wiederholungen — und das wird automatisch für jedes System.",
    'gate2-mastered': "Gate 2 gemeistert. Systemisches Denken ist Ihr natürlicher Modus. Begegnen Sie einem System — Ihr Geist sucht die Fehlermodi. Dieser Instinkt gehört Ihnen — dauerhaft.",
    'completion':     "Der Abschlussbildschirm. Ihre Punktzahl misst wie konsistent Sie Ihre Zieltiefe erreicht haben. Nicht Intelligenz — nicht Geschwindigkeit. Die Qualität der heutigen Untersuchung.",
  },
  ar: {
    'topic-select':   "مرحباً بك. استفسارك يبدأ هنا — بفضول حقيقي. اختر أي موضوع يجذبك فعلاً. اكتبه هنا، أو اختر اقتراحاً. الموضوع مجرد بذرة. ما يهم — هو السؤال الذي أنت على وشك طرحه.",
    'target-select':  "الآن — اختر عمقك. أربعة مستويات متاحة. الطبقة 1 تُسمّي. الطبقة 2 تتتبع كيف يعمل. الطبقة 3 تستكشف ما يفشل ولماذا. الطبقة 4 تتساءل عن التصميم نفسه. اختر تحديك.",
    'intro-question': "سؤالك الأول. لا يوجد نقطة بداية خاطئة. ابدأ بصدق — من حيث أنت. سيخبرك النظام بالضبط أي عمق وصل إليه سؤالك.",
    'l1-detected':    "الطبقة 1 — المستوى الواقعي. نقطة بداية صادقة. كل خبير بدأ هنا. هذا التوجيه — الـ prick — يُسمّي ما فات. يشير إلى الآلية الكامنة تحتها. اتبعه.",
    'gate1-q':        "البوابة 1. يجب أن يُسمّي سؤالك علاقة سببية — كيف يعمل شيء ما، أو لماذا يحدث. ليس اسمه. كيفية عمله. كلمتا لماذا وكيف — هما البوابة.",
    'gate1-progress': "مؤهَّل. عبور واحد. خمسة مطلوبة — ليس لأن واحدة خاطئة، بل لأن واحدة ليست بعد نمطاً. عند الخمسة يصبح التفكير العلائقي دائماً.",
    'gate1-mastered': "البوابة 1 مُتقنة. خمسة عبورات. المستوى العلائقي هو الآن قاعدتك — ستسأل لماذا، تلقائياً، دون أن تقرر ذلك. هذا هو الإتقان.",
    'gate2-intro':    "البوابة 2 مفتوحة. التحدي يتغير. يجب أن يُسمّي سؤالك حالة محددة — ليس الضغط عموماً، بل بالضبط ما يفشل — وتحت أي ظروف ملموسة.",
    'gate2-q':        "هذا السؤال يُسمّي حالة محددة — وضع فشل ملموس. هذه الدقة — هناك في السؤال — هي لغة البوابة 2.",
    'gate2-progress': "الطبقة 3 مؤكدة. أنت تحتفظ بحالتي النظام في وقت واحد. خمس تكرارات — وهذا يصبح تلقائياً لأي نظام.",
    'gate2-mastered': "البوابة 2 مُتقنة. التفكير المنظومي هو وضعك الطبيعي. عند مواجهة أي نظام — يسعى عقلك نحو أوضاع الفشل. هذه الغريزة ملكك — بشكل دائم.",
    'completion':     "شاشة الإتمام. درجتك تقيس مدى اتساقك في الوصول إلى عمقك المستهدف. ليس ذكاء — ليس سرعة. جودة استفسار اليوم. المسار يتشكل.",
  },
  zh: {
    'topic-select':   "欢迎。您的探究从这里开始 — 带着真正的好奇心。选择任何真正吸引您的主题。在此输入，或选择建议。主题只是种子。重要的 — 是您即将提出的问题。",
    'target-select':  "现在 — 选择您的深度。四个层次可选。第一层命名存在。第二层追溯运作方式。第三层探索失败原因。第四层质疑系统设计本身。设定您的挑战。",
    'intro-question': "您的第一个问题。没有错误的起点。诚实地开始 — 从您所在的地方。系统将告诉您问题达到了哪个深度。",
    'l1-detected':    "第一层 — 事实层面。诚实的起点。每个专家都从这里开始。这个重定向 — 被称为prick — 指出缺失的内容。它指向名称背后的机制。",
    'gate1-q':        "第一关。您的问题必须命名因果关系 — 某事如何运作，或为什么发生。不是名称。是功能。为什么和如何 — 是门。",
    'gate1-progress': "合格了。一次穿越。需要五次 — 因为一次还不是模式。五次是关系性思维变得永久的阈值。",
    'gate1-mastered': "第一关已掌握。五次穿越。关系层面是您的基线 — 您会自动问为什么，无需决定。这就是掌握。",
    'gate2-intro':    "第二关开放。挑战改变了。您的问题必须命名具体条件 — 不是一般压力，而是确切地什么会失败 — 以及在哪些具体情况下。",
    'gate2-q':        "这个问题命名了具体条件 — 具体的失败模式。这种精确性 — 就在问题中 — 是第二关的语言。",
    'gate2-progress': "第三层已确认。您同时持有两种系统状态。五次重复 — 这将变得自动 — 对任何系统。",
    'gate2-mastered': "第二关已掌握。系统性思维是您的自然模式。遇到任何系统 — 您的思维会自动寻找失败模式。这种本能是您的 — 永久的。",
    'completion':     "完成界面。您的分数衡量您达到目标深度的一致性。不是智慧 — 不是速度。今天探究的质量。道路正在形成。",
  },
  ja: {
    'topic-select':   "ようこそ。あなたの探究はここから始まります — 真の好奇心とともに。本当に興味を引くテーマを選んでください。ここに入力するか、提案から選んでください。テーマは種に過ぎません。大切なのは — あなたが間もなく尋ねる質問です。",
    'target-select':  "次に — 深さを選んでください。4つの深さがあります。第1層は存在するものを命名します。第2層は仕組みを追います。第3層は何が失敗するかを探ります。第4層はシステムの設計自体に疑問を呈します。",
    'intro-question': "最初の質問。間違った出発点はありません。正直に — 今いる場所から始めてください。システムは質問がどの深さに達したかを正確に示します。",
    'l1-detected':    "第1層 — 事実レベル。正直な出発点です。この再誘導 — prickと呼ばれます — 欠けていたものを示します。名前の下にある仕組みを指し示します。",
    'gate1-q':        "ゲート1。あなたの質問は因果関係を命名する必要があります — 何かがどのように機能するか、またはなぜ起こるか。名前ではありません。機能の仕方です。なぜとどのように — が入り口です。",
    'gate1-progress': "合格しました。1回の通過。5回必要です — 1回はまだパターンではないから。5回で関係的思考が永続的になります。",
    'gate1-mastered': "ゲート1をマスターしました。5回の通過。関係的レベルは今あなたの基準線です — 決めなくても自動的になぜと尋ねます。それがマスタリーです。",
    'gate2-intro':    "ゲート2が開きます。課題が変わります。あなたの質問は特定の条件を命名する必要があります — 一般的なストレスではなく、正確に何が失敗するか — そしてどのような具体的な状況で。",
    'gate2-q':        "この質問は特定の条件を命名しています — 具体的な失敗モード。その精度 — 質問の中にそのまま — がゲート2の言語です。",
    'gate2-progress': "第3層確認。2つのシステム状態を同時に保持しています。5回繰り返せば — これはどんなシステムにも自動になります。",
    'gate2-mastered': "ゲート2をマスターしました。システム思考が今あなたの自然なモードです。どんなシステムに出会っても — あなたの心は失敗モードを探します。その本能はあなたのものです。",
    'completion':     "完了画面。あなたのスコアは目標の深さにどれだけ一貫して達したかを測定します。知性ではなく — 今日の探究の質です。道は形成されています。",
  },
  ko: {
    'topic-select':   "환영합니다. 탐구가 여기서 시작됩니다 — 진정한 호기심과 함께. 진정으로 흥미로운 주제를 선택하세요. 여기에 입력하거나 제안에서 선택하세요. 주제는 씨앗일 뿐입니다. 중요한 것은 — 당신이 곧 하게 될 질문입니다.",
    'target-select':  "이제 — 깊이를 선택하세요. 네 가지 깊이가 있습니다. Layer 1은 존재를 명명합니다. Layer 2는 작동 방식을 추적합니다. Layer 3은 실패를 탐구합니다. Layer 4는 시스템 설계 자체에 의문을 제기합니다.",
    'intro-question': "첫 번째 질문. 잘못된 시작점은 없습니다. 솔직하게 — 지금 있는 곳에서 시작하세요. 시스템이 질문이 도달한 깊이를 정확히 알려줄 것입니다.",
    'l1-detected':    "Layer 1 — 사실 수준. 솔직한 시작점입니다. 이 리다이렉트 — prick이라고 합니다 — 빠진 것을 명명합니다. 이름 아래의 메커니즘을 가리킵니다.",
    'gate1-q':        "Gate 1. 질문은 인과 관계를 명명해야 합니다 — 무언가가 어떻게 작동하는지, 또는 왜 일어나는지. 이름이 아닙니다. 기능 방식입니다. 왜와 어떻게 — 가 관문입니다.",
    'gate1-progress': "자격이 되었습니다. 한 번 통과. 다섯 번이 필요합니다 — 하나는 아직 패턴이 아니기 때문입니다. 다섯이 관계적 사고가 영구적이 되는 임계값입니다.",
    'gate1-mastered': "Gate 1 완성. 다섯 번 통과. 관계적 수준이 이제 기준선입니다 — 결정하지 않아도 자동으로 왜를 묻습니다. 그것이 마스터리입니다.",
    'gate2-intro':    "Gate 2 열림. 도전이 변합니다. 질문은 이제 특정 조건을 명명해야 합니다 — 일반적인 스트레스가 아닌, 정확히 무엇이 실패하는지 — 어떤 구체적인 상황에서.",
    'gate2-q':        "이 질문은 특정 조건을 명명합니다 — 구체적인 실패 모드. 그 정확성 — 질문 안에 바로 있는 — 이 Gate 2 언어입니다.",
    'gate2-progress': "Layer 3 확인. 두 시스템 상태를 동시에 유지하고 있습니다. 다섯 번 반복 — 그러면 어떤 시스템에도 자동이 됩니다.",
    'gate2-mastered': "Gate 2 완성. 시스템적 사고가 이제 자연스러운 방식입니다. 어떤 시스템을 만나도 — 마음이 실패 모드를 찾습니다. 그 본능은 당신의 것입니다 — 영구적으로.",
    'completion':     "완료 화면. 점수는 목표 깊이에 얼마나 일관되게 도달했는지를 측정합니다. 지성이 아닙니다 — 오늘 탐구의 질입니다. 길이 형성되고 있습니다.",
  },
  ru: {
    'topic-select':   "Добро пожаловать. Ваше исследование начинается здесь — с искренним любопытством. Выберите любую тему, которая вас привлекает. Введите её здесь или выберите предложение. Тема — лишь семя. Главное — вопрос, который вы собираетесь задать.",
    'target-select':  "Теперь — выберите глубину. Четыре уровня доступны. Слой 1 называет то, что существует. Слой 2 отслеживает, как это работает. Слой 3 исследует, что не работает и почему. Слой 4 ставит под сомнение сам дизайн системы.",
    'intro-question': "Ваш первый вопрос. Нет неправильной отправной точки. Начните честно — с того места, где вы находитесь. Система точно скажет, какой глубины достиг ваш вопрос.",
    'l1-detected':    "Слой 1 — фактический уровень. Честная отправная точка. Это перенаправление — prick — называет то, чего не хватало. Оно указывает на механизм под именем. Следуйте за ним.",
    'gate1-q':        "Ворота 1. Ваш вопрос должен называть причинно-следственную связь — как что-то работает или почему это происходит. Не как называется. Как функционирует. Слова почему и как — это ворота.",
    'gate1-progress': "Прошло. Одно пересечение. Нужно пять — не потому что одно неверно, а потому что одного ещё недостаточно для паттерна. Пять — порог, где реляционное мышление становится постоянным.",
    'gate1-mastered': "Ворота 1 освоены. Пять пересечений. Реляционный уровень теперь ваша основа — вы будете спрашивать почему автоматически. Это мастерство.",
    'gate2-intro':    "Ворота 2 открыты. Вызов меняется. Ваш вопрос должен называть конкретное условие — не стресс вообще, а именно что не работает — и при каких конкретных обстоятельствах.",
    'gate2-q':        "Этот вопрос называет конкретное условие — конкретный режим отказа. Эта точность — прямо в вопросе — это язык Ворот 2.",
    'gate2-progress': "Слой 3 подтверждён. Вы держите два состояния системы одновременно. Пять повторений — и это становится автоматическим для любой системы.",
    'gate2-mastered': "Ворота 2 освоены. Системное мышление — ваш естественный режим. Встречая любую систему — ваш разум тянется к режимам отказа. Этот инстинкт ваш — навсегда.",
    'completion':     "Экран завершения. Ваш результат измеряет, насколько последовательно вы достигли целевой глубины. Не интеллект — не скорость. Качество сегодняшнего исследования.",
  },
  tr: {
    'topic-select':   "Hoş geldiniz. Araştırmanız burada başlıyor — gerçek bir merakla. Sizi gerçekten çeken bir konu seçin. Buraya yazın veya bir öneri seçin. Konu sadece bir tohumdur. Önemli olan — sormak üzere olduğunuz sorudur.",
    'target-select':  "Şimdi — derinliğinizi seçin. Dört derinlik mevcuttur. Katman 1 var olanı adlandırır. Katman 2 nasıl çalıştığını izler. Katman 3 neyin başarısız olduğunu araştırır. Katman 4 sistemin tasarımını sorgular.",
    'intro-question': "İlk sorunuz. Yanlış bir başlangıç noktası yok. Dürüstçe başlayın — bulunduğunuz yerden. Sistem sorunuzun hangi derinliğe ulaştığını tam olarak söyleyecek.",
    'l1-detected':    "Katman 1 — olgusal seviye. Dürüst bir başlangıç noktası. Bu yönlendirme — prick olarak adlandırılır — neyin eksik olduğunu adlandırır. Adın altındaki mekanizmaya işaret eder.",
    'gate1-q':        "Kapı 1. Sorunuz nedensel bir ilişkiyi adlandırmalıdır — bir şeyin nasıl çalıştığını veya neden olduğunu. Ne adlandırıldığını değil. Nasıl işlev gördüğünü. Neden ve nasıl kelimeleri — kapıdır.",
    'gate1-progress': "Nitelendi. Bir geçiş. Beş gerekli — bir tanesi henüz bir kalıp olmadığından. Beş, ilişkisel düşüncenin kalıcı hale geldiği eşiktir.",
    'gate1-mastered': "Kapı 1 tamamlandı. Beş geçiş. İlişkisel seviye artık temel çizginiz — karar vermeden otomatik olarak neden diye sorarsınız. Bu ustalıktır.",
    'gate2-intro':    "Kapı 2 açıldı. Meydan okuma değişiyor. Sorunuz belirli bir koşulu adlandırmalıdır — genel stres değil, tam olarak neyin başarısız olduğu — ve hangi somut koşullar altında.",
    'gate2-q':        "Bu soru belirli bir koşulu adlandırıyor — somut bir başarısızlık modu. Bu hassasiyet — tam da soruda — Kapı 2 dilidir.",
    'gate2-progress': "Katman 3 doğrulandı. İki sistem durumunu aynı anda tutuyorsunuz. Beş tekrar — ve bu herhangi bir sistem için otomatik hale gelir.",
    'gate2-mastered': "Kapı 2 tamamlandı. Sistemik düşünce artık doğal modunuz. Herhangi bir sistemle karşılaştığınızda — zihniniz başarısızlık modlarına uzanır. Bu içgüdü sizindir — kalıcı olarak.",
    'completion':     "Tamamlama ekranı. Puanınız hedef derinliğinize ne kadar tutarlı ulaştığınızı ölçer. Zeka değil — bugünkü araştırmanın kalitesi. Yol şekilleniyor.",
  },
  id: {
    'topic-select':   "Selamat datang. Penyelidikan Anda dimulai di sini — dengan rasa ingin tahu yang tulus. Pilih topik apa pun yang benar-benar menarik Anda. Ketik di sini, atau pilih saran. Topik hanyalah sebuah benih. Yang penting — adalah pertanyaan yang akan Anda ajukan.",
    'target-select':  "Sekarang — pilih kedalaman Anda. Empat kedalaman tersedia. Layer 1 menamai apa yang ada. Layer 2 menelusuri cara kerjanya. Layer 3 mengeksplorasi apa yang gagal dan mengapa. Layer 4 mempertanyakan desain sistem itu sendiri.",
    'intro-question': "Pertanyaan pertama Anda. Tidak ada titik awal yang salah. Mulailah dengan jujur — dari tempat Anda berada. Sistem akan memberi tahu Anda kedalaman yang dicapai pertanyaan Anda.",
    'l1-detected':    "Layer 1 — tingkat faktual. Titik awal yang jujur. Pengalihan ini — disebut prick — menamai apa yang terlewat. Menunjuk ke mekanisme di balik nama. Ikuti.",
    'gate1-q':        "Gerbang 1. Pertanyaan Anda harus menamai hubungan sebab akibat — bagaimana sesuatu bekerja, atau mengapa terjadi. Bukan namanya. Cara kerjanya. Kata mengapa dan bagaimana — adalah gerbangnya.",
    'gate1-progress': "Memenuhi syarat. Satu penyeberangan. Lima diperlukan — karena satu belum menjadi pola. Lima adalah ambang di mana pemikiran relasional menjadi permanen.",
    'gate1-mastered': "Gerbang 1 dikuasai. Lima penyeberangan. Tingkat relasional sekarang adalah garis dasar Anda — Anda akan bertanya mengapa, secara otomatis. Itulah penguasaan.",
    'gate2-intro':    "Gerbang 2 terbuka. Tantangan berubah. Pertanyaan Anda harus menamai kondisi spesifik — bukan stres secara umum, tapi tepat apa yang gagal — dan dalam keadaan konkret apa.",
    'gate2-q':        "Pertanyaan ini menamai kondisi spesifik — mode kegagalan konkret. Presisi itu — tepat di dalam pertanyaan — adalah bahasa Gerbang 2.",
    'gate2-progress': "Layer 3 dikonfirmasi. Anda memegang dua keadaan sistem sekaligus. Lima pengulangan — dan ini menjadi otomatis untuk sistem apa pun.",
    'gate2-mastered': "Gerbang 2 dikuasai. Pemikiran sistemik adalah mode alami Anda sekarang. Temui sistem apa pun — pikiran Anda mencari mode kegagalan. Naluri itu milik Anda — selamanya.",
    'completion':     "Layar penyelesaian. Skor Anda mengukur seberapa konsisten Anda mencapai kedalaman target. Bukan kecerdasan — kualitas penyelidikan hari ini. Jalur sedang terbentuk.",
  },
}

function getNarration(phaseType: string, langCode: string): string {
  const lang2 = langCode.split('-')[0].toLowerCase()
  return NARRATIONS[lang2]?.[phaseType] ?? NARRATIONS['en'][phaseType] ?? ''
}

// ─── Two-voice dialogue scripts ───────────────────────────────────────────────
// g = guide (warm, female-preferred), l = learner (curious, male-preferred)
// These play as a real conversation: two voices alternating with natural rhythm.

// v = Kokoro voice override, s = speed override (0.75–1.1), spo = spotlight element to lock
type DL = { r: 'g' | 'l'; t: string; v?: string; s?: number; spo?: string }

const DIALOGUE: Record<string, Record<string, DL[]>> = {
  en: {
    // ── GREETING + APP DISCOVERY ─────────────────────────────────────────────
    'topic-select': [
      { r: 'g', t: "I want to show you something — not just a tool, but a different way of thinking about what learning actually is.", v: 'af_bella', s: 0.92, spo: 'chips' },
      { r: 'l', t: "I've tried a lot of study apps. What's genuinely different here?", v: 'am_adam', s: 0.95, spo: 'chips' },
      { r: 'g', t: "Most tools measure what you know. This one measures the quality of your curiosity — how deep your questions actually go.", v: 'af_bella', s: 0.90, spo: 'chips' },
      { r: 'g', t: "You don't get tested. You ask questions — and the AI tells you the precise depth of what you asked. That changes everything.", v: 'af_bella', s: 0.88, spo: 'chips' },
      { r: 'l', t: "That's not how anything I've used works. TCP reliability — I keep thinking I understand it, but something's missing.", v: 'am_adam', s: 0.95, spo: 'input' },
      { r: 'g', t: "That feeling of something missing — hold onto it. It's not ignorance. It's the exact shape of what you're about to grow.", v: 'af_bella', s: 0.88, spo: 'input' },
      { r: 'l', t: "So I just — type my topic in here?", v: 'am_adam', s: 0.92, spo: 'input' },
      { r: 'g', t: "Type it in. What pulls you toward a topic is always the right door.", v: 'af_heart', s: 0.85, spo: 'input' },
    ],
    // ── SCIENCE + RULES ──────────────────────────────────────────────────────
    'target-select': [
      { r: 'g', t: "Now you choose. Not how much — how deep. These four layers aren't about difficulty. They're about what kind of mind you're building.", v: 'af_bella', s: 0.90, spo: 'cards' },
      { r: 'l', t: "What is the real difference between Layer 1 and Layer 4?", v: 'am_adam', s: 0.95, spo: 'cards' },
      { r: 'g', t: "Layer 1 — you can name it. Layer 2 — you can explain why it works. The mechanism is real to you, not borrowed.", v: 'af_bella', s: 0.88, spo: 'cards' },
      { r: 'g', t: "Layer 3 — you can break it deliberately. You know the exact seam where it fails. Layer 4 — you're asking why anyone built it this way at all.", v: 'af_bella', s: 0.87, spo: 'cards' },
      { r: 'l', t: "Layer 3. That's the difference between someone who knows the protocol and someone who debugs production systems.", v: 'am_adam', s: 0.93, spo: 'target' },
      { r: 'g', t: "And to reach Layer 3, you need five qualifying questions at each gate. Not one. Five. There's a reason that number is exact.", v: 'af_bella', s: 0.88, spo: 'target' },
      { r: 'l', t: "Why five?", v: 'am_adam', s: 0.97, spo: 'target' },
      { r: 'g', t: "Hebb, 1949. Neurons that fire together five times wire together permanently. White matter visibly thickens. After five crossings, that way of seeing doesn't need effort anymore. It just is.", v: 'af_heart', s: 0.84, spo: 'info' },
      { r: 'l', t: "So every question I ask isn't just practice. It's building structure I'll carry forever.", v: 'am_michael', s: 0.85, spo: 'info' },
      { r: 'g', t: "Forever. Layer 3. Let's go.", v: 'af_sky', s: 0.98, spo: 'info' },
    ],
    // ── FIRST ATTEMPT ────────────────────────────────────────────────────────
    'intro-question': [
      { r: 'g', t: "Type your first question about TCP. Don't think about whether it's good enough — just ask what you genuinely want to understand.", v: 'af_bella', s: 0.90, spo: 'question' },
      { r: 'l', t: "What if it comes out shallow? I'm already second-guessing myself.", v: 'am_adam', s: 0.93, spo: 'question' },
      { r: 'g', t: "A shallow first question gives you the clearest map of where to go next. The only wasted question is the one you held back.", v: 'af_bella', s: 0.88, spo: 'eval' },
      { r: 'l', t: "Alright. Here goes.", v: 'am_adam', s: 0.97, spo: 'eval' },
    ],
    // ── GETTING THE REDIRECT ─────────────────────────────────────────────────
    'l1-detected': [
      { r: 'g', t: "Layer 1. You named it. That's an honest beginning — every deep thinker started exactly here.", v: 'af_bella', s: 0.90, spo: 'badge' },
      { r: 'l', t: "I felt it while I was typing. Like I was describing the surface of something without ever touching what's inside.", v: 'am_adam', s: 0.92, spo: 'badge' },
      { r: 'g', t: "Read this — right here. We call it the prick. It goes to the exact place your thinking stopped and points beyond it.", v: 'af_bella', s: 0.88, spo: 'prick' },
      { r: 'l', t: "It's asking for the mechanism. Not what TCP is — what it actually does, step by step, to make delivery reliable.", v: 'am_adam', s: 0.90, spo: 'prick' },
      { r: 'g', t: "It didn't say wrong. It said — here, precisely, is what's missing. That's entirely different from grading you.", v: 'af_heart', s: 0.85, spo: 'prick' },
      { r: 'l', t: "It's showing me the exact boundary of what I actually know. Like an X-ray of my understanding.", v: 'am_michael', s: 0.84, spo: 'bar' },
      { r: 'g', t: "Every time you don't qualify — you get that X-ray. That is the learning. Not the qualifying.", v: 'af_bella', s: 0.86, spo: 'bar' },
    ],
    // ── THE STUDY PANEL — THE HEART OF THE APP ───────────────────────────────
    'gate1-study': [
      { r: 'g', t: "Before your next question — I need you to see something. Something most study methods never show you.", v: 'af_bella', s: 0.88, spo: 'criteria' },
      { r: 'l', t: "These five criteria... this is what Gate 1 is actually looking for?", v: 'am_adam', s: 0.95, spo: 'criteria' },
      { r: 'g', t: "Read each one slowly. These aren't rules you follow — they're a picture of what your mind needs to already be holding when the question forms.", v: 'af_bella', s: 0.86, spo: 'criteria' },
      { r: 'l', t: "Names a causal relationship... two components interacting... it's not about the words at all. It's about whether the understanding is genuinely there.", v: 'am_michael', s: 0.84, spo: 'criteria' },
      { r: 'g', t: "Now look at the science. When you ask a causal question, your prefrontal cortex has to hold two concepts and model the bridge between them. That is not retrieval. It is construction.", v: 'af_heart', s: 0.82, spo: 'science' },
      { r: 'l', t: "Every time I ask at Layer 2, I'm not just practicing. I'm building physical structure that will be there tomorrow.", v: 'am_adam', s: 0.88, spo: 'science' },
      { r: 'g', t: "Bengtsson's team put it on MRI. White matter density visibly increases after five crossings. The question stops being something you work toward. It becomes the way you arrive.", v: 'af_heart', s: 0.82, spo: 'science' },
      { r: 'l', t: "I've been studying for years. I didn't know this kind of change was actually available.", v: 'am_michael', s: 0.81, spo: 'science' },
      { r: 'g', t: "It's available right now — and once you feel it yourself, you'll know exactly how to offer it to anyone you ever teach.", v: 'af_bella', s: 0.86, spo: 'science' },
      { r: 'l', t: "I can feel the shape of the example. The why is already inside the question. That's what I was missing.", v: 'am_michael', s: 0.83, spo: 'example' },
      { r: 'g', t: "Don't copy it. Let that feeling guide you. You already know what to ask.", v: 'af_sky', s: 0.95, spo: 'example' },
    ],
    // ── GATE 1 PLAY-THROUGH ──────────────────────────────────────────────────
    'gate1-q': [
      { r: 'l', t: "Why does TCP use acknowledgments to guarantee delivery instead of just sending everything and hoping?", v: 'am_adam', s: 1.0, spo: 'question' },
      { r: 'g', t: "There it is. You held the mechanism in your mind before the question even finished forming. Feel how different that is.", v: 'af_sky', s: 0.97, spo: 'mechanic' },
      { r: 'l', t: "I had to actually know something to ask it. The question came from understanding, not from confusion.", v: 'am_adam', s: 0.92, spo: 'mechanic' },
      { r: 'g', t: "That's the signature of Layer 2. Why and how force the mechanism into the asking itself. Watch how these examples carry that same quality.", v: 'af_bella', s: 0.88, spo: 'question' },
    ],
    'gate1-progress': [
      { r: 'g', t: "That crossed.", v: 'af_sky', s: 0.95, spo: 'badge' },
      { r: 'l', t: "One down. Four more to go?", v: 'am_adam', s: 0.97, spo: 'count' },
      { r: 'g', t: "Four more. One crossing is a moment. Five is a permanent change in how your mind reaches for problems.", v: 'af_bella', s: 0.88, spo: 'count' },
      { r: 'l', t: "The difference between lightning striking once and learning how to call it.", v: 'am_adam', s: 0.92, spo: 'count' },
      { r: 'g', t: "After five — you won't decide to ask how or why. You just will. Watch the counter fill.", v: 'af_heart', s: 0.84, spo: 'count' },
    ],
    'gate1-mastered': [
      { r: 'g', t: "Five. Gate 1 is yours — forever.", v: 'af_sky', s: 0.91, spo: 'celebrate' },
      { r: 'l', t: "That last question — I didn't plan it. It came before I even finished thinking.", v: 'am_michael', s: 0.81, spo: 'dots' },
      { r: 'g', t: "I know. I was watching.", v: 'af_bella', s: 0.86, spo: 'dots' },
      { r: 'l', t: "That's not a skill I was using. That's just... how I was thinking.", v: 'am_michael', s: 0.80, spo: 'text' },
      { r: 'g', t: "That's the difference between learning a technique and becoming someone who thinks a certain way. You just crossed that line.", v: 'af_heart', s: 0.80, spo: 'text' },
    ],
    // ── GATE 2 PLAY-THROUGH ──────────────────────────────────────────────────
    'gate2-intro': [
      { r: 'g', t: "Gate 2. This is where I love watching people's thinking change.", v: 'af_bella', s: 0.92, spo: 'badge2' },
      { r: 'l', t: "I feel steady at Gate 1 now. What shifts?", v: 'am_adam', s: 0.93, spo: 'badge2' },
      { r: 'g', t: "You stop asking how something works and start asking what specific condition makes it fail. Not vaguely — exactly. The name of the failure mode, the scenario, the edge.", v: 'af_bella', s: 0.87, spo: 'prick2' },
      { r: 'l', t: "I have to know the system so well that I can break it deliberately — from the inside.", v: 'am_adam', s: 0.92, spo: 'prick2' },
      { r: 'g', t: "And here's what I love — you genuinely cannot fake this gate. The precision of your question reveals whether the understanding is real or only performed.", v: 'af_heart', s: 0.84, spo: 'bar2' },
      { r: 'l', t: "That's why expertise built this way doesn't erode. It wasn't memorized. It was grown.", v: 'am_michael', s: 0.84, spo: 'bar2' },
    ],
    'gate2-q': [
      { r: 'g', t: "Listen to how this one is built — feel what's different about it.", v: 'af_bella', s: 0.90, spo: 'question' },
      { r: 'l', t: "What happens when a SYN-ACK is lost precisely during TCP's exponential backoff — does the handshake time out, or restart from the beginning?", v: 'am_adam', s: 0.96, spo: 'condition' },
      { r: 'g', t: "You named the exact seam. You know not just how the handshake works — but the specific moment it could break. That specificity is everything.", v: 'af_bella', s: 0.88, spo: 'condition' },
      { r: 'l', t: "I was holding two versions of the system — the normal path and the broken path — and asking about where they diverge.", v: 'am_michael', s: 0.85, spo: 'question' },
      { r: 'g', t: "That question belongs in a production post-mortem. That's the quality of thinking you just demonstrated.", v: 'af_sky', s: 0.95, spo: 'question' },
    ],
    'gate2-progress': [
      { r: 'g', t: "Layer 3.", v: 'af_sky', s: 0.96, spo: 'badge2' },
      { r: 'l', t: "That felt like more than asking. Like I was inside the system, finding where the walls are thin.", v: 'am_michael', s: 0.83, spo: 'count' },
      { r: 'g', t: "You're holding multiple system states at once — the engineer's spatial mind. Four more crossings and that capacity becomes yours for every system you ever touch.", v: 'af_bella', s: 0.87, spo: 'count' },
    ],
    'gate2-mastered': [
      { r: 'g', t: "Five. Gate 2 — completely and permanently yours.", v: 'af_sky', s: 0.91, spo: 'celebrate' },
      { r: 'l', t: "Something shifted. I can't see TCP as a flat concept anymore. It has edges, and I feel where they are.", v: 'am_michael', s: 0.81, spo: 'dots' },
      { r: 'g', t: "That's irreversible. That's yours now. No one can take that clarity from you.", v: 'af_heart', s: 0.81, spo: 'dots' },
      { r: 'l', t: "I could sit with someone tomorrow and show them exactly where their thinking stops — the way you showed me where mine did.", v: 'am_michael', s: 0.80, spo: 'text' },
      { r: 'g', t: "That's the deepest thing this does. It doesn't just grow you — it gives you the gift of being genuinely useful to the people you care about. Your mind now reaches for the edges first, in every field, always.", v: 'af_heart', s: 0.80, spo: 'text' },
    ],
    // ── COMPLETION + REFLECTION ──────────────────────────────────────────────
    'completion': [
      { r: 'l', t: "I want to do this again right now. For a different topic. I didn't expect to feel that.", v: 'am_adam', s: 0.90, spo: 'score' },
      { r: 'g', t: "That wanting — that's the real signal. The score is a reflection. You are the result.", v: 'af_bella', s: 0.86, spo: 'score' },
      { r: 'l', t: "What does the number actually measure?", v: 'am_adam', s: 0.93, spo: 'stats' },
      { r: 'g', t: "The consistency of your reaching. How faithfully you kept asking toward the depth you chose. Not speed. Not cleverness. The quality of your curiosity.", v: 'af_bella', s: 0.86, spo: 'stats' },
      { r: 'l', t: "I've been at Layer 1 my whole life. Reading, memorizing, nodding along. I didn't know what I was missing.", v: 'am_michael', s: 0.79, spo: 'quote' },
      { r: 'g', t: "Most people never find out. Now you know the exact movement — one genuine question, one depth deeper, every time. That's all it takes.", v: 'af_heart', s: 0.79, spo: 'quote' },
      { r: 'l', t: "This changes how I study, how I prepare, how I listen — and how I'll teach.", v: 'am_michael', s: 0.78, spo: 'quote' },
      { r: 'g', t: "Go deeper. The depth finds itself.", v: 'af_sky', s: 0.87, spo: 'quote' },
    ],
  },
  hi: {
    // ── मिलना + खोज ─────────────────────────────────────────────────────────
    'topic-select': [
      { r: 'g', t: "एक बात बताऊँ — यह सोचने का एक सर्वथा नया ढंग है। आज तुम इसे पहली बार अनुभव करोगे — और कुछ बदल जाएगा।", s: 0.92, spo: 'chips' },
      { r: 'l', t: "बहुत tools आज़माए हैं। हर एक ने कहा 'अलग हूँ।' यह कैसे अलग है?", s: 0.95, spo: 'chips' },
      { r: 'g', t: "अन्य tools मापते हैं — तुम क्या जानते हो। यह मापता है — तुम्हारी जिज्ञासा की गहराई। तुम्हारे प्रश्न किस तह तक जाते हैं।", s: 0.90, spo: 'chips' },
      { r: 'g', t: "यहाँ तुम प्रश्न पूछते हो — और AI उस प्रश्न की गहराई बताता है। बस यही। और यही सब बदल देता है।", s: 0.88, spo: 'chips' },
      { r: 'l', t: "TCP reliability — यही मेरा विषय है। पढ़ा है, नोट्स बनाए हैं। पर जब कोई पूछता है तो कुछ अधूरा-सा लगता है।", s: 0.95, spo: 'input' },
      { r: 'g', t: "वो 'अधूरा' का एहसास — उसे संजो कर रखो। वो तुम्हारे भीतर जागती जिज्ञासा है — ठीक वही जगह जहाँ असली समझ अंकुरित होती है।", s: 0.88, spo: 'input' },
      { r: 'l', t: "तो बस यहाँ विषय लिखूँ?", s: 0.93, spo: 'input' },
      { r: 'g', t: "हाँ। जो भीतर से खींचे, वही सही द्वार है।", s: 0.86, spo: 'input' },
    ],
    // ── विज्ञान + नियम ───────────────────────────────────────────────────────
    'target-select': [
      { r: 'g', t: "अब चुनाव तुम्हारा — कितनी गहराई तक जाना है। ये केवल कठिनाई के स्तर हैं, यह धारणा छोड़ दो — ये मन की अलग-अलग अवस्थाएँ हैं।", s: 0.90, spo: 'cards' },
      { r: 'l', t: "स्तर एक और स्तर चार में असल अंतर क्या है?", s: 0.95, spo: 'cards' },
      { r: 'g', t: "स्तर एक — नाम जानते हो। स्तर दो — क्रियाविधि स्वयं समझ में है, अपनी, भीतर से।", s: 0.88, spo: 'cards' },
      { r: 'g', t: "स्तर तीन — जानबूझकर तोड़ सकते हो। वो सटीक जगह पहचानते हो जहाँ तंत्र अपनी सीमा छूता है। स्तर चार — पूछते हो यह ऐसे बनाया ही क्यों।", s: 0.87, spo: 'cards' },
      { r: 'l', t: "स्तर तीन। Protocol जानने और production system संभालने में यही अंतर है।", s: 0.93, spo: 'target' },
      { r: 'g', t: "और स्तर तीन तक हर द्वार पर पाँच योग्य प्रश्न चाहिए — पाँच। यह संख्या विज्ञान से आती है।", s: 0.88, spo: 'target' },
      { r: 'l', t: "पाँच ही क्यों?", s: 0.97, spo: 'target' },
      { r: 'g', t: "Hebb, 1949। जो neurons साथ fire करते हैं वो साथ जुड़ते हैं — पाँच बार के बाद स्थायी रूप से। MRI पर श्वेत पदार्थ का घनत्व बढ़ता दिखता है। पाँच crossing के बाद वो ढंग प्रयास से परे हो जाता है — वो तुम बन जाता है।", s: 0.84, spo: 'info' },
      { r: 'l', t: "मतलब हर प्रश्न जो पूछता हूँ — वो एक संरचना बनाता है जो सदा रहेगी।", s: 0.85, spo: 'info' },
      { r: 'g', t: "सदा। स्तर तीन। चलते हैं।", s: 0.98, spo: 'info' },
    ],
    // ── पहली कोशिश ──────────────────────────────────────────────────────────
    'intro-question': [
      { r: 'g', t: "TCP के बारे में पहला प्रश्न लिखो। जो सच में जानना है, वो पूछो — बस वही।", s: 0.90, spo: 'question' },
      { r: 'l', t: "यदि बहुत साधारण निकला तो?", s: 0.93, spo: 'question' },
      { r: 'g', t: "साधारण पहला प्रश्न सबसे स्पष्ट मार्ग दिखाता है — आगे किधर जाना है। जो प्रश्न भीतर रोके रखा, वो एक अवसर प्रतीक्षा में है।", s: 0.88, spo: 'eval' },
      { r: 'l', t: "ठीक है। पूछता हूँ।", s: 0.97, spo: 'eval' },
    ],
    // ── redirect मिला ───────────────────────────────────────────────────────
    'l1-detected': [
      { r: 'g', t: "स्तर एक। नाम लिया — यह ईमानदार आरंभ है। हर गहरे जानकार ने यहीं से यात्रा शुरू की।", s: 0.90, spo: 'badge' },
      { r: 'l', t: "लिखते समय लगा — जैसे किसी गहरी चीज़ की सतह को छू रहा हूँ, भीतर उतरने की प्रतीक्षा में।", s: 0.92, spo: 'badge' },
      { r: 'g', t: "यह देखो — ठीक यहाँ। इसे 'दिशा-संकेत' कहते हैं। यह ठीक उस जगह जाता है जहाँ तुम्हारी समझ रुकी — और आगे का द्वार दिखाता है।", s: 0.88, spo: 'prick' },
      { r: 'l', t: "यह क्रियाविधि माँग रहा है। TCP की delivery वास्तव में कैसे सुनिश्चित होती है, क़दम दर क़दम — वो।", s: 0.90, spo: 'prick' },
      { r: 'g', t: "यह दिशा-दर्शन है — यहाँ, ठीक यहाँ, और जानना है। मूल्यांकन से परे — यह मार्गदर्शन है।", s: 0.86, spo: 'prick' },
      { r: 'l', t: "यह मेरी समझ का स्पष्ट दर्पण है। जो जानता हूँ उसकी सीमा दिख रही है।", s: 0.84, spo: 'bar' },
      { r: 'g', t: "जब भी प्रश्न द्वार के परे रहे — वो दर्पण मिलता है। वही अध्ययन है।", s: 0.86, spo: 'bar' },
    ],
    // ── study panel — इस app का दिल ─────────────────────────────────────────
    'gate1-study': [
      { r: 'g', t: "अगला प्रश्न पूछने से पहले — एक बात देखनी है जो अधिकतर पढ़ाई के ढंग छोड़ देते हैं।", s: 0.88, spo: 'criteria' },
      { r: 'l', t: "ये पाँच कसौटियाँ... यही देख रहा है Gate 1?", s: 0.95, spo: 'criteria' },
      { r: 'g', t: "हर एक को धीरे पढ़ो। ये नियम-पुस्तिका से परे हैं — ये उस मन की तस्वीर हैं जो प्रश्न बनाते समय वहाँ होना चाहिए।", s: 0.86, spo: 'criteria' },
      { r: 'l', t: "कारण-संबंध... दो घटकों का परस्पर प्रभाव... यह केवल शब्दों का चुनाव नहीं — समझ वहाँ है या अभी पहुँचनी है, बस वो।", s: 0.84, spo: 'criteria' },
      { r: 'g', t: "जब कोई कारण-प्रश्न पूछता है, prefrontal cortex दो विचारों को एक साथ थामता है और उनके बीच सेतु बनाता है। यह स्मरण नहीं — यह सृजन है।", s: 0.82, spo: 'science' },
      { r: 'l', t: "मतलब हर बार स्तर दो पर पूछूँगा — एक वास्तविक संरचना बन रही है जो कल भी, बरसों बाद भी वहाँ होगी।", s: 0.88, spo: 'science' },
      { r: 'g', t: "Bengtsson की टीम ने MRI पर दिखाया — पाँच crossing के बाद श्वेत पदार्थ का घनत्व बढ़ता है। जो प्रश्न प्रयास माँगता था, वो सोचने का स्वाभाविक ढंग बन जाता है।", s: 0.82, spo: 'science' },
      { r: 'l', t: "बरसों के अध्ययन के बाद आज पहली बार जाना — यह परिवर्तन संभव है।", s: 0.80, spo: 'science' },
      { r: 'g', t: "अभी संभव है। और जब स्वयं अनुभव करोगे — जिसे भी पढ़ाओगे, उसे भी दे पाओगे।", s: 0.86, spo: 'science' },
      { r: 'l', t: "उदाहरण की आकृति समझ आ रही है। 'क्यों' प्रश्न के भीतर ही है — यही अनकहा था।", s: 0.83, spo: 'example' },
      { r: 'g', t: "अपनी समझ से आओ। वो एहसास साथ लो। तुम जानते हो क्या पूछना है।", s: 0.95, spo: 'example' },
    ],
    // ── Gate 1 खेल ──────────────────────────────────────────────────────────
    'gate1-q': [
      { r: 'l', t: "TCP acknowledgments क्यों use करता है delivery सुनिश्चित करने के लिए — बजाय सब कुछ एक साथ भेजकर उम्मीद लगाने के?", s: 1.0, spo: 'question' },
      { r: 'g', t: "वो रहा। क्रियाविधि को मन में थामा था — प्रश्न बनने से पहले ही। यह अनुभव करो — पहले से कितना अलग है।", s: 0.97, spo: 'mechanic' },
      { r: 'l', t: "मुझे कुछ जानना था इसे पूछने के लिए। प्रश्न ज्ञान की गहराई से आया।", s: 0.92, spo: 'mechanic' },
      { r: 'g', t: "यही स्तर दो की पहचान है। 'क्यों' और 'कैसे' क्रियाविधि को प्रश्न में ही समाहित करते हैं। देखो कैसे ये उदाहरण वही गुण वहन करते हैं।", s: 0.88, spo: 'question' },
    ],
    'gate1-progress': [
      { r: 'g', t: "पार हुआ।", s: 0.95, spo: 'badge' },
      { r: 'l', t: "एक हुआ। चार और?", s: 0.97, spo: 'count' },
      { r: 'g', t: "चार और। एक crossing एक पल है। पाँच — मन के प्रश्न पूछने के ढंग का स्थायी परिवर्तन।", s: 0.88, spo: 'count' },
      { r: 'l', t: "बिजली का एक बार गिरना और उसे बुलाना सीखने का अंतर।", s: 0.92, spo: 'count' },
      { r: 'g', t: "पाँच के बाद — 'कैसे' या 'क्यों' पूछने का निर्णय स्वतः होगा। बस होगा। Counter भरते देखो।", s: 0.84, spo: 'count' },
    ],
    'gate1-mastered': [
      { r: 'g', t: "पाँच। प्रथम द्वार — सदा के लिए तुम्हारा।", s: 0.91, spo: 'celebrate' },
      { r: 'l', t: "अंतिम प्रश्न — बिना किसी योजना के। सोच पूरी होने से पहले ही आ गया।", s: 0.81, spo: 'dots' },
      { r: 'g', t: "मैं देख रही थी।", s: 0.86, spo: 'dots' },
      { r: 'l', t: "यह सोचने का ढंग ही ऐसा हो गया था — कोई तकनीक नहीं, बस मन का स्वाभाविक प्रवाह।", s: 0.80, spo: 'text' },
      { r: 'g', t: "यही अंतर है — तकनीक सीखने और उस तरह सोचने वाले बनने में। तुमने वो रेखा अभी पार की।", s: 0.80, spo: 'text' },
    ],
    // ── Gate 2 ───────────────────────────────────────────────────────────────
    'gate2-intro': [
      { r: 'g', t: "द्वितीय द्वार। यहाँ लोगों की सोच का रूपांतरण देखना मुझे बहुत आनंद देता है।", s: 0.92, spo: 'badge2' },
      { r: 'l', t: "प्रथम द्वार पर अब स्थिरता है। क्या बदलता है?", s: 0.93, spo: 'badge2' },
      { r: 'g', t: "अब तुम यह पूछते हो — कौन-सी सटीक परिस्थिति में तंत्र अपनी सीमा पाता है। एकदम सटीक — failure mode का नाम, scenario, वो किनारा।", s: 0.87, spo: 'prick2' },
      { r: 'l', t: "तंत्र को इतना गहरा जानना होगा कि जानबूझकर उसकी सीमा स्पर्श कर सकूँ — भीतर से।", s: 0.92, spo: 'prick2' },
      { r: 'g', t: "और यही इस द्वार को विश्वसनीय बनाता है — इसके सामने समझ प्रकट होती है, जो है वही दिखती है। तुम्हारे प्रश्न की परिशुद्धता ही बताती है कि समझ कहाँ तक पहुँची।", s: 0.84, spo: 'bar2' },
      { r: 'l', t: "इसीलिए इस तरह प्राप्त की निपुणता सदा जीवित रहती है — वो उगाई गई थी, वो तुम बन गई थी।", s: 0.84, spo: 'bar2' },
    ],
    'gate2-q': [
      { r: 'g', t: "सुनो — यह प्रश्न कैसे बना है। महसूस करो इसमें क्या अलग है।", s: 0.90, spo: 'question' },
      { r: 'l', t: "TCP के exponential backoff के दौरान ठीक SYN-ACK खो जाए — handshake timeout होता है, या शुरू से restart?", s: 0.96, spo: 'condition' },
      { r: 'g', t: "वो सटीक स्थान पकड़ा। केवल handshake की क्रियाविधि नहीं जानते — वो specific क्षण जानते हो जहाँ वो अपनी सीमा पाती है। यही परिशुद्धता सब है।", s: 0.88, spo: 'condition' },
      { r: 'l', t: "तंत्र के दो रूप एक साथ थामे थे — सामान्य मार्ग और उसकी सीमा — और पूछ रहा था जहाँ दोनों अलग होते हैं।", s: 0.85, spo: 'question' },
      { r: 'g', t: "यह प्रश्न production post-mortem में होता है। यही गुणवत्ता की सोच तुमने अभी प्रकट की।", s: 0.95, spo: 'question' },
    ],
    'gate2-progress': [
      { r: 'g', t: "स्तर तीन।", s: 0.96, spo: 'badge2' },
      { r: 'l', t: "पूछने से परे कुछ था यह। जैसे तंत्र के भीतर था, देख रहा था कहाँ दीवारें पतली हैं।", s: 0.83, spo: 'count' },
      { r: 'g', t: "एक साथ तंत्र की अनेक अवस्थाएँ थाम रहे हो — अभियंता का स्थानिक मन। चार और crossing — और वो क्षमता हर उस तंत्र के लिए तुम्हारी हो जाएगी जिसे कभी छुओगे।", s: 0.87, spo: 'count' },
    ],
    'gate2-mastered': [
      { r: 'g', t: "पाँच। द्वितीय द्वार — पूर्णतः और सदा के लिए तुम्हारा।", s: 0.91, spo: 'celebrate' },
      { r: 'l', t: "कुछ बदला। TCP अब गहरा दिखता है। उसके किनारे हैं — और मुझे अनुभव होता है वो कहाँ हैं।", s: 0.81, spo: 'dots' },
      { r: 'g', t: "यह सदा रहेगा। अब तुम्हारा है। यह स्पष्टता सदा तुम्हारी है।", s: 0.81, spo: 'dots' },
      { r: 'l', t: "मैं कल किसी के साथ बैठकर ठीक दिखा सकता हूँ कि उनकी सोच कहाँ रुकती है — जैसे तुमने मुझे दिखाया।", s: 0.80, spo: 'text' },
      { r: 'g', t: "यही इस सब का सबसे गहरा प्रयोजन है। तुम बढ़ते हो — और साथ में वो उपहार मिलता है कि जिनकी परवाह है उन्हें सच्चे अर्थ में सहायता कर सको। अब तुम्हारा मन हर क्षेत्र में, हमेशा, पहले किनारे खोजता है।", s: 0.80, spo: 'text' },
    ],
    // ── पूर्णता + चिंतन ─────────────────────────────────────────────────────
    'completion': [
      { r: 'l', t: "अभी एक और विषय करना है। यह तो सोचा ही नहीं था।", s: 0.90, spo: 'score' },
      { r: 'g', t: "यह चाहत — यही असली संकेत है। अंक तो केवल प्रतिबिंब हैं। तुम परिणाम हो।", s: 0.86, spo: 'score' },
      { r: 'l', t: "यह संख्या वास्तव में क्या मापती है?", s: 0.93, spo: 'stats' },
      { r: 'g', t: "तुम्हारे पहुँचने की निरंतरता। तुमने जो गहराई चुनी, उसकी ओर कितनी श्रद्धा से पूछते रहे। तुम्हारी जिज्ञासा की गुणवत्ता।", s: 0.86, spo: 'stats' },
      { r: 'l', t: "जीवन भर स्तर एक पर रहा। पढ़ता रहा, याद करता रहा। आज पहली बार जाना क्या संभव था।", s: 0.79, spo: 'quote' },
      { r: 'g', t: "बहुत कम लोगों को यह मिलता है। अब तुम्हें पता है — वो exact movement। एक सच्चा प्रश्न, एक गहराई और, हर बार। बस इतना।", s: 0.79, spo: 'quote' },
      { r: 'l', t: "यह बदलता है — कैसे पढ़ता हूँ, कैसे तैयारी करता हूँ, कैसे सुनता हूँ — और कैसे सिखाऊँगा।", s: 0.78, spo: 'quote' },
      { r: 'g', t: "और गहरे जाओ। गहराई स्वयं को खोज लेती है।", s: 0.87, spo: 'quote' },
    ],
  },
  es: {
    'topic-select': [
      { r: 'g', t: "¡Hola! Seré tu guía en esta investigación." },
      { r: 'g', t: "¿Qué tema te atrae genuinamente hoy? Escríbelo aquí o elige una sugerencia." },
      { r: 'l', t: "Hay algo en lo que he estado pensando mucho últimamente." },
      { r: 'g', t: "Esa curiosidad genuina — esa siempre es la mejor manera de empezar." },
    ],
    'target-select': [
      { r: 'g', t: "Bien. Ahora — ¿hasta qué profundidad quieres llegar? Hay cuatro niveles." },
      { r: 'l', t: "¿Cuál es la diferencia entre ellos?" },
      { r: 'g', t: "Layer 1 nombra las cosas. Layer 2 pregunta cómo funcionan. Layer 3 busca qué falla. Layer 4 cuestiona el diseño mismo." },
      { r: 'l', t: "Layer 3. Entender los modos de fallo parece una habilidad real de experto." },
      { r: 'g', t: "Buen instinto. Vamos." },
    ],
    'intro-question': [
      { r: 'g', t: "Adelante — escribe tu primera pregunta. No hay manera incorrecta de empezar." },
      { r: 'l', t: "¿Y si mi pregunta es demasiado básica?" },
      { r: 'g', t: "Entonces nos muestra exactamente a dónde ir. Pregunta desde donde estás." },
    ],
    'l1-detected': [
      { r: 'g', t: "¡Buen comienzo! Eso fue Layer 1 — nombraste el concepto." },
      { r: 'l', t: "Me pareció demasiado simple, la verdad." },
      { r: 'g', t: "Todos los expertos empezaron aquí. Mira este redireccionamiento — lo llamamos el prick." },
      { r: 'l', t: "Ah — me pide el mecanismo, no solo el nombre." },
      { r: 'g', t: "Exacto. Síguelo." },
    ],
    'gate1-q': [
      { r: 'g', t: "Para Gate 1, tu pregunta debe nombrar cómo algo funciona — o por qué sucede." },
      { r: 'l', t: "¿Por qué TCP usa confirmaciones para garantizar la entrega?" },
      { r: 'g', t: "¡Sí! Eso nombra un mecanismo. ¿Sientes cómo la palabra por qué lo abre todo?" },
    ],
    'gate1-progress': [
      { r: 'g', t: "¡Esa calificó!" },
      { r: 'l', t: "Una abajo. ¿Cuántas más?" },
      { r: 'g', t: "Cuatro más. Cinco en total es maestría — el umbral donde pensar en mecanismos se vuelve automático." },
    ],
    'gate1-mastered': [
      { r: 'g', t: "¡Cinco cruces! Gate 1 es completamente tuyo ahora." },
      { r: 'l', t: "Preguntar por qué se siente automático. No lo decidí." },
      { r: 'g', t: "Eso es la verdadera maestría — no una habilidad que aplicas, sino una forma de pensar." },
    ],
    'gate2-intro': [
      { r: 'g', t: "Gate 2 se abre. El desafío cambia aquí." },
      { r: 'l', t: "¿En qué se diferencia del Gate 1?" },
      { r: 'g', t: "Nombra una condición específica donde el sistema falla. No el estrés en general — exactamente qué se rompe y bajo qué circunstancias." },
    ],
    'gate2-q': [
      { r: 'g', t: "Escucha cuidadosamente cómo está formada esta pregunta." },
      { r: 'l', t: "Nombra un modo de fallo específico. La precisión es lo que la hace diferente." },
      { r: 'g', t: "Esa precisión — ahí mismo en la pregunta — es el lenguaje del Gate 2." },
    ],
    'gate2-progress': [
      { r: 'g', t: "¡Layer 3!" },
      { r: 'l', t: "Mantener dos estados del sistema a la vez empieza a sentirse natural." },
      { r: 'g', t: "Cuatro más y tu mente lo hará automáticamente para cualquier sistema." },
    ],
    'gate2-mastered': [
      { r: 'g', t: "¡Cinco de nuevo! Gate 2 es tuyo." },
      { r: 'l', t: "El pensamiento sistémico se siente como mi modo natural ahora." },
      { r: 'g', t: "Es permanente. Vayas donde vayas, tu mente irá primero hacia los modos de fallo." },
    ],
    'completion': [
      { r: 'l', t: "La pantalla de finalización." },
      { r: 'g', t: "Tu puntuación mide la calidad de la investigación de hoy — no inteligencia, no velocidad." },
      { r: 'l', t: "Qué tan consistentemente llegué a mi profundidad elegida." },
      { r: 'g', t: "Algo acaba de cambiar en cómo piensas. Ahora mismo. En ti." },
    ],
  },
}

// All other languages fall through to the NARRATIONS single-voice map.
// The key: even with single-voice, we split into sentences so both male/female
// voices can alternate on each sentence in that language.

function getDialogue(phaseType: string, lang: string): DL[] | null {
  const lc = lang.split('-')[0].toLowerCase()
  return DIALOGUE[lc]?.[phaseType] ?? null
}

function elVoiceName(role: 'g' | 'l', lang: string): string {
  const lc = lang.split('-')[0].toLowerCase()
  const region = lang.split('-')[1]?.toUpperCase() ?? ''
  if (lc === 'en' && region === 'GB') return role === 'g' ? 'Alice' : 'Daniel'
  if (lc === 'en') return role === 'g' ? 'Matilda' : 'Liam'
  if (lc === 'hi') return role === 'g' ? 'Priyanka' : 'Anant'
  return role === 'g' ? 'Matilda' : 'Josh'  // multilingual_v2
}

// Gender detection (same logic as VoiceSettings)
const _F = ['female','zira','cortana','samantha','victoria','karen','moira','tessa','fiona',
  'ava','susan','kyoko','mizuki','haruka','meijia','yuna','anna','nora','sara','laura',
  'helena','amelie','audrey','julie','lekha','heera','kalpana','veena','raveena','aditi']
const _M = ['male','david','mark','george','daniel','alex','tom','oliver','diego','jorge',
  'james','gordon','fred','junior','paulo','rodrigo','reed','luca','hans','stefan','rakesh']

function voiceGender(v: SpeechSynthesisVoice): 'f' | 'm' | '?' {
  const n = v.name.toLowerCase()
  if (_F.some(w => n.includes(w))) return 'f'
  if (_M.some(w => n.includes(w))) return 'm'
  return '?'
}

function pickRoleVoice(
  role: 'g' | 'l',
  vlist: SpeechSynthesisVoice[],
  lang: string,
  guideVoiceName: string,
  learnerVoiceName?: string,
): SpeechSynthesisVoice | null {
  const lc = lang.split('-')[0]
  const region = lang.split('-')[1]?.toUpperCase() ?? ''
  const norm = (l: string) => l.replace('_', '-')
  // Exact-locale first (en-GB wins over en-US)
  const exactPool = vlist.filter(v => norm(v.lang).startsWith(lang))
  const rootPool  = vlist.filter(v => norm(v.lang).startsWith(lc))
  // When a specific region is requested (e.g. en-GB) but no exact voices exist,
  // return null — let the browser honour u.lang natively rather than forcing a wrong-accent voice.
  // For unspecified locales ('en') or when exact voices exist, use the pool as normal.
  if (region && exactPool.length === 0) return null
  const pool = exactPool.length > 0 ? exactPool : rootPool.length > 0 ? rootPool : vlist.filter(v => norm(v.lang).startsWith('en'))
  const src  = pool.length > 0 ? pool : vlist.filter(v => norm(v.lang).startsWith('en'))
  if (src.length === 0) return null

  const want = role === 'g' ? 'f' : 'm'
  const alt  = role === 'g' ? 'm' : 'f'

  // Use explicitly saved voice for each role
  if (role === 'g' && guideVoiceName) {
    const saved = src.find(v => v.name === guideVoiceName)
    if (saved) return saved
  }
  if (role === 'l' && learnerVoiceName) {
    const saved = src.find(v => v.name === learnerVoiceName)
    if (saved) return saved
  }

  // Tier 1: Microsoft Online Natural voices (Edge — genuinely human neural quality)
  const msNaturalOnline = src.find(v => v.name.includes('Online') && v.name.includes('Natural') && voiceGender(v) === want)
    ?? src.find(v => v.name.includes('Online') && v.name.includes('Natural') && voiceGender(v) === alt)
    ?? src.find(v => v.name.includes('Online') && v.name.includes('Natural'))
    ?? src.find(v => v.name.includes('Online') && voiceGender(v) === want)
  if (msNaturalOnline) return msNaturalOnline

  // Tier 2: Any Microsoft Natural voice (cached neural on Windows)
  const msNatural = src.find(v => v.name.includes('Natural') && voiceGender(v) === want)
    ?? src.find(v => v.name.includes('Natural') && voiceGender(v) === alt)
    ?? src.find(v => v.name.includes('Natural'))
  if (msNatural) return msNatural

  // Tier 3: Google voices (good on Chrome)
  return src.find(v => v.name.includes('Google') && voiceGender(v) === want)
      ?? src.find(v => voiceGender(v) === want)
      ?? src.find(v => v.name.includes('Google') && voiceGender(v) === alt)
      ?? src.find(v => v.name.includes('Google'))
      ?? src[0]
      ?? null
}

// ─── Phase definitions ────────────────────────────────────────────────────────

type Phase =
  | { type: 'topic-select' }
  | { type: 'target-select' }
  | { type: 'intro-question'; firstQ: string }
  | { type: 'l1-detected'; prick: string }
  | { type: 'gate1-study' }
  | { type: 'gate1-q'; question: string; count: number }
  | { type: 'gate1-progress'; from: number; to: number }
  | { type: 'gate1-mastered' }
  | { type: 'gate2-intro' }
  | { type: 'gate2-q'; question: string; count: number }
  | { type: 'gate2-progress'; from: number; to: number }
  | { type: 'gate2-mastered' }
  | { type: 'completion'; score: number }

// Rotating L1 starter questions — cycles on each demo restart so the field is never static.
// All are naturally shallow (naming/defining) — the demo shows the redirect from here.
const DEMO_STARTER_QUESTIONS = [
  'What is TCP/IP?',
  'How does the heart pump blood?',
  'What is machine learning?',
  'How does WiFi actually work?',
  'Why does the sky look blue?',
  'What is the immune system?',
  'How do vaccines work?',
  'What is gravity?',
]

function buildPhases(script: DemoScript, questionIdx = 0): Phase[] {
  const firstQ = DEMO_STARTER_QUESTIONS[questionIdx % DEMO_STARTER_QUESTIONS.length]
  const phases: Phase[] = [
    { type: 'topic-select' },
    { type: 'target-select' },
    { type: 'intro-question', firstQ },
    { type: 'l1-detected', prick: script.gate1Prick },
    { type: 'gate1-study' },
    { type: 'gate1-q', question: script.gate1Questions[0], count: 0 },
    { type: 'gate1-progress', from: 1, to: 2 },
    { type: 'gate1-q', question: script.gate1Questions[2], count: 2 },
    { type: 'gate1-progress', from: 3, to: 5 },
    { type: 'gate1-mastered' },
  ]
  if (script.target >= 3) {
    phases.push(
      { type: 'gate2-intro' },
      { type: 'gate2-q', question: script.gate2Questions[0], count: 0 },
      { type: 'gate2-progress', from: 1, to: 3 },
      { type: 'gate2-q', question: script.gate2Questions[3], count: 3 },
      { type: 'gate2-progress', from: 4, to: 5 },
      { type: 'gate2-mastered' },
    )
  }
  phases.push({ type: 'completion', score: 79 })
  return phases
}

function phaseDuration(p: Phase): number {
  switch (p.type) {
    case 'topic-select':    return 2400
    case 'target-select':   return 2800
    case 'intro-question':  return 3200
    case 'l1-detected':     return 4000
    case 'gate1-study':     return 5200
    case 'gate1-q':         return 3400
    case 'gate1-progress':  return 2600
    case 'gate1-mastered':  return 3400
    case 'gate2-intro':     return 3000
    case 'gate2-q':         return 3400
    case 'gate2-progress':  return 2600
    case 'gate2-mastered':  return 3400
    case 'completion':      return 4200
    default:                return 3000
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MasteryBar({ count, total, color, label }: { count: number; total: number; color: string; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs text-muted">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>{count}/{total}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div key={i} className="flex-1 h-3 rounded-full"
            style={{ backgroundColor: i < count ? color : '#e0ddd5' }}
            initial={{ scaleX: i === count - 1 ? 0 : 1 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: i === count - 1 ? 0.05 : 0 }}
          />
        ))}
      </div>
      <div className="font-mono text-xs text-muted mt-1.5">
        {count < total ? `${total - count} more to master this gate` : '✓ Gate mastered'}
      </div>
    </div>
  )
}

function AnimatedMasteryCount({ from, to, color, label }: { from: number; to: number; color: string; label: string }) {
  const [current, setCurrent] = useState(from)
  useEffect(() => {
    if (from >= to) return
    let i = from
    const step = () => { i = Math.min(i + 1, to); setCurrent(i); if (i < to) setTimeout(step, 350) }
    const t = setTimeout(step, 400)
    return () => clearTimeout(t)
  }, [from, to])

  return (
    <div>
      <div className="flex items-center gap-3 mb-2.5">
        <motion.span key={current} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="font-display text-4xl font-extrabold" style={{ color }}>{current}</motion.span>
        <span className="font-sans text-base text-muted">/ {to} qualifying</span>
      </div>
      <div className="flex gap-1.5 mb-2.5">
        {Array.from({ length: to }).map((_, i) => (
          <motion.div key={i} className="flex-1 h-4 rounded-full"
            style={{ backgroundColor: i < current ? color : '#e0ddd5' }}
            animate={i === current - 1 ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      <p className="font-sans text-xs text-muted leading-[1.7]">
        {current < to ? `${to - current} more to master — each crossing builds the pattern` : '5 crossings confirmed — gate mastered'}
      </p>
      <MasteryBar count={current} total={to} color={color} label={label} />
    </div>
  )
}

// ─── Phase content ────────────────────────────────────────────────────────────

function PhaseView({ phase, script, spotlight }: { phase: Phase; script: DemoScript; spotlight: string }) {
  const g1color = DEPTH_LAYERS[2].color
  const g2color = DEPTH_LAYERS[3].color
  const targetMeta = DEPTH_LAYERS[script.target]

  switch (phase.type) {

    case 'topic-select':
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Step 1 — Choose your topic</div>
          <Spotlight id="chips" active={spotlight} color={targetMeta.color}>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Evolution', script.topic, 'Quantum entanglement', 'Keynesian economics'].map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                  className="px-3.5 py-2 rounded-xl font-sans text-sm font-semibold cursor-default"
                  style={t === script.topic ? {
                    border: `2px solid ${targetMeta.color}`, backgroundColor: targetMeta.bgColor, color: targetMeta.color,
                  } : { border: '2px solid #e0ddd5', color: '#6b6860', background: '#faf8f4' }}
                >
                  {t}{t === script.topic && <motion.span className="ml-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>✓</motion.span>}
                </motion.div>
              ))}
            </div>
          </Spotlight>
          <Spotlight id="input" active={spotlight} color={targetMeta.color}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="rounded-xl border-2 border-ink p-4 bg-white">
              <span className="font-sans text-base font-semibold">{script.topic}</span>
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span>
            </motion.div>
          </Spotlight>
        </motion.div>
      )

    case 'target-select':
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Step 2 — Set your target depth</div>
          <Spotlight id="cards" active={spotlight} color={targetMeta.color}>
            <div className="flex flex-col gap-2 mb-4 min-[360px]:grid min-[360px]:grid-cols-3">
              {([2, 3, 4] as const).map((l) => {
                const m = DEPTH_LAYERS[l]
                const isTarget = l === script.target
                return (
                  <motion.div key={l}
                    className="flex min-[360px]:flex-col items-center min-[360px]:justify-center gap-3 min-[360px]:gap-0 px-3 py-2.5 min-[360px]:p-3 rounded-2xl min-[360px]:text-center"
                    style={{ backgroundColor: isTarget ? m.color : m.bgColor, border: `2px solid ${isTarget ? m.color : m.color + '40'}` }}
                    animate={isTarget ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="font-mono text-xs font-bold flex-shrink-0 min-[360px]:mb-0.5" style={{ color: isTarget ? '#fff' : m.color }}>L{l}{isTarget ? ' ✓' : ''}</div>
                    <div className="font-display text-sm font-extrabold" style={{ color: isTarget ? '#fff' : '#0a0a0f' }}>{m.tag}</div>
                    {isTarget && <div className="font-mono text-xs min-[360px]:mt-1 ml-auto min-[360px]:ml-0" style={{ color: isTarget ? 'rgba(255,255,255,0.75)' : m.color }}>TARGET</div>}
                  </motion.div>
                )
              })}
            </div>
          </Spotlight>
          <Spotlight id="info" active={spotlight} color={targetMeta.color} radius={10}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="font-sans text-sm text-muted leading-[1.75]">
              Target set to <strong style={{ color: targetMeta.color }}>Layer {script.target} · {targetMeta.tag}</strong>.
              {' '}You will need to master {script.target - 1} gate{script.target - 1 > 1 ? 's' : ''}.
            </motion.p>
          </Spotlight>
        </motion.div>
      )

    case 'intro-question':
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">First question — start anywhere</div>
          <Spotlight id="question" active={spotlight} color={g1color}>
            <div className="rounded-2xl border-2 border-ink p-4 bg-white mb-4 min-h-[52px]">
              <p className="font-sans text-base font-semibold leading-[1.7]"><TypeWriter text={phase.firstQ} /></p>
            </div>
          </Spotlight>
          <Spotlight id="eval" active={spotlight} color={g1color} radius={8}>
            <div className="flex items-center gap-2 mt-2">
              <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7a7570' }}
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="font-mono text-xs text-muted">Evaluating depth…</span>
            </div>
          </Spotlight>
        </motion.div>
      )

    case 'l1-detected':
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
          <Spotlight id="badge" active={spotlight} color={DEPTH_LAYERS[1].color} radius={8}>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: DEPTH_LAYERS[1].bgColor, color: DEPTH_LAYERS[1].color, border: `1.5px solid ${DEPTH_LAYERS[1].color}40` }}>
                L1 · Factual
              </span>
              <span className="font-mono text-xs text-muted">Gate 1 not yet cleared</span>
            </div>
          </Spotlight>
          <Spotlight id="prick" active={spotlight} color={DEPTH_LAYERS[1].color}>
            <div className="pl-4 py-3 mb-4 rounded-r-xl"
              style={{ borderLeft: `4px solid ${DEPTH_LAYERS[1].color}`, backgroundColor: DEPTH_LAYERS[1].bgColor }}>
              <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: DEPTH_LAYERS[1].color }}>
                The prick — a precise redirect
              </div>
              <p className="font-sans text-sm font-semibold text-ink/85 leading-[1.75] italic">{phase.prick}</p>
            </div>
          </Spotlight>
          <Spotlight id="bar" active={spotlight} color={g1color}>
            <MasteryBar count={0} total={MASTERY_REQUIRED} color={g1color} label="Gate 1 mastery" />
          </Spotlight>
        </motion.div>
      )

    case 'gate1-study': {
      const g2 = DEPTH_LAYERS[2]
      const criteria = g2.qualifyingCriteria as string[]
      const example = script.appMode === 'clinical' ? g2.exampleClinical : g2.exampleEpistemic
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">
            Study this before your next question
          </div>
          <Spotlight id="criteria" active={spotlight} color={g2.color}>
            <div className="card-premium p-4 mb-3">
              <div className="font-sans text-xs font-bold mb-3" style={{ color: g2.color }}>
                Signs your question is crossing Gate 1:
              </div>
              <div className="flex flex-col gap-2">
                {criteria.map((c: string, i: number) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex gap-2.5 items-start"
                  >
                    <span className="font-mono font-extrabold flex-shrink-0 mt-0.5"
                      style={{ color: g2.color, fontSize: '0.65rem' }}>0{i + 1}</span>
                    <span className="font-sans text-xs leading-[1.65]" style={{ color: '#1a1825' }}>{c}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Spotlight>
          <Spotlight id="science" active={spotlight} color={g2.color} radius={10}>
            <div className="px-4 py-3 rounded-xl mb-3" style={{ backgroundColor: g2.bgColor }}>
              <p className="font-sans text-xs leading-[1.7]" style={{ color: '#4a4460' }}>
                {(g2 as any).deepScienceBacking}
              </p>
              <p className="font-mono text-xs mt-1.5 font-bold" style={{ color: g2.color }}>
                — {(g2 as any).researchAnchor}
              </p>
            </div>
          </Spotlight>
          <Spotlight id="example" active={spotlight} color={g2.color} radius={10}>
            <div className="px-4 py-3 rounded-xl"
              style={{ border: `1.5px dashed ${g2.color}45`, backgroundColor: `${g2.color}06` }}>
              <div className="font-mono text-xs mb-1.5" style={{ color: `${g2.color}99` }}>
                Calibration model — feel the structure, not to copy
              </div>
              <p className="font-sans text-xs italic leading-[1.7]" style={{ color: '#1a1825' }}>{example}</p>
            </div>
          </Spotlight>
        </motion.div>
      )
    }

    case 'gate1-q':
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">Gate 1 attempt — {phase.count + 1} of 5</div>
          <Spotlight id="question" active={spotlight} color={g1color}>
            <div className="rounded-2xl border-2 p-4 bg-white mb-3 min-h-[52px]" style={{ borderColor: g1color }}>
              <p className="font-sans text-base font-semibold leading-[1.75]"><TypeWriter text={phase.question} /></p>
            </div>
          </Spotlight>
          <Spotlight id="mechanic" active={spotlight} color={g1color} radius={8}>
            <div className="font-sans text-xs text-muted leading-[1.7]">
              Names a mechanism — answers <em>why</em> or <em>how</em>.
            </div>
          </Spotlight>
        </motion.div>
      )

    case 'gate1-progress':
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
          <Spotlight id="badge" active={spotlight} color={g1color} radius={8}>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: DEPTH_LAYERS[2].bgColor, color: g1color, border: `1.5px solid ${g1color}40` }}>
                L2 · Relational ✓
              </span>
              <span className="font-mono text-xs font-bold" style={{ color: g1color }}>Gate 1 cleared!</span>
            </div>
          </Spotlight>
          <Spotlight id="count" active={spotlight} color={g1color}>
            <AnimatedMasteryCount from={phase.from} to={phase.to} color={g1color} label="Gate 1 mastery" />
          </Spotlight>
        </motion.div>
      )

    case 'gate1-mastered':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className="py-4 p-5 rounded-3xl" style={{ backgroundColor: DEPTH_LAYERS[2].bgColor, border: `2px solid ${g1color}` }}>
          <Spotlight id="celebrate" active={spotlight} color={g1color} radius={8}>
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="font-display text-2xl font-extrabold mb-3" style={{ color: g1color }}>
              Gate 1 Mastered — 5/5
            </motion.div>
          </Spotlight>
          <Spotlight id="dots" active={spotlight} color={g1color}>
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div key={i} className="flex-1 h-4 rounded-full" style={{ backgroundColor: g1color }}
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.1 }} />
              ))}
            </div>
          </Spotlight>
          <Spotlight id="text" active={spotlight} color={g1color} radius={8}>
            <p className="font-sans text-sm font-medium leading-[1.75]" style={{ color: g1color }}>
              Your mind now asks mechanisms naturally. This depth is the new baseline.
            </p>
          </Spotlight>
          {script.target >= 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="font-mono text-xs text-muted mt-3">→ Gate 2 unlocked · Layer 3 · Systemic</motion.p>
          )}
        </motion.div>
      )

    case 'gate2-intro':
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
          <Spotlight id="badge2" active={spotlight} color={g2color} radius={8}>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: DEPTH_LAYERS[3].bgColor, color: g2color, border: `1.5px solid ${g2color}40` }}>
                Gate 2 unlocked
              </span>
            </div>
          </Spotlight>
          <Spotlight id="prick2" active={spotlight} color={g2color}>
            <div className="pl-4 py-3 mb-4 rounded-r-xl"
              style={{ borderLeft: `4px solid ${g2color}`, backgroundColor: DEPTH_LAYERS[3].bgColor }}>
              <div className="font-mono text-xs font-bold uppercase tracking-widest mb-2" style={{ color: g2color }}>New challenge</div>
              <p className="font-sans text-sm font-semibold text-ink/80 leading-[1.75]">{script.gate2Prick}</p>
            </div>
          </Spotlight>
          <Spotlight id="bar2" active={spotlight} color={g2color}>
            <MasteryBar count={0} total={MASTERY_REQUIRED} color={g2color} label="Gate 2 mastery" />
          </Spotlight>
        </motion.div>
      )

    case 'gate2-q':
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">Gate 2 attempt — {phase.count + 1} of 5</div>
          <Spotlight id="question" active={spotlight} color={g2color}>
            <div className="rounded-2xl border-2 p-4 bg-white mb-3 min-h-[52px]" style={{ borderColor: g2color }}>
              <p className="font-sans text-base font-semibold leading-[1.75]"><TypeWriter text={phase.question} /></p>
            </div>
          </Spotlight>
          <Spotlight id="condition" active={spotlight} color={g2color} radius={8}>
            <div className="font-sans text-xs text-muted leading-[1.7]">
              Names a specific condition — concrete failure mode or competing mechanism.
            </div>
          </Spotlight>
        </motion.div>
      )

    case 'gate2-progress':
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
          <Spotlight id="badge2" active={spotlight} color={g2color} radius={8}>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: DEPTH_LAYERS[3].bgColor, color: g2color, border: `1.5px solid ${g2color}40` }}>
                L3 · Systemic ✓
              </span>
              <span className="font-mono text-xs font-bold" style={{ color: g2color }}>Gate 2 cleared!</span>
            </div>
          </Spotlight>
          <Spotlight id="count" active={spotlight} color={g2color}>
            <AnimatedMasteryCount from={phase.from} to={phase.to} color={g2color} label="Gate 2 mastery" />
          </Spotlight>
        </motion.div>
      )

    case 'gate2-mastered':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className="py-4 p-5 rounded-3xl" style={{ backgroundColor: DEPTH_LAYERS[3].bgColor, border: `2px solid ${g2color}` }}>
          <Spotlight id="celebrate" active={spotlight} color={g2color} radius={8}>
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="font-display text-2xl font-extrabold mb-3" style={{ color: g2color }}>
              Gate 2 Mastered — 5/5
            </motion.div>
          </Spotlight>
          <Spotlight id="dots" active={spotlight} color={g2color}>
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div key={i} className="flex-1 h-4 rounded-full" style={{ backgroundColor: g2color }}
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.1 }} />
              ))}
            </div>
          </Spotlight>
          <Spotlight id="text" active={spotlight} color={g2color} radius={8}>
            <p className="font-sans text-sm font-medium leading-[1.75]" style={{ color: g2color }}>
              You held two system states at once — five times. Systemic thinking is your new baseline.
            </p>
          </Spotlight>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="font-mono text-xs text-muted mt-3">→ Layer 3 target reached · Practice score pending</motion.p>
        </motion.div>
      )

    case 'completion':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className="py-4 text-center">
          <Spotlight id="score" active={spotlight} color={DEPTH_LAYERS[script.target].color} radius={16}>
            <motion.div className="font-display font-extrabold mb-1 leading-none text-bulge"
              style={{ color: DEPTH_LAYERS[script.target].color, fontSize: '4.5rem' }}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240 }}>
              {phase.score}
            </motion.div>
            <div className="font-mono text-xs text-muted mb-5">practice score</div>
          </Spotlight>
          <Spotlight id="stats" active={spotlight} color={DEPTH_LAYERS[script.target].color}>
            <div className="grid grid-cols-3 gap-2 border-t border-line pt-4 mb-5">
              {[
                { label: 'Gates mastered', value: script.target - 1 },
                { label: 'Qualifying Qs', value: (script.target - 1) * 5 },
                { label: 'Target depth', value: `L${script.target}` },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <div className="font-display text-2xl font-extrabold" style={{ color: DEPTH_LAYERS[script.target].color }}>{s.value}</div>
                  <div className="font-mono text-xs text-muted mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </Spotlight>
          <Spotlight id="quote" active={spotlight} color={DEPTH_LAYERS[script.target].color} radius={10}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="font-sans text-xs text-muted italic leading-[1.8]">
              "Your score measures the depth of today's inquiry practice. Real strength is helping others reach beyond your state."
            </motion.p>
          </Spotlight>
        </motion.div>
      )

    default: return null
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DemoFlow({ appMode = 'epistemic' }: { appMode?: AppMode }) {
  const demoContainerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [speakEnabled, setSpeakEnabled] = useState(true)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [narrationProgress, setNarrationProgress] = useState(0)
  const [effectiveLang, setEffectiveLang] = useState('en-US')
  const [speakerInfo, setSpeakerInfo] = useState<{ role: 'g' | 'l'; text: string } | null>(null)
  const [spotlightOverride, setSpotlightOverride] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideQuestion, setGuideQuestion] = useState('')
  const [guideAnswer, setGuideAnswer] = useState<string | null>(null)
  const [guideLoading, setGuideLoading] = useState(false)
  const { stopSpeaking, prefs, hasSpeech, voices } = useVoiceSettings()
  const kokoro = useKokoroTTS()
  const elevenlabs = useElevenLabsTTS()
  const openaiTTS = useOpenAITTS()
  // Tier 0: OpenAI tts-1-hd (Nova/Onyx) — requires OPENAI_API_KEY in Netlify env
  // Tier 1: ElevenLabs (Matilda/Liam/Dorothy/George) — requires ELEVENLABS_API_KEY
  // Tier 2: Kokoro WASM — English only, free, offline after first load
  // Tier 3: Web Speech API — always available, quality varies by browser

  // Keep voices in a ref — callbacks see the latest list without re-triggering effects
  const voicesRef = useRef<SpeechSynthesisVoice[]>(voices)
  useEffect(() => { voicesRef.current = voices }, [voices])

  // Stable refs so callbacks always see current running/advance without re-running effect
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])

  const script = appMode === 'clinical' ? CLINICAL : EPISTEMIC
  const [questionIdx, setQuestionIdx] = useState(0)
  const phases = buildPhases(script, questionIdx)

  const advance = useCallback(() => setPhaseIdx(p => (p + 1) % phases.length), [phases.length])
  const advanceRef = useRef(advance)
  useEffect(() => { advanceRef.current = advance }, [advance])

  // Stable refs for prefs and kokoro.ready — Dexie loading prefs (async) must NOT restart
  // narration mid-phase. Using refs means the narration effect reads the latest value at
  // phase-start time, without re-triggering when Dexie fires or Kokoro loads.
  const prefsRef = useRef(prefs)
  useEffect(() => { prefsRef.current = prefs }, [prefs])

  const kokoroReadyRef = useRef(kokoro.ready)
  useEffect(() => { kokoroReadyRef.current = kokoro.ready }, [kokoro.ready])

  // Narration — Kokoro AI voices when model loaded, Web Speech API as fallback
  const speakIdRef = useRef(0)

  useEffect(() => {
    if (!open || !speakEnabled || !hasSpeech || showVoiceSettings) return

    // Snapshot prefs at phase-start — reads the latest value without putting prefs in deps
    const currentPrefs = prefsRef.current
    const vlist = voicesRef.current
    const langCode = currentPrefs.language.split('-')[0]
    const hasNativeVoice = vlist.length > 0 && vlist.some(v => v.lang.startsWith(langCode))
    // Kokoro only supports English; for other languages fall back to Web Speech
    const kokoroActive = kokoroReadyRef.current && langCode === 'en'
    // ElevenLabs: all languages (multilingual model), skip only if known unconfigured
    const elCanTry = elevenlabs.canTry()
    // elLang: always the actual user preference — ElevenLabs is locale-aware (Alice/Daniel for en-GB)
    // useLang: Web Speech fallback when device has no native voices for the selected language
    const elLang = currentPrefs.language
    const useLang = hasNativeVoice ? currentPrefs.language : 'en-US'
    // Kokoro voices are US-accent only — base region check on actual preference, not Web Speech fallback
    const langRegion = currentPrefs.language.split('-')[1]?.toUpperCase() ?? ''
    const kokoroForLocale = kokoroActive && (langRegion === '' || langRegion === 'US')
    setEffectiveLang(elLang)

    // ── Build lines ───────────────────────────────────────────────────────────
    type Line = { role: 'g' | 'l'; text: string; v?: string; s?: number; spo?: string }
    let lines: Line[]
    const dialogue = getDialogue(phases[phaseIdx].type, elLang)
    if (dialogue && dialogue.length > 0) {
      lines = dialogue.map(d => ({ role: d.r, text: d.t, v: d.v, s: d.s, spo: d.spo }))
    } else {
      const raw = getNarration(phases[phaseIdx].type, elLang)
      const normalized = raw.replace(/\s*—\s*/g, ', ').replace(/।\s*/g, '. ').replace(/[。]/g, '. ')
      const sentences = normalized.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 1)
      lines = sentences.map((text, i) => ({ role: (i % 2 === 0 ? 'g' : 'l') as 'g' | 'l', text }))
    }
    // Guard: if a phase genuinely has no lines and narration is on, still advance.
    // Without this, the phase would be stuck forever (timer only fires when speakEnabled=false).
    if (lines.length === 0) { setTimeout(() => advanceRef.current(), 800); return }

    speakIdRef.current++
    const myId = speakIdRef.current
    setNarrationProgress(0)

    // ── Web Speech utterance wrapped in a Promise ─────────────────────────────
    function webSpeechLine(text: string, role: 'g' | 'l', speedHint?: number): Promise<void> {
      return new Promise(resolve => {
        const voice = pickRoleVoice(role, vlist, useLang, currentPrefs.voiceName, currentPrefs.learnerVoiceName)
        const u = new SpeechSynthesisUtterance(text)
        u.lang   = useLang
        u.volume = 1.0
        // Rate: apply role multiplier on top of speedHint so guide/learner stay distinct
        // even when the same voice is used (common on mobile or when no language pack installed).
        // Guide: × 0.88 (slower, measured teacher pace)
        // Learner: × 1.10 (brisker, curious student) — audible even without pitch support
        const baseRate = speedHint != null ? speedHint : currentPrefs.rate
        u.rate  = role === 'l'
          ? Math.min(baseRate * 1.15, 1.40)
          : Math.max(baseRate * 0.84, 0.55)
        // Pitch: ×0.78 for guide (distinctly deeper), ×1.24 for learner (distinctly brighter).
        // Wider gap than before — critical when device has only one voice (e.g. Hindi Web Speech)
        // where rate+pitch is the ONLY distinction between guide and learner.
        u.pitch  = role === 'l'
          ? Math.min(currentPrefs.pitch * 1.24, 1.5)
          : Math.max(currentPrefs.pitch * 0.78, 0.65)
        if (voice) u.voice = voice
        const ka = setInterval(() => { if (window.speechSynthesis.paused) window.speechSynthesis.resume() }, 2000)
        // Safety cap — floor at 2500ms (not 4000).
        // 4000ms created a 2.5s silent gap after short lines. 2500ms gives 1s headroom.
        const estMs = Math.max(text.length * 65, 2500)
        const safety = setTimeout(() => { clearInterval(ka); resolve() }, estMs)
        const done = () => { clearTimeout(safety); clearInterval(ka); resolve() }
        u.onend   = done
        // Always resolve on ANY error — 'canceled' and 'interrupted' must not hang the loop.
        // Previously these two error codes were silently dropped, which caused the demo
        // to freeze at any phase where Web Speech had no matching voice (e.g. Hindi on
        // a device without a Hindi voice) or was interrupted by a browser policy.
        u.onerror = done
        window.speechSynthesis.speak(u)
        setTimeout(() => window.speechSynthesis.resume(), 80)
      })
    }

    // ── Async narration loop ───────────────────────────────────────────────────
    const oaiCanTry = openaiTTS.canTry()
    const elGuideOverride   = currentPrefs.elGuideVoiceId   || undefined
    const elLearnerOverride = currentPrefs.elLearnerVoiceId || undefined
    const isNonEnglish = langCode !== 'en'
    let aborted = false
    async function runNarration() {
      try {
      await new Promise(r => setTimeout(r, 280))
      if (aborted || myId !== speakIdRef.current) return

      setSpotlightOverride(null)
      for (let i = 0; i < lines.length; i++) {
        if (aborted || myId !== speakIdRef.current) return
        const { role, text, v, s, spo } = lines[i]
        setNarrationProgress(i / lines.length)
        if (spo) setSpotlightOverride(spo)

        // Prefetch for whichever API tier is active
        for (const offset of [1, 2]) {
          if (i + offset < lines.length) {
            const n = lines[i + offset]
            if (oaiCanTry) openaiTTS.prefetch(n.text, n.role, elLang, n.s)
            if (elCanTry)  elevenlabs.prefetch(n.text, n.role, elLang, n.s, elGuideOverride, elLearnerOverride)
          }
        }

        let spoken = false

        // Per-tier timeout — each TTS tier is wrapped in Promise.race so a hanging await
        // (e.g. a network stall or browser audio bug) can never freeze the narration loop.
        // lineCapTimer (setTimeout + flags) cannot interrupt an in-flight await; Promise.race can.
        const makeTierTimeout = (ms: number) =>
          new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), ms))

        // 4s floor: enough for network latency, doesn't feel frozen on short lines.
        // "Alright. Here goes." (22 chars) → max(2860, 4000) = 4000ms per tier.
        // Old 12000ms floor meant 12s of apparent freeze before falling to the next tier.
        const tierCap = Math.max(text.length * 130, 4000)

        // Tier 0: OpenAI tts-1-hd — Nova (guide) / Onyx (learner) / Shimmer (guide at celebration)
        // Only mark spoken when audio ACTUALLY starts playing (onPlayStart fires).
        // Any API error, quota issue, or silent playback failure → fall through to next tier.
        if (!spoken && oaiCanTry) {
          let audioStarted = false
          const rRaw = await Promise.race([
            openaiTTS.speakLine(text, role, elLang, s, () => {
              setSpeakerInfo({ role, text })
              audioStarted = true
            }),
            makeTierTimeout(tierCap),
          ])
          const r = rRaw === 'timeout' ? 'error' : rRaw
          if (r === 'ok' && audioStarted) spoken = true
          // r === 'error', r === 'unconfigured', or ok-but-silent → fall through
        }

        // Tier 1: ElevenLabs with user-selected voice IDs (or auto default for language)
        if (!spoken && elCanTry) {
          let audioStarted = false
          const rRaw = await Promise.race([
            elevenlabs.speakLine(text, role, elLang, s, () => {
              setSpeakerInfo({ role, text })
              audioStarted = true
            }, elGuideOverride, elLearnerOverride),
            makeTierTimeout(tierCap),
          ])
          const r = rRaw === 'timeout' ? 'error' : rRaw
          if (r === 'ok' && audioStarted) spoken = true
          // fall through on any failure

          // Tier 1.5: EL free-tier fallback for non-English (e.g. Hindi Voice Library → 422)
          // Retry with free-tier multilingual voices (Matilda guide, Josh learner) — no Voice Library needed
          if (!spoken && r === 'error' && isNonEnglish) {
            let audioStarted2 = false
            const r2Raw = await Promise.race([
              elevenlabs.speakLine(text, role, elLang, s, () => {
                setSpeakerInfo({ role, text })
                audioStarted2 = true
              }, EL_VOICES.matilda.id, EL_VOICES.josh.id),
              makeTierTimeout(tierCap),
            ])
            const r2 = r2Raw === 'timeout' ? 'error' : r2Raw
            if (r2 === 'ok' && audioStarted2) spoken = true
          }
        }

        // Tier 2: Kokoro — AI WASM (English only)
        if (!spoken && kokoroForLocale) {
          setSpeakerInfo({ role, text })
          await Promise.race([
            kokoro.speak(text, (v as any) ?? (role === 'g' ? 'af_bella' : 'am_adam'), s ?? 0.9),
            makeTierTimeout(Math.max(text.length * 100, 10000)),
          ])
          spoken = true
        }

        // Tier 3: Web Speech — always available
        if (!spoken) {
          setSpeakerInfo({ role, text })
          await Promise.race([
            webSpeechLine(text, role, s),
            makeTierTimeout(Math.max(text.length * 80, 4000)),
          ])
        }
        // Natural breathing room — longer on speaker switches and reflective moments
        if (!aborted && myId === speakIdRef.current) {
          const nextRole = i + 1 < lines.length ? lines[i + 1].role : null
          const speakerSwitch = nextRole !== null && nextRole !== role
          const isReflective = s != null && s <= 0.83
          const pauseMs = isReflective ? 560 : speakerSwitch ? 440 : role === 'l' ? 310 : 250
          await new Promise(r => setTimeout(r, pauseMs))
        }
      }

      if (!aborted && myId === speakIdRef.current && runningRef.current) {
        setTimeout(() => advanceRef.current(), 900)
      }
      } catch (err) {
        // Any unhandled JS error in the loop (e.g. malformed dialogue, bad voice ID) was
        // previously silently killing the loop — demo froze with no phase advance.
        // Now we always advance so the demo continues.
        console.error('[narration] unhandled error, forcing phase advance', err)
        if (!aborted && myId === speakIdRef.current && runningRef.current) {
          setTimeout(() => advanceRef.current(), 1200)
        }
      }
    }

    if (!kokoroActive) window.speechSynthesis.cancel()
    runNarration()

    return () => {
      aborted = true
      speakIdRef.current++
      window.speechSynthesis.cancel()
      kokoro.stop()
      elevenlabs.stop()
      openaiTTS.stop()
      setSpeakerInfo(null)
      setSpotlightOverride(null)
    }
  }, [open, phaseIdx, speakEnabled, showVoiceSettings]) // eslint-disable-line

  // Timer-based advance when narration is off
  useEffect(() => {
    if (!open || !running || speakEnabled) return
    const t = setTimeout(advance, phaseDuration(phases[phaseIdx]))
    return () => clearTimeout(t)
  }, [open, running, phaseIdx, advance, phases, speakEnabled])

  // Cancel on close/unmount
  useEffect(() => { if (!open && hasSpeech) stopSpeaking() }, [open, hasSpeech, stopSpeaking])
  useEffect(() => () => { if (hasSpeech) stopSpeaking() }, [hasSpeech, stopSpeaking])

  const targetMeta = DEPTH_LAYERS[script.target]
  // spotlightOverride: set per dialogue line so visual element locks to spoken word
  const spotlight = spotlightOverride ?? getSpotlight(phases[phaseIdx].type, narrationProgress)

  const handleOpen = () => {
    setQuestionIdx(q => (q + 1) % DEMO_STARTER_QUESTIONS.length)
    setOpen(true); setPhaseIdx(0); setRunning(true)
  }
  const handleClose = () => { setOpen(false); setRunning(false); setPhaseIdx(0) }

  const askGuide = useCallback(async () => {
    const q = guideQuestion.trim()
    if (!q || guideLoading) return
    setGuideLoading(true)
    setGuideAnswer(null)
    try {
      const lang = effectiveLang.split('-')[0]
      const res = await fetch('/.netlify/functions/guide-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, lang }),
      })
      const data = await res.json()
      const answer = data.answer ?? ''
      setGuideAnswer(answer)
      if (answer && elevenlabs.canTry()) {
        elevenlabs.speakLine(answer, 'g', effectiveLang, 0.87)
      }
    } catch {
      setGuideAnswer('Something went wrong — try again.')
    } finally {
      setGuideLoading(false)
      setGuideQuestion('')
    }
  }, [guideQuestion, guideLoading, effectiveLang, elevenlabs])

  if (!open) {
    return (
      <motion.button onClick={handleOpen} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
        className="w-full rounded-2xl border-2 border-dashed border-line p-5 flex items-center gap-4 group hover:border-ink transition-all"
        style={{ background: 'linear-gradient(135deg, #fff 0%, #faf8f4 100%)' }}
      >
        <motion.div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: targetMeta.bgColor, border: `2px solid ${targetMeta.color}` }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>▶</motion.div>
        <div className="text-left flex-1">
          <div className="font-sans text-sm font-bold text-ink group-hover:opacity-80 transition-opacity leading-tight">
            Watch the full game loop
          </div>
          <div className="font-sans text-xs text-muted mt-1 leading-[1.65]">
            Topic selection → questions → mastery building → gate cleared → completion
            {hasSpeech && <span className="ml-1.5 font-medium" style={{ color: targetMeta.color }}>· with narration</span>}
          </div>
        </div>
        <span className="font-mono text-xs text-muted group-hover:text-ink transition-colors flex-shrink-0">Play →</span>
      </motion.button>
    )
  }

  const phase = phases[phaseIdx]

  return (
    <motion.div ref={demoContainerRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${targetMeta.color}` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: `${targetMeta.color}35`, backgroundColor: `${targetMeta.color}08` }}>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs font-bold uppercase tracking-widest mb-0.5 truncate" style={{ color: targetMeta.color }}>
            Demo · {appMode === 'clinical' ? 'Clinical' : 'Epistemic'}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display text-sm font-extrabold truncate max-w-[140px] min-[400px]:max-w-none">{script.topic}</span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ border: `1px solid ${targetMeta.color}50`, color: targetMeta.color, backgroundColor: targetMeta.bgColor }}>
              L{script.target}
            </span>
          </div>
        </div>
        {/* Header right — minimal: just essential controls */}
        <div className="flex items-center gap-2.5 ml-2 flex-shrink-0">
          {hasSpeech && (
            <button
              type="button"
              onClick={() => { setSpeakEnabled(s => { if (s) { stopSpeaking(); kokoro.stop(); elevenlabs.stop() } return !s }) }}
              className="font-mono text-lg leading-none text-muted hover:text-ink transition-colors"
              title={speakEnabled ? 'Mute' : 'Unmute'}
            >
              {speakEnabled ? '🔊' : '🔇'}
            </button>
          )}
          {hasSpeech && (
            <button
              type="button"
              onClick={() => {
                if (!showVoiceSettings) { window.speechSynthesis.cancel(); kokoro.stop(); elevenlabs.stop() }
                setShowVoiceSettings(v => !v)
              }}
              className="font-mono text-xs font-bold px-2 py-1 rounded-lg transition-colors"
              style={{ backgroundColor: showVoiceSettings ? '#1a1825' : 'rgba(26,24,37,0.07)', color: showVoiceSettings ? '#fff' : '#7a7570' }}
            >
              Voice
            </button>
          )}
          <button type="button" onClick={() => setRunning(r => !r)}
            className="font-mono text-lg leading-none text-muted hover:text-ink transition-colors">
            {running ? '⏸' : '▶'}
          </button>
          <button type="button" onClick={handleClose}
            className="font-mono text-lg leading-none text-muted hover:text-ink transition-colors">✕</button>
        </div>
      </div>

      {/* Voice settings panel — scrollable, max-height so it never pushes demo off screen */}
      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b"
            style={{ borderColor: `${targetMeta.color}25` }}>
            <div className="overflow-y-auto" style={{ maxHeight: 'min(75vh, 580px)' }}>
              <VoiceSettings
                onClose={(savedLang?: string) => {
                  // Update prefsRef immediately — before setPhaseIdx(0) fires narration.
                  // Dexie fires ~50ms later, so without this the narration effect would
                  // read stale language and start the demo in the wrong language.
                  if (savedLang) prefsRef.current = { ...prefsRef.current, language: savedLang }
                  setShowVoiceSettings(false)
                  setQuestionIdx(q => (q + 1) % DEMO_STARTER_QUESTIONS.length)
                  setPhaseIdx(0)
                  setNarrationProgress(0)
                  setRunning(true)
                  // Scroll the demo top back into view after the settings panel collapses
                  setTimeout(() => {
                    demoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }, 80)
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narration indicator with live speaker display */}
      {hasSpeech && speakEnabled && !showVoiceSettings && (
        <div className="px-5 pt-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-[3px] items-end flex-shrink-0" style={{ height: 18 }}>
              {([14, 8, 18, 10, 16, 6] as const).map((maxH, i) => (
                <motion.div key={i} className="w-[3px] rounded-full"
                  style={{ backgroundColor: speakerInfo?.role === 'l' ? '#8a7d6e' : targetMeta.color }}
                  animate={{ height: elevenlabs.speaking
                    ? [`${Math.max(3, maxH * 0.28)}px`, `${maxH}px`, `${Math.max(3, maxH * 0.18)}px`]
                    : ['3px', '8px', '3px'] }}
                  transition={{ duration: elevenlabs.speaking ? 0.55 + i * 0.08 : 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />
              ))}
            </div>
            {speakerInfo ? (
              <motion.span
                key={speakerInfo.role + speakerInfo.text.slice(0, 8)}
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="font-mono text-xs font-bold"
                style={{ color: speakerInfo.role === 'g' ? targetMeta.color : '#5a5670' }}
              >
                {speakerInfo.role === 'g' ? 'Guide' : 'Learner'}
                {elevenlabs.badge !== null && (
                  <span style={{ fontWeight: 400, opacity: 0.72 }}>
                    {' · '}{elVoiceName(speakerInfo.role, effectiveLang)}
                  </span>
                )}
              </motion.span>
            ) : (
              <span className="font-mono text-xs flex items-center gap-1" style={{ color: targetMeta.color }}>
                Narration ·{' '}
                <span lang={prefs.language} style={{ fontFamily: NOTO_FONT }}>
                  {SUPPORTED_LANGUAGES.find(l => l.code === prefs.language)?.nativeName ?? prefs.language}
                </span>
              </span>
            )}
          </div>
          {/* Subtitle: current spoken line */}
          {speakerInfo && (
            <motion.div
              key={speakerInfo.text.slice(0, 12)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="mt-1 font-sans text-xs leading-[1.55] pl-3"
              style={{
                color: speakerInfo.role === 'g' ? targetMeta.color + 'cc' : '#7a7570',
                borderLeft: `2px solid ${speakerInfo.role === 'g' ? targetMeta.color + '55' : '#e0ddd5'}`,
                fontStyle: 'italic',
              }}
            >
              {speakerInfo.text.length > 72 ? speakerInfo.text.slice(0, 69) + '…' : speakerInfo.text}
            </motion.div>
          )}

          {/* Voice quality row: badge + Kokoro upgrade (below subtitle, not in header) */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Tier 0: OpenAI TTS badge */}
            {openaiTTS.badge === 'ai-hd' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${targetMeta.color}22, ${targetMeta.color}14)`,
                  color: targetMeta.color,
                  border: `1px solid ${targetMeta.color}40`,
                  boxShadow: `0 0 8px ${targetMeta.color}18`,
                }}>
                ✦ Nova &amp; Onyx · HD
              </motion.span>
            )}
            {openaiTTS.badge === 'loading' && (
              <span className="font-mono text-xs" style={{ color: targetMeta.color }}>
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  Rendering voice…
                </motion.span>
              </span>
            )}
            {/* Tier 1: ElevenLabs badge (only when OpenAI not active) */}
            {openaiTTS.badge === null && elevenlabs.badge === 'human' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${targetMeta.color}22, ${targetMeta.color}14)`,
                  color: targetMeta.color,
                  border: `1px solid ${targetMeta.color}40`,
                  boxShadow: `0 0 8px ${targetMeta.color}18`,
                }}>
                ✦ {elVoiceName('g', effectiveLang)} &amp; {elVoiceName('l', effectiveLang)}
              </motion.span>
            )}
            {openaiTTS.badge === null && elevenlabs.badge === 'loading' && (
              <span className="font-mono text-xs" style={{ color: targetMeta.color }}>
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  Rendering voice…
                </motion.span>
              </span>
            )}
            {openaiTTS.badge === null && elevenlabs.badge === null && kokoro.ready && !kokoro.loading && (
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${targetMeta.color}14`, color: targetMeta.color }}>
                Neural voice ✦
              </span>
            )}
            {openaiTTS.badge === null && elevenlabs.badge === null && !kokoro.ready && !kokoro.loading && (
              <button type="button" onClick={() => kokoro.load()}
                className="font-mono text-xs font-bold px-2 py-0.5 rounded transition-all"
                style={{ backgroundColor: `${targetMeta.color}14`, color: targetMeta.color, border: `1px solid ${targetMeta.color}35` }}
                title="Load neural voice model (~45 MB, cached after first use)">
                Load neural voices ✦
              </button>
            )}
            {kokoro.loading && (
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${targetMeta.color}20` }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(kokoro.progress * 100)}%`, backgroundColor: targetMeta.color }} />
                </div>
                <span className="font-mono text-xs" style={{ color: targetMeta.color }}>{Math.round(kokoro.progress * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress pills */}
      <div className="flex items-center gap-1 px-5 pt-3 flex-wrap">
        {phases.map((p, i) => (
          <button key={i} onClick={() => { setPhaseIdx(i); setRunning(false) }} title={p.type.replace(/-/g, ' ')}>
            <motion.div className="rounded-full transition-all"
              style={{ width: i === phaseIdx ? 22 : 8, height: 8,
                backgroundColor: i < phaseIdx ? `${targetMeta.color}55` : i === phaseIdx ? targetMeta.color : '#e0ddd5' }} />
          </button>
        ))}
        <span className="font-mono text-xs text-muted ml-2">{phaseIdx + 1} / {phases.length}</span>
      </div>

      {/* Content */}
      <div className="px-5 pb-2 min-h-[200px]">
        <AnimatePresence mode="wait">
          <PhaseView key={phaseIdx} phase={phase} script={script} spotlight={spotlight} />
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex border-t" style={{ borderColor: `${targetMeta.color}25` }}>
        <button onClick={() => { setPhaseIdx(p => Math.max(0, p - 1)); setRunning(false) }}
          disabled={phaseIdx === 0}
          className="flex-1 py-3 font-mono text-xs text-muted hover:text-ink disabled:opacity-25 transition-colors border-r"
          style={{ borderColor: `${targetMeta.color}25` }}>← prev</button>
        <button onClick={() => { setPhaseIdx(p => (p + 1) % phases.length); setRunning(false) }}
          className="flex-1 py-3 font-mono text-xs text-muted hover:text-ink transition-colors">next →</button>
      </div>

      {/* Ask the guide — interactive Q&A about how the app works */}
      <div className="border-t" style={{ borderColor: `${targetMeta.color}25` }}>
        <button
          type="button"
          onClick={() => { setGuideOpen(v => !v); setGuideAnswer(null) }}
          className="w-full px-5 py-2.5 flex items-center justify-between group transition-colors"
          style={{ backgroundColor: guideOpen ? `${targetMeta.color}07` : 'transparent' }}
        >
          <span className="font-mono text-xs" style={{ color: targetMeta.color }}>
            Ask the guide anything about how this works
          </span>
          <span className="font-mono text-xs text-muted group-hover:text-ink transition-colors">
            {guideOpen ? '↑' : '↓'}
          </span>
        </button>

        {guideOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-4 overflow-hidden"
          >
            {guideAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 pl-3 py-2 rounded-r-lg text-xs font-sans leading-[1.7] italic"
                style={{
                  borderLeft: `3px solid ${targetMeta.color}`,
                  color: targetMeta.color + 'cc',
                  backgroundColor: `${targetMeta.color}07`,
                }}
              >
                <span className="font-mono text-xs font-bold not-italic mr-2" style={{ color: targetMeta.color }}>Guide:</span>
                {guideAnswer}
              </motion.div>
            )}
            <form
              onSubmit={e => { e.preventDefault(); askGuide() }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={guideQuestion}
                onChange={e => setGuideQuestion(e.target.value)}
                placeholder="What is a prick? Why 5 questions? How does scoring work?"
                className="flex-1 rounded-xl border px-3 py-2 font-sans text-xs bg-white focus:outline-none focus:ring-1 min-w-0"
                style={{ borderColor: `${targetMeta.color}40`, focusRingColor: targetMeta.color } as React.CSSProperties}
                disabled={guideLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={!guideQuestion.trim() || guideLoading}
                className="flex-shrink-0 rounded-xl px-3 py-2 font-mono text-xs font-bold transition-all disabled:opacity-40"
                style={{ backgroundColor: targetMeta.color, color: '#fff' }}
              >
                {guideLoading ? '…' : 'Ask'}
              </button>
            </form>
            <p className="font-mono text-xs text-muted mt-2 opacity-60">
              Ask about depth layers, gates, the prick, scoring, voice input, or either app mode.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
