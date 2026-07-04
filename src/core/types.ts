export type DepthLayer = 1 | 2 | 3 | 4

export type AppMode = 'epistemic' | 'clinical'

export type ExamBoard = 'neet-ug' | 'neet-pg' | 'neet-ss' | 'usmle-1' | 'usmle-2' | 'usmle-3' | 'plab' | 'mbbs-y1' | 'mbbs-y2' | 'general'

// Domain generalizes "Clinical Crucible" beyond medicine. Tier generalizes ExamBoard beyond
// medicine's specific exams into a universal school→undergrad→grad→doctoral→frontier ladder.
// See src/core/domainCrucibles.ts. Both optional/additive — existing clinical sessions without
// these fields are treated as domain: 'medicine' at read time.
export type Domain =
  | 'medicine'
  | 'engineering'
  | 'law'
  | 'computer-science'
  | 'physical-sciences'
  | 'life-sciences'
  | 'mathematics'
  | 'business-economics-finance'
  | 'humanities'
  | 'social-sciences'
  | 'arts-design'
  | 'trades-vocational'
  | 'education'
  | 'agriculture-environmental-science'
  | 'entrepreneurship'
export type Tier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5'

export type IntelligenceTag = 'IQ' | 'EQ' | 'Spatial'

export interface DepthLayerMeta {
  layer: DepthLayer
  tag: string
  headline: string
  description: string
  scientificBasis: string
  criterionTest: string
  qualifyingCriteria: string[]
  deepScienceBacking: string
  researchAnchor: string
  masterySignal: string
  builds: IntelligenceTag[]
  gateDescription: string
  exampleEpistemic: string
  exampleClinical: string
  color: string
  bgColor: string
  textColor: string
}

export interface Reformulation {
  id: string
  question: string
  depthScore: DepthLayer
  prickText: string | null
  scienceInsight: string | null
  qualifiesForGate: DepthLayer | null
  timestamp: number
  isResolved: boolean
}

export type SessionMode = 'topic' | 'case'

export interface Session {
  id: string
  userId: string | null
  appMode: AppMode
  topic: string
  examBoard?: ExamBoard
  domain?: Domain
  tier?: Tier
  /** Generic "named board/exam within this tier" for domains other than medicine — see
   *  DomainCrucibleConfig.tiers[tier].boards in domainCrucibles.ts. Medicine keeps examBoard. */
  board?: string
  targetDepth: DepthLayer
  levelMastery: Partial<Record<DepthLayer, number>>
  reformulations: Reformulation[]
  trajectoryVector: DepthLayer[]
  currentDepth: DepthLayer
  isComplete: boolean
  createdAt: number
  updatedAt: number
  offlineCreated?: boolean
  sessionMode?: SessionMode
  vignette?: string
}

export interface EvaluateRequest {
  question: string
  topic: string
  appMode: AppMode
  examBoard?: ExamBoard
  domain?: Domain
  tier?: Tier
  board?: string
  targetDepth: DepthLayer
  activeGate: DepthLayer
  reformulationIndex: number
  previousReformulations?: Array<{ question: string; depthScore: DepthLayer }>
  vignette?: string
}

export interface EvaluateResponse {
  depthScore: DepthLayer
  prickText: string | null
  isResolved: boolean
  explanation: string
  appreciation: string
  hint: string | null
  scienceInsight: string
  qualifies: boolean
  imageQuery?: string | null
}

export type NyayaDebateMode = 'vada' | 'jalpa' | 'vitanda'

export interface TeamMember {
  id: string
  name: string
  currentDepth: DepthLayer
  trajectoryVector: DepthLayer[]
  lastQuestion: string | null
}

export interface TeamSession {
  id: string
  name: string
  topic: string
  appMode: AppMode
  examBoard?: ExamBoard
  domain?: Domain
  debateMode: NyayaDebateMode
  members: TeamMember[]
  collectiveDepth: DepthLayer
  prickChain: Array<{
    fromMemberId: string
    toMemberId: string
    prickText: string
    timestamp: number
  }>
  createdAt: number
  isActive: boolean
}

export interface UserProfile {
  id: string
  email: string
  name: string
  preferredMode: AppMode
  preferredExamBoard?: ExamBoard
  preferredDomain?: Domain
  preferredTier?: Tier
  preferredBoard?: string
  conceptCoverage: Record<string, DepthLayer>
  totalSessions: number
  createdAt: string
}
