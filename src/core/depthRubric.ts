import type { DepthLayer, DepthLayerMeta } from './types'

export const MASTERY_REQUIRED = 5

export const DEPTH_LAYERS: Record<DepthLayer, DepthLayerMeta> = {
  1: {
    layer: 1,
    tag: 'Factual',
    headline: 'What / Who',
    description: 'Names a fact, entity, or term. No structural model required.',
    scientificBasis: 'Activates hippocampal declarative memory — the brain\'s filing cabinet. Retrieval without structural understanding.',
    criterionTest: 'Could a dictionary or Wikipedia answer this in one sentence?',
    qualifyingCriteria: [
      'Your question moves beyond naming — it reaches for how something actually works',
      'The words "how", "why", "because", or "in order to" appear naturally in your question',
      'Your question connects at least two components — not just one thing, but the relationship between things',
      'A dictionary alone cannot answer it — structural understanding is needed',
      'You feel curiosity pulling you toward the mechanism, not just the label',
    ],
    deepScienceBacking: 'Causal questioning activates the dorsolateral prefrontal cortex (dlPFC) — the brain\'s hub for causal inference. Hebbian learning (Hebb, 1949) requires co-activation of related neural circuits: asking WHY forces the brain to build synaptic connections between concept nodes rather than retrieve isolated ones. Wieman (2014) demonstrated that causal questioning shifts learning outcome effect sizes by 0.5–1.2 standard deviations over fact retrieval alone.',
    researchAnchor: 'Hebb (1949) · Wieman (2014) · Miller & Cohen (2001)',
    masterySignal: 'You consistently name mechanisms and causal relationships without prompting. Structural vocabulary emerges naturally in your questions.',
    builds: ['IQ'],
    gateDescription: 'You named the territory. Gate 1 asks: do you know how it works?',
    exampleEpistemic: '"Why does TCP need acknowledgments to ensure reliable delivery?"',
    exampleClinical: '"Why does hemolysis cause a rise specifically in unconjugated bilirubin?"',
    color: '#c43d0f',
    bgColor: '#fff5f0',
    textColor: '#7a2200',
  },
  2: {
    layer: 2,
    tag: 'Relational',
    headline: 'How / Why',
    description: 'Names a mechanism or causal relationship. Shows basic system awareness.',
    scientificBasis: 'Engages prefrontal causal modeling. Shifts from declarative memory to active inference.',
    criterionTest: 'Does the question explicitly name a cause, mechanism, or interaction between two components?',
    qualifyingCriteria: [
      'Your question names a specific condition, not a vague one — not "what if it fails?" but "what if X happens while Y is active?"',
      'You are holding two states of the system in your mind at once — what should happen and what actually happens at the edge',
      'The scenario you describe is concrete enough that someone could test it — a named stressor, a named failure mode',
      'Your question could only be asked by someone who already understands how the system works normally',
      'You feel the tension — something surprising might happen, and you want to know exactly why',
    ],
    deepScienceBacking: 'Conditional reasoning — holding "if X while Y" — engages the Task Positive Network (Fox et al., 2005): coordinated activation of dlPFC, posterior parietal cortex, and anterior insula. This fully deactivates the Default Mode Network — the brain\'s passive recall mode. Miller & Cohen (2001) define expert cognition precisely as the capacity to maintain multiple contradictory system states in working memory simultaneously. Decety & Grezes (2006) showed that imagining failure modes activates the same cortical circuits as expert practice — the simulation IS the training.',
    researchAnchor: 'Fox et al. (2005) · Miller & Cohen (2001) · Decety & Grezes (2006)',
    masterySignal: 'You naturally frame questions around specific failure conditions, not general mechanisms. Edge cases become your default entry point.',
    builds: ['IQ', 'EQ'],
    gateDescription: 'You traced the cause. Gate 2 asks: what happens when the system is stressed?',
    exampleEpistemic: '"What if the SYN-ACK is lost during exponential backoff — does TCP\'s retransmit timer distinguish SYN from data-packet timeouts?"',
    exampleClinical: '"What if a patient has simultaneous hemolysis AND hepatocellular damage — how do conjugated and unconjugated bilirubin fractions compete?"',
    color: '#1a6b3a',
    bgColor: '#f0fff5',
    textColor: '#0f3f22',
  },
  3: {
    layer: 3,
    tag: 'Systemic',
    headline: 'What If',
    description: 'Engages failure modes, competing mechanisms, edge cases. Expert-level cognition.',
    scientificBasis: 'Activates the Task Positive Network — executive function, working memory, and spatial reasoning simultaneously.',
    criterionTest: 'Does the question name a specific condition, failure mode, or competing mechanism that breaks normal assumptions?',
    qualifyingCriteria: [
      'Your question steps entirely outside the system — you are no longer asking about it, you are asking why it exists',
      'You are questioning the assumptions the designers held — what they believed about the world when they made this choice',
      'Your question could change how you see every system of this kind, not just this one instance',
      'It could only emerge after deeply understanding the system from the inside — this is wisdom earned, not assumed',
      'You feel a kind of quiet wonder — not excitement at the edge, but stillness at the root',
    ],
    deepScienceBacking: 'Meta-systemic thinking activates the dorsomedial PFC and medial temporal lobe in a pattern associated with insight (Bowden & Jung-Beeman, 2003) — gamma-band neural synchrony spikes at the moment of reframing. Popper\'s falsificationist reasoning maps onto this: not "how does this work" but "what would have to be true about the world for this design to exist at all." Kahneman (2011) identifies this as System 2 operating on System 2 — metacognition examining its own architecture. Developmentally, this capacity reliably emerges only after deep structural mastery of Layers 2 and 3.',
    researchAnchor: 'Bowden & Jung-Beeman (2003) · Popper (1959) · Kahneman (2011)',
    masterySignal: 'You spontaneously question why systems were designed the way they were. Assumptions feel visible to you that are invisible to others.',
    builds: ['IQ', 'EQ', 'Spatial'],
    gateDescription: 'You navigated the edge. Gate 3 asks: why was this system designed at all?',
    exampleEpistemic: '"Why was reliability placed at the transport layer rather than the network layer — what assumption about end-host intelligence does this design encode?"',
    exampleClinical: '"Why does the body use unconjugated bilirubin as an intermediate at all — what evolutionary tradeoff between heme recycling efficiency and neurotoxicity risk does this reveal?"',
    color: '#1a5c8a',
    bgColor: '#edf4fa',
    textColor: '#0d3d56',
  },
  4: {
    layer: 4,
    tag: 'Wisdom',
    headline: 'Why This System',
    description: 'Questions the design assumptions and philosophy of the system itself.',
    scientificBasis: 'Meta-cognitive function — the brain observing its own models. Standing outside the system entirely.',
    criterionTest: 'Does the question challenge why this system was designed this way, or ask what assumption about the world it encodes?',
    qualifyingCriteria: [
      'Demonstrates that this level requires stepping outside all systems, including your own inquiry',
      'Questions the nature of knowledge itself in this domain',
      'Identifies a tension between the system\'s design and a deeper truth about reality',
      'Shows understanding that mastery here means recognizing the limits of your questions',
      'The question itself demonstrates the humility of not knowing what you do not know',
    ],
    deepScienceBacking: 'Layer 4 maps onto what Socrates identified as the highest knowledge: knowing that you do not know. Neuroscientifically, this involves the anterior cingulate cortex monitoring prediction errors between your mental model and reality (Holroyd & Coles, 2002). Vygotsky\'s Zone of Proximal Development at its outermost boundary — what you can reach only by helping another person reach it first. The humility is not performative: it is the accurate metacognitive recognition that your questions are still bounded by frameworks you cannot yet see.',
    researchAnchor: 'Holroyd & Coles (2002) · Vygotsky (1978) · Socratic Method',
    masterySignal: 'You hold questions longer without rushing to answers. You recognize when a question reveals the boundary of a framework, not just the boundary of your knowledge.',
    builds: ['IQ', 'EQ', 'Spatial'],
    gateDescription: 'You questioned the system\'s existence. This is where humility begins.',
    exampleEpistemic: '"Why was reliability placed at the transport layer — what does this reveal about the philosophical assumption that intelligence should live at the edges of a network, not its core?"',
    exampleClinical: '"Why does medicine treat bilirubin as a waste product to be eliminated rather than as a signal — what does this reveal about the reductive vs. systems framing in clinical biochemistry?"',
    color: '#7c2d96',
    bgColor: '#faf0ff',
    textColor: '#4a1165',
  },
}

