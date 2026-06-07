import type { Handler } from '@netlify/functions'

// Cartesia Sonic-2 TTS proxy — ultra-low latency for live session feedback
// Docs: https://docs.cartesia.ai/api-reference/tts/bytes
// Voices: https://play.cartesia.ai/voices

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  const apiKey = process.env.CARTESIA_API_KEY
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'CARTESIA_API_KEY not configured', code: 'NO_KEY' }),
    }
  }

  try {
    const {
      text,
      voice_id = 'b7d50908-b17c-442d-ad8d-810c63997ed9', // Helpful Woman (calm, warm)
      language = 'en',
      speed    = 'normal',   // 'slowest'|'slow'|'normal'|'fast'|'fastest'
      emotion  = [] as string[],               // e.g. ['positivity:high']
    } = JSON.parse(event.body || '{}')

    if (!text?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'text required' }) }
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
            ? {
                __experimental_controls: {
                  speed,
                  ...(emotion.length > 0 ? { emotion } : {}),
                },
              }
            : {}),
        },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
        language,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return {
        statusCode: res.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errText }),
      }
    }

    const buf = Buffer.from(await res.arrayBuffer())
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (err: unknown) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Cartesia TTS failed' }),
    }
  }
}
