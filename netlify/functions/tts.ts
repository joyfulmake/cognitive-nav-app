import type { Handler } from '@netlify/functions'

// ElevenLabs TTS proxy — accent-aware, emotion-aware
// en-US: Matilda (XrExE9yKIg1WjnnlVkGX) + Liam (TX3LPaxmHKxFdv7VOQHJ)   (eleven_turbo_v2_5)
// en-GB: Dorothy (ThT5KcBeYPX3keUQqHPh) + George (JBFqnCBsd6RMkjVDRZzb) (eleven_turbo_v2_5)
// Other: Matilda (XrExE9yKIg1WjnnlVkGX) + Josh (TxGEqnHWrfWFTfGW9XjX)   (eleven_multilingual_v2)
// Voice selection is done in useElevenLabsTTS.ts pickVoiceForLang() — voice_id always explicit

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured', code: 'NO_KEY' }),
    }
  }

  try {
    const {
      text,
      voice_id      = '21m00Tcm4TlvDq8ikWAM',  // Rachel default
      model_id      = 'eleven_turbo_v2_5',
      style         = 0.42,
      stability     = 0.35,
      output_format = 'mp3_44100_192',           // caller sets based on emotional register
    } = JSON.parse(event.body || '{}')

    if (!text?.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text required' }) }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=${output_format}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 800),
        model_id,
        voice_settings: {
          stability,
          similarity_boost: 0.82,
          style,
          use_speaker_boost: true,
        },
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