export const GATES = [
  {
    id: 1,
    label: 'Mechanism named',
    description: 'Names a cause or interaction between components',
    clearedAt: 2 as DepthLayer,
  },
  {
    id: 2,
    label: 'Conditions engaged',
    description: 'Introduces a specific edge case, failure mode, or competing mechanism',
    clearedAt: 3 as DepthLayer,
  },
  {
    id: 3,
    label: 'Philosophy reached',
    description: 'Questions the design assumptions of the system itself',
    clearedAt: 4 as DepthLayer,
  },
]

// L1 target = "foundation mode": any 5 questions complete it (no gate system)
// L2+ targets = gate system: 5 qualifying questions per gate to advance

export function getActiveGate(
  levelMastery: Partial<Record<DepthLayer, number>> | undefined,
  targetDepth: DepthLayer
): DepthLayer {
  const mastery = levelMastery ?? {}
  if (targetDepth === 1) return 1  // foundation mode — any question qualifies
  for (const level of [2, 3, 4] as DepthLayer[]) {
    if (level > targetDepth) break
    if ((mastery[level] ?? 0) < MASTERY_REQUIRED) return level as DepthLayer
  }
  return targetDepth
}

export function getMasteryCount(
  levelMastery: Partial<Record<DepthLayer, number>> | undefined,
  gate: DepthLayer
): number {
  return Math.min((levelMastery ?? {})[gate] ?? 0, MASTERY_REQUIRED)
}

