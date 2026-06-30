// ElevenLabs TTS proxy — accent-aware, emotion-aware
// en-US: Matilda (XrExE9yKIg1WjnnlVkGX) + Liam (TX3LPaxmHKxFdv7VOQHJ)   (eleven_turbo_v2_5)
// en-GB: Dorothy (ThT5KcBeYPX3keUQqHPh) + George (JBFqnCBsd6RMkjVDRZzb)  (eleven_turbo_v2_5)
// Other: Matilda (XrExE9yKIg1WjnnlVkGX) + Josh (TxGEqnHWrfWFTfGW9XjX)    (eleven_multilingual_v2)
// Voice selection is done in useElevenLabsTTS.ts pickVoiceForLang() — voice_id always explicit

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

  const apiKey = ctx.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured', code: 'NO_KEY' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const {
      text,
      voice_id      = '21m00Tcm4TlvDq8ikWAM',
      model_id      = 'eleven_turbo_v2_5',
      style         = 0.42,
      stability     = 0.35,
      output_format = 'mp3_44100_192',
    } = await ctx.request.json() as any

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: cors })
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=${output_format}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 800),
        model_id,
        voice_settings: { stability, similarity_boost: 0.82, style, use_speaker_boost: true },
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
      headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'TTS failed' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
