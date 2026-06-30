// OpenAI TTS proxy — tts-1-hd model
// Guide: nova (warm, approachable, conversational female — natural across all languages)
// Learner: echo (youthful, genuine male — natural across all languages)
// Celebration: shimmer (brighter, expressive)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

  const apiKey = ctx.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured', code: 'NO_KEY' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { text, voice = 'nova', speed = 1.0 } = await ctx.request.json() as any

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: cors })
    }

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1-hd', input: text.slice(0, 4096), voice, response_format: 'mp3', speed }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: errText }), {
        status: res.status, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(res.body, {
      status: 200,
      headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'TTS failed' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
