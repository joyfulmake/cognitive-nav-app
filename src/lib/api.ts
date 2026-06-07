import type { EvaluateRequest, EvaluateResponse } from '../core/types'

export async function evaluateQuestion(req: EvaluateRequest): Promise<EvaluateResponse> {
  const res = await fetch('/.netlify/functions/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}