export function isMasteryComplete(
  levelMastery: Partial<Record<DepthLayer, number>> | undefined,
  targetDepth: DepthLayer
): boolean {
  const mastery = levelMastery ?? {}
  if (targetDepth === 1) {
    // Foundation mode: complete when 5 questions at any depth have been asked
    return (mastery[1] ?? 0) >= MASTERY_REQUIRED
  }
  for (const level of [2, 3, 4] as DepthLayer[]) {
    if (level > targetDepth) break
    if ((mastery[level] ?? 0) < MASTERY_REQUIRED) return false
  }
  return true
}

export function gatesCleared(depth: DepthLayer): [boolean, boolean, boolean] {
  return [depth >= 2, depth >= 3, depth >= 4]
}

export function computePracticeScore(
  trajectoryVector: DepthLayer[],
  levelMastery: Partial<Record<DepthLayer, number>>,
  targetDepth: DepthLayer
): number {
  if (trajectoryVector.length === 0) return 0
  const totalRequired = (targetDepth - 1) * MASTERY_REQUIRED
  if (totalRequired === 0) return 100

  let totalEarned = 0
  for (const level of [2, 3, 4] as DepthLayer[]) {
    if (level > targetDepth) break
    totalEarned += Math.min(levelMastery[level] ?? 0, MASTERY_REQUIRED)
  }

  const completionRatio = totalEarned / totalRequired
  const efficiency = trajectoryVector.length > 0
    ? Math.max(0, 1 - (trajectoryVector.length - totalRequired) / (totalRequired * 2))
    : 1

  return Math.round(completionRatio * 70 + efficiency * 30)
}

export function getProgressToTarget(currentDepth: DepthLayer, targetDepth: DepthLayer): number {
  if (targetDepth === 1) return 100
  return Math.min(100, Math.round(((currentDepth - 1) / (targetDepth - 1)) * 100))
}

export function getTrajectoryScore(trajectoryVector: DepthLayer[]): number {
  if (trajectoryVector.length === 0) return 0
  const maxDepth = Math.max(...trajectoryVector)
  const stepsToMax = trajectoryVector.indexOf(maxDepth as DepthLayer) + 1
  const efficiency = stepsToMax / trajectoryVector.length
  return Math.round((maxDepth * 25) * (1 + (1 - efficiency) * 0.5))
}

export function computeCollectiveDepth(memberDepths: DepthLayer[]): DepthLayer {
  if (memberDepths.length === 0) return 1
  return Math.min(...memberDepths) as DepthLayer
}

export const DEPTH_COLORS: Record<DepthLayer, string> = {
  1: '#c43d0f',
  2: '#1a6b3a',
  3: '#0c447c',
  4: '#7c2d96',
}

export const DEPTH_BG_COLORS: Record<DepthLayer, string> = {
  1: 'rgba(196, 61, 15, 0.07)',
  2: 'rgba(26, 107, 58, 0.07)',
  3: 'rgba(12, 68, 124, 0.08)',
  4: 'rgba(124, 45, 150, 0.12)',
}
