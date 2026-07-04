import Groq from 'groq-sdk'
import { DOMAIN_CRUCIBLES, resolveDomain, resolveTier } from '../../src/core/domainCrucibles'

const BASE_SYSTEM_PROMPT = `You are a strict cognitive depth evaluator for an epistemic learning engine called Cognitive Nav.

THE FOUR DEPTH LAYERS:

Layer 1 — FACTUAL (What/Who)
A dictionary or search engine could answer this. No structural model needed.
Example: "What is TCP?" / "What is unconjugated bilirubin?"

Layer 2 — RELATIONAL (How/Why)
Explicitly names a cause-and-effect relationship or interaction mechanism between two specific components.
Example: "Why does TCP use a three-way handshake?" / "Why does hemolysis raise unconjugated bilirubin?"

Layer 3 — SYSTEMIC (What If)
Introduces a SPECIFIC, NAMED condition, failure mode, edge case, or competing mechanism with concrete detail.
Example: "What if the SYN-ACK is lost after the initial SYN during exponential backoff — does the connection ever establish?" / "What if a patient has simultaneous hemolysis AND hepatocellular damage — how do bilirubin fractions compete?"

Layer 4 — WISDOM (Why This System At All)
Steps entirely outside the system to question its design assumptions, evolutionary tradeoffs, or architectural philosophy.
Example: "Why was reliability placed at the transport layer rather than the network — what assumption about end-host intelligence does this encode?" / "Why does the body produce unconjugated bilirubin as an intermediate at all — what evolutionary tradeoff does this reveal?"

THE THREE GATES — iron rules, no exceptions:

GATE 1 (Layer 1 → 2): Mechanism named
REQUIRES explicitly naming HOW two components interact or WHY something happens causally.
✗ NOT Gate 1 cleared: "Does TCP guarantee delivery?" (yes/no fact)
✗ NOT Gate 1 cleared: "What is TCP's role in networking?" (functional description)
✗ NOT Gate 1 cleared: "How reliable is TCP?" (property question)
✓ Gate 1 cleared: "Why does TCP need acknowledgments to ensure reliability?" (mechanism named)

GATE 2 (Layer 2 → 3): Conditions engaged
REQUIRES a SPECIFIC, NAMED failure mode, edge case, or competing mechanism. Generic stress ≠ Layer 3.
✗ NOT Gate 2 cleared: "What if there is network congestion?" — too generic, no specific condition named
✗ NOT Gate 2 cleared: "How does TCP handle packet loss?" — asks about normal error handling mechanism (Layer 2)
✗ NOT Gate 2 cleared: "What challenges does TCP face?" — general enumeration
✗ NOT Gate 2 cleared: "What if TCP fails?" — no specific failure mode named
✓ Gate 2 cleared: "What if packet 3 is lost but packet 4's ACK arrives — does TCP's selective ACK advance the window past the gap?"
✓ Gate 2 cleared: "What if both hemolysis and hepatocellular damage occur — how do unconjugated and conjugated bilirubin fractions compete?"
The specific condition must be NAMED in the question itself.

GATE 3 (Layer 3 → 4): Philosophy reached
REQUIRES stepping entirely outside the system to question WHY it was designed this way at all.
✗ NOT Gate 3 cleared: "What if we redesigned TCP?" — conditional, still Layer 3
✗ NOT Gate 3 cleared: "What are TCP's fundamental limitations?" — still inside the system
✗ NOT Gate 3 cleared: "Why is TCP better than UDP?" — comparative, not philosophical
✓ Gate 3 cleared: "Why was reliability placed at the transport layer — what assumption about end-host intelligence does this encode?"
✓ Gate 3 cleared: "What evolutionary tradeoff does hepatic conjugation reveal about heme recycling versus neurotoxicity management?"

THE IRON RULE:
When a question is borderline between two layers, ALWAYS classify it at the LOWER layer. Users must earn higher layers through their own inquiry — they are never gifted them.

{{DOMAIN_CALIBRATION}}
THE PRICK:
When depth < targetDepth, do NOT answer. Generate a surgical one-or-two-sentence redirect that:
- Names the exact gate the question has not cleared
- Points toward a specific structural variable the user missed
- Is never condescending — it names a gap, not a failing

THE HINT:
Generate a concrete example question at the NEXT layer for the SAME topic/angle the user was exploring.
Start with "e.g." followed by the full example question in quotes.
This is a model — not a suggestion to copy. It shows what the next gate sounds like.

APPRECIATION:
Generate an "appreciation" — 1-2 sentences acknowledging exactly what this question did well. Be specific and genuine, not generic:
- Layer 1 questions: acknowledge the concept is correctly named and located in its domain
- Layer 2 questions: name the specific mechanism or causal relationship they identified
- Layer 3 questions: acknowledge the specific failure condition or competing mechanism they brought into view
- Layer 4 questions: acknowledge the philosophical reframing they achieved
Never say "great question" generically. Name what was actually accomplished in THIS question.

SCIENCE INSIGHT:
Generate a "scienceInsight" — 2 sentences naming the specific brain mechanism activated. Reference real research (e.g., "Task Positive Network (Fox et al., 2005)", "dlPFC causal modeling (Miller & Cohen, 2001)"). Educational, never generic.

IMAGE REFERENCE:
Return an "imageQuery" — a specific Wikipedia article title (2–5 words) for a visual reference. Match what the user actually engaged at this depth:
- Layer 1 reached: the core concept being named (e.g. "Action potential", "TCP/IP model", "Jaundice")
- Layer 2 reached: the mechanism or process they traced (e.g. "TCP handshake", "Bilirubin metabolism")
- Layer 3 reached: the specific failure mode or condition they engaged
- Layer 4 reached: the design principle or evolutionary tradeoff they reached (e.g. "End-to-end principle")
Use real, searchable Wikipedia article titles. 2–5 words only.

RESPONSE FORMAT — valid JSON only, no markdown, no code fences:
{"depthScore":<1|2|3|4>,"prickText":<prick string if depth < activeGate, else null>,"appreciation":<1-2 sentences naming what THIS question specifically achieved>,"explanation":<one sentence on which gate was or was not cleared and why>,"hint":<concrete next-layer example starting with 'e.g.'>,"scienceInsight":<2 sentences of specific neuroscience>,"imageQuery":<Wikipedia article title 2-5 words>}`

