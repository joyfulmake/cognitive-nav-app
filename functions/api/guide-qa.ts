import Groq from 'groq-sdk'

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

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

  if (!ctx.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { question, lang = 'en' } = await ctx.request.json() as any
    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'question required' }), { status: 400, headers: cors })
    }

    const client = new Groq({ apiKey: ctx.env.GROQ_API_KEY })
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
    return new Response(JSON.stringify({ answer }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Guide Q&A failed' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
