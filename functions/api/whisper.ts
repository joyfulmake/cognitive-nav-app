import Groq from 'groq-sdk'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

  try {
    const body = await ctx.request.json() as { audioBase64?: string; mimeType?: string; language?: string }
    const { audioBase64, mimeType = 'audio/webm', language } = body

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'audioBase64 required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const binaryStr = atob(audioBase64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

    const ext = mimeType.includes('webm') ? 'webm'
      : mimeType.includes('wav') ? 'wav'
      : mimeType.includes('mp4') ? 'mp4'
      : 'webm'

    const file = new File([bytes], `audio.${ext}`, { type: mimeType })

    const groq = new Groq({ apiKey: ctx.env.GROQ_API_KEY })
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      ...(language ? { language } : {}),
    })

    return new Response(JSON.stringify({ text: transcription.text }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Whisper error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Transcription failed' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
