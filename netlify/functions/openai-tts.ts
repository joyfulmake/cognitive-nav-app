import type { Handler } from '@netlify/functions'

// OpenAI TTS proxy — tts-1-hd model, used as Tier 0 above ElevenLabs
// Guide: nova (warm, approachable, conversational female — natural across all languages)
// Learner: echo (youthful, genuine male — natural across all languages)
// Celebration: shimmer (brighter, expressive)
// Voice selection happens in useOpenAITTS.ts — voice is always explicit here

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'OPENAI_API_KEY not configured', code: 'NO_KEY' }),
    }
  }

  try {
    const {
      text,
      voice = 'nova',      // nova | echo | onyx | shimmer | alloy | fable
      speed = 1.0,         // 0.25–4.0
    } = JSON.parse(event.body || '{}')

    if (!text?.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text required' }) }

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text.slice(0, 4096),
        voice,
        response_format: 'mp3',
        speed,
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
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message ?? 'TTS failed' }),
    }
  }
}
