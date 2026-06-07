import type { NyayaDebateMode } from './types'

export interface NyayaRule {
  id: string
  sanskrit: string
  transliteration: string
  english: string
  application: string
}

export const NYAYA_RULES: NyayaRule[] = [
  {
    id: 'pramana',
    sanskrit: 'प्रमाण',
    transliteration: 'Pramana',
    english: 'Valid means of knowledge',
    application: 'Every claim must be grounded in one of: direct observation (Pratyaksha), inference (Anumana), analogy (Upamana), or reliable testimony (Shabda). "I think" is not Pramana.',
  },
  {
    id: 'vada',
    sanskrit: 'वाद',
    transliteration: 'Vada',
    english: 'Constructive debate toward truth',
    application: 'Both parties seek truth together. No personal attacks. Address structural content only. The goal is collective illumination, not victory.',
  },
  {
    id: 'pariprashna',
    sanskrit: 'परिप्रश्न',
    transliteration: 'Pariprashna',
    english: 'Deep investigative inquiry',
    application: 'Questions must probe deeper than the previous. A question that can be answered by a dictionary fails Pariprashna.',
  },
  {
    id: 'sequence',
    sanskrit: 'क्रम',
    transliteration: 'Krama',
    english: 'Ordered progression',
    application: 'Each member must reach Layer 3 individually before the group debate phase begins. Collective debate built on shallow foundations produces noise, not knowledge.',
  },
  {
    id: 'collective-floor',
    sanskrit: 'सामूहिक न्यूनतम',
    transliteration: 'Samuhika Nyuntama',
    english: 'Collective floor',
    application: 'The team\'s depth is the minimum of all members. One person at Layer 4 and two at Layer 1 is a Layer 1 team. Everyone rises or no one has.',
  },
]

export const DEBATE_MODE_DESCRIPTIONS: Record<NyayaDebateMode, { name: string; description: string; allowed: boolean }> = {
  vada: {
    name: 'Vada',
    description: 'Constructive debate toward truth. Both parties accept the same Pramanas and seek collective illumination. The only mode allowed in team sessions.',
    allowed: true,
  },
  jalpa: {
    name: 'Jalpa',
    description: 'Dialectical debate where one party attempts to win regardless of truth. Recognized but not supported in this system.',
    allowed: false,
  },
  vitanda: {
    name: 'Vitanda',
    description: 'Destructive refutation without offering a counter-thesis. Recognized but not supported in this system.',
    allowed: false,
  },
}

export const TEAM_RULES_SUMMARY = `
Team sessions operate under Nyaya Darshana rules of Vada (constructive debate):

1. Every claim must have Pramana (valid grounding).
2. All questions must be at Layer 3 or above to enter the group debate phase.
3. You may build a Prick Chain: your prick can deepen a teammate's redirect.
4. The team's collective depth is the minimum of all members.
5. No Jalpa (winning over truth) or Vitanda (destruction without thesis).
`