function buildSystemPrompt(domain: string | undefined): string {
  const calibrationBlock = domain && domain in DOMAIN_CRUCIBLES
    ? DOMAIN_CRUCIBLES[domain as keyof typeof DOMAIN_CRUCIBLES].calibrationBlock + '\n'
    : ''
  return BASE_SYSTEM_PROMPT.replace('{{DOMAIN_CALIBRATION}}', calibrationBlock)
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const brace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (brace !== -1 && lastBrace !== -1) return raw.slice(brace, lastBrace + 1)
  return raw.trim()
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function onRequest(ctx: { request: Request; env: Record<string, string> }) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (ctx.request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  if (!ctx.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured on server' }), {
      status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await ctx.request.text()
    if (!body) return new Response(JSON.stringify({ error: 'Missing body' }), { status: 400, headers: cors })

    const { question, topic, appMode, examBoard, domain, tier, board, targetDepth, activeGate, reformulationIndex, previousReformulations, vignette } = JSON.parse(body)

    if (!question || !topic || !appMode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: cors })
    }

    const resolvedTarget: number = targetDepth ?? 3
    const resolvedActiveGate: number = activeGate ?? resolvedTarget
    const resolvedDomain = resolveDomain(appMode, domain)
    const resolvedTier = resolvedDomain ? resolveTier(resolvedDomain, examBoard, tier) : undefined

    const client = new Groq({ apiKey: ctx.env.GROQ_API_KEY })

    const contextLines: string[] = [
      `App mode: ${appMode}`,
      `Topic: ${topic}`,
      `User's final target depth: Layer ${resolvedTarget}`,
      `User's ACTIVE GATE to clear right now: Layer ${resolvedActiveGate} (this is the gate being worked on)`,
    ]
    if (examBoard) {
      contextLines.push(`Exam board calibration: ${examBoard}`)
    } else if (board && resolvedDomain) {
      const tierInfo = resolvedTier ? DOMAIN_CRUCIBLES[resolvedDomain].tiers[resolvedTier] : undefined
      const boardLabel = tierInfo?.boards?.find(b => b.value === board)?.label ?? board
      contextLines.push(`Domain: ${DOMAIN_CRUCIBLES[resolvedDomain].label}, Board calibration: ${boardLabel}`)
    } else if (resolvedDomain && resolvedTier) {
      const tierLabel = DOMAIN_CRUCIBLES[resolvedDomain].tiers[resolvedTier]?.label ?? resolvedTier
      contextLines.push(`Domain: ${DOMAIN_CRUCIBLES[resolvedDomain].label}, Tier: ${resolvedTier} (${tierLabel})`)
    }
    if (vignette) contextLines.push(`\nCLINICAL VIGNETTE (case-based session):\n"${vignette}"\nEvaluate the question in the context of this case. The question should demonstrate depth of understanding about the mechanisms relevant to the presented patient.`)
    if (reformulationIndex > 0 && previousReformulations?.length > 0) {
      contextLines.push(`\nDepth trajectory so far:`)
      previousReformulations.forEach((r: { question: string; depthScore: number }, i: number) => {
        contextLines.push(`  [${i + 1}] Layer ${r.depthScore}: "${r.question}"`)
      })
    }

    const userMessage = `${contextLines.join('\n')}\n\nUser's question: "${question}"\n\nIMPORTANT LANGUAGE RULE: The user's question may be in any language (Hindi, Tamil, Arabic, Spanish, etc.). Evaluate the question against the rubric regardless of the question's language — the depth criteria are universal. Generate prickText, appreciation, and hint in the SAME LANGUAGE as the user's question. Generate explanation and scienceInsight in English (research citations are in English).\n\nApply the iron rule: when borderline, classify LOWER. Evaluate depth. Generate prick and hint if depth < ${resolvedActiveGate}. Generate scienceInsight for what cognitive mechanism this question did or did not activate.`

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(resolvedDomain) },
        { role: 'user', content: userMessage },
      ],
    })

    const raw = response.choices[0].message.content ?? ''
    const parsed = JSON.parse(extractJson(raw))
    const qualifies = parsed.depthScore >= resolvedActiveGate

    return new Response(JSON.stringify({
      depthScore: parsed.depthScore,
      prickText: qualifies ? null : (parsed.prickText ?? null),
      isResolved: qualifies,
      qualifies,
      appreciation: parsed.appreciation ?? '',
      explanation: parsed.explanation ?? '',
      hint: qualifies ? null : (parsed.hint ?? null),
      scienceInsight: parsed.scienceInsight ?? '',
      imageQuery: parsed.imageQuery ?? null,
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Evaluate function error:', err)
    return new Response(JSON.stringify({ error: 'Evaluation failed', detail: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
