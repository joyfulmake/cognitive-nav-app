// Cartesia Sonic-2 TTS proxy — ultra-low latency for live session feedback
// Docs: https://docs.cartesia.ai/api-reference/tts/bytes

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

  const apiKey = ctx.env.CARTESIA_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CARTESIA_API_KEY not configured', code: 'NO_KEY' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const {
      text,
      voice_id = 'b7d50908-b17c-442d-ad8d-810c63997ed9',
      language = 'en',
      speed    = 'normal',
      emotion  = [] as string[],
    } = await ctx.request.json() as any

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: cors })
    }

    const res = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: text.slice(0, 1000),
        model_id: 'sonic-2',
        voice: {
          mode: 'id',
          id: voice_id,
          ...(speed !== 'normal' || emotion.length > 0
            ? { __experimental_controls: { speed, ...(emotion.length > 0 ? { emotion } : {}) } }
            : {}),
        },
        output_format: { container: 'mp3', encoding: 'mp3', sample_rate: 44100 },
        language,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: errText }), {
        status: res.status, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(res.body, {
      status: 200,
      headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-cache' },
    })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Cartesia TTS failed' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
