// Depth-aware context generator — produces interest hooks, key facts, and web reference links
// Gate 0 = L1→L2 (mechanism), Gate 1 = L2→L3 (failure modes), Gate 2 = L3→L4 (design philosophy)

const GATE_LABELS: Record<number, string> = {
  0: 'why this works (mechanisms and causal relationships)',
  1: 'where this breaks (failure modes, edge cases, and competing mechanisms)',
  2: 'why this was designed this way (assumptions, trade-offs, and philosophical foundations)',
}

const SYSTEM = `You are a curious, expert educator who builds genuine interest in any topic.
Given a topic and a learning depth angle, produce a JSON response in this exact shape:
{
  "hook": "<1-2 sentences that make this topic feel fascinating and urgent>",
  "facts": ["<fact 1>", "<fact 2>", "<fact 3>"],
  "searches": [
    { "label": "<short display label>", "query": "<search query to paste into Google/Wikipedia>" },
    { "label": "<short display label>", "query": "<search query>" },
    { "label": "<short display label>", "query": "<search query>" }
  ]
}

Rules:
- hook: One striking angle — a paradox, a surprising consequence, or a historical moment that reveals the depth of the topic at the given angle. No generic intros.
- facts: Three concrete, specific facts that build intuition. Each should feel like a revelation — the kind of fact that makes someone say "wait, really?" Not textbook definitions.
- searches: Three search queries a learner should actually run to go deeper. Prefer: named theorems/papers, specific failure stories, famous experiments, or documentary-quality content. Make queries specific — not "TCP reliability" but "SYN flood attack mechanism explained".
- Respond ONLY with valid JSON. No preamble, no trailing text.
- Keep everything concise. Hook ≤ 40 words. Each fact ≤ 25 words. Each label ≤ 5 words.`

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

  const apiKey = ctx.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { topic = 'unknown', gate = 0, lang = 'en' } = await ctx.request.json() as any
    if (!topic.trim()) {
      return new Response(JSON.stringify({ error: 'topic required' }), { status: 400, headers: cors })
    }

    const angle = GATE_LABELS[gate] ?? GATE_LABELS[0]
    const langNote = lang !== 'en' ? ` Respond in ${lang}.` : ''
    const userPrompt = `Topic: ${topic}\nAngle: ${angle}${langNote}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userPrompt }],
        response_format: { type: 'json_object' },
        max_tokens: 512,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), {
        status: res.status, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json() as any
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)

    return new Response(JSON.stringify({
      hook: parsed.hook ?? '',
      facts: Array.isArray(parsed.facts) ? parsed.facts.slice(0, 3) : [],
      searches: Array.isArray(parsed.searches) ? parsed.searches.slice(0, 3) : [],
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'context generation failed' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
