import type { Handler } from '@netlify/functions'
import Groq from 'groq-sdk'

// The Guide character answers questions about how Cognitive Nav works.
// Kept to 2-3 sentences — this is a demo sidebar, not a full tutorial.

const GUIDE_SYSTEM = `You are the Guide in Cognitive Nav — a warm, thoughtful mentor helping a learner understand how this app works while they watch a demo. You answer questions about the app concisely (2-3 sentences max). Never give away answers to the user's actual topic questions — only help them understand the APP itself.

Topics you answer about:
- The four depth layers: L1 names things, L2 asks how/why (mechanism), L3 finds specific failure modes, L4 questions the system's design assumptions
- The three gates: Gate 1 needs a causal mechanism named, Gate 2 needs a specific failure condition named, Gate 3 needs a philosophical reframing
- Why 5 qualifying questions per gate: Hebb (1949) showed neurons that fire together 5 times wire together — 5 crossings makes that thinking mode automatic and permanent
- The prick: a surgical redirect that names the exact structural element a question missed — never a wrong/right judgment, always a pointing gesture toward depth
- The practice score: measures consistency of inquiry quality, not intelligence or speed
- Voice input: tap the mic icon in any session, works in all languages via Groq Whisper
- Clinical Crucible mode: medical topics calibrated to NEET/USMLE/PLAB exam standards
- General Epistemic mode: any topic, any depth target

Tone: warm, direct, genuinely helpful. Never say "great question". Never repeat what you just said. If asked something you don't know, say so briefly.`

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  if (!process.env.GROQ_API_KEY) {
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
    }
  }

  try {
    const { question, lang = 'en' } = JSON.parse(event.body || '{}')
    if (!question?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'question required' }) }
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const langNote = lang !== 'en' ? ` Reply in the same language as the question (${lang}).` : ''

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 120,
      messages: [
        { role: 'system', content: GUIDE_SYSTEM },
        { role: 'user', content: question.slice(0, 400) + langNote },
      ],
    })

    const answer = response.choices[0].message.content?.trim() ?? ''

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message ?? 'Guide Q&A failed' }),
    }
  }
}
