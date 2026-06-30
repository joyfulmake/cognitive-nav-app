import type { Handler } from '@netlify/functions'
import Groq from 'groq-sdk'

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const brace = raw.indexOf('{')
  const last  = raw.lastIndexOf('}')
  if (brace !== -1 && last !== -1) return raw.slice(brace, last + 1)
  return raw.trim()
}

const BOARD_STYLE: Record<string, string> = {
  'neet-ug':  'NEET UG undergraduate medical India — physiological depth, clinical reasoning at mechanism level',
  'neet-pg':  'NEET PG postgraduate India — emphasise pathophysiology, diagnostics, management principles',
  'neet-ss':  'NEET SS super-specialty India — surgical or subspecialty decision-making, advanced management',
  'usmle-1':  'USMLE Step 1 — basic science mechanisms, biochemistry, pathophysiology',
  'usmle-2':  'USMLE Step 2 CK — clinical knowledge, management of acute presentations',
  'usmle-3':  'USMLE Step 3 — clinical management, ICU decisions, long-term care',
  'plab':     'PLAB UK — NICE guidelines, UK NHS protocols, GP and hospital presentations',
  'mbbs-y1':  'MBBS Year 1 — basic physiology and anatomy, first principles',
  'mbbs-y2':  'MBBS Year 2 — applied pathology, pharmacology, early clinical reasoning',
  'general':  'general medical education',
}

export const handler: Handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method not allowed' }

  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }) }
  }

  try {
    const { topic, examBoard } = JSON.parse(event.body ?? '{}')
    if (!topic) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing topic' }) }

    const style = BOARD_STYLE[examBoard ?? 'general'] ?? BOARD_STYLE['general']
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 320,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a clinical educator writing exam-style vignettes for ${style}. Return valid JSON only, no markdown.`,
        },
        {
          role: 'user',
          content: `Write a concise clinical vignette for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: patient age/sex, presenting complaint, 2-3 key findings (symptoms, signs, or labs)
- Do NOT include the diagnosis or differential
- Do NOT include management
- End naturally, leaving the mechanism unexplained
- Tone: real hospital/exam case, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely diagnosis>", "<alternative 1>", "<alternative 2>"]}`,
        },
      ],
    })

    const raw = res.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(extractJson(raw))

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vignette: parsed.vignette ?? '',
        differentials: Array.isArray(parsed.differentials) ? parsed.differentials : [],
      }),
    }
  } catch (err) {
    console.error('vignette error:', err)
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Vignette generation failed', detail: String(err) }),
    }
  }
}
