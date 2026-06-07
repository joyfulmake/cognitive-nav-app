import type { Handler } from '@netlify/functions'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { audioBase64, mimeType = 'audio/webm', language } = body

    if (!audioBase64) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'audioBase64 required' }),
      }
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    // Groq whisper accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm
    const ext = mimeType.includes('webm') ? 'webm'
      : mimeType.includes('wav') ? 'wav'
      : mimeType.includes('mp4') ? 'mp4'
      : 'webm'

    const file = new File([audioBuffer], `audio.${ext}`, { type: mimeType })

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      ...(language ? { language } : {}),
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ text: transcription.text }),
    }
  } catch (err: any) {
    console.error('Whisper error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message ?? 'Transcription failed' }),
    }
  }
}
