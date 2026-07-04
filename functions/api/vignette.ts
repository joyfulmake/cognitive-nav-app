import Groq from 'groq-sdk'
import { DOMAIN_CRUCIBLES, resolveDomain, resolveCaseStyleKey } from '../../src/core/domainCrucibles'

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const brace = raw.indexOf('{')
  const last  = raw.lastIndexOf('}')
  if (brace !== -1 && last !== -1) return raw.slice(brace, last + 1)
  return raw.trim()
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  if (!ctx.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 503, headers: cors,
    })
  }

  try {
    const { topic, examBoard, domain, tier } = await ctx.request.json() as any
    if (!topic) {
      return new Response(JSON.stringify({ error: 'Missing topic' }), { status: 400, headers: cors })
    }

    const resolvedDomain = resolveDomain('clinical', domain) ?? 'medicine'
    const config = DOMAIN_CRUCIBLES[resolvedDomain as keyof typeof DOMAIN_CRUCIBLES]
    const styleKey = resolveCaseStyleKey(resolvedDomain, examBoard, tier)
    const style = config.caseStyle[styleKey] ?? config.caseStyle[config.defaultCaseStyleKey]
    const client = new Groq({ apiKey: ctx.env.GROQ_API_KEY })

    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 320,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a ${config.caseWriterRole} writing exam-style vignettes for ${style}. Return valid JSON only, no markdown.`,
        },
        {
          role: 'user',
          content: config.caseInstructions(topic),
        },
      ],
    })

    const raw = res.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(extractJson(raw))

    return new Response(JSON.stringify({
      vignette: parsed.vignette ?? '',
      differentials: Array.isArray(parsed.differentials) ? parsed.differentials : [],
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('vignette error:', err)
    return new Response(JSON.stringify({ error: 'Vignette generation failed', detail: String(err) }), {
      status: 500, headers: cors,
    })
  }
}
