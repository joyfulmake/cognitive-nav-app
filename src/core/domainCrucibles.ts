import type { Domain, Tier, ExamBoard } from './types'

// Shared source of truth for {domain, tier} calibration. Imported by both the frontend
// (src/pages/Home.tsx, topicSuggestions.ts) and the Cloudflare Pages Functions
// (functions/api/evaluate.ts, functions/api/vignette.ts) — Functions bundle relative
// imports across the repo, and this module is pure data with no DOM dependency.
//
// Medicine's content below is a verbatim port of what used to be hardcoded directly in
// evaluate.ts/vignette.ts, keyed by ExamBoard — output must stay byte-identical to the
// pre-generalization prompts. Engineering is new: the pilot proving the {domain, tier}
// abstraction generalizes beyond medicine (see PRODUCT_ROADMAP.md Release 4.0).

export interface TierInfo {
  label: string
  legacyExamBoards?: ExamBoard[] // medicine only — which ExamBoard values live at this tier
}

export interface DomainCrucibleConfig {
  label: string
  tiers: Partial<Record<Tier, TierInfo>>
  /** Static calibration text appended to evaluate.ts's SYSTEM_PROMPT for this domain. */
  calibrationBlock: string
  /** Role framing for the vignette/case system prompt, e.g. "clinical educator". */
  caseWriterRole: string
  /** Case-generation style, keyed by ExamBoard (medicine) or Tier (engineering). */
  caseStyle: Record<string, string>
  defaultCaseStyleKey: string
  /** User-message rules block for functions/api/vignette.ts, domain-flavored wording. */
  caseInstructions: (topic: string) => string
  /** LevelStudyPanel "a question that lives at this depth" example, per L1-L4. Medicine's
   *  equivalents stay in depthRubric.ts's exampleClinical (unchanged) — this only backs
   *  domains other than medicine. */
  layerExamples: Record<1 | 2 | 3 | 4, string>
}

const MEDICINE_CALIBRATION_BLOCK = `CLINICAL CALIBRATION:
When appMode is "clinical", these ADDITIONAL requirements apply on top of the base gate criteria:

DIFFERENTIAL DIAGNOSIS (Gate 2, clinical mode):
Beyond the base Gate 2 condition (specific failure mode), clinical Gate 2 also requires the question to engage at least one of:
  a) A competing diagnosis that could produce a similar presentation and why it can be ruled in/out, OR
  b) A condition that would change the interpretation of a key finding (e.g. "What if this patient also has X — how does that change the bilirubin pattern?"), OR
  c) A named physiological edge case specific to a clinical population (e.g. pregnant, elderly, immunocompromised)
✗ NOT clinical Gate 2: "What if there is organ damage?" — no specific competing condition named
✗ NOT clinical Gate 2: "What happens in severe cases?" — too generic
✓ Clinical Gate 2: "What if this patient has both haemolysis AND hepatocellular damage — how do the two bilirubin fractions compete and what labs differentiate them?"
✓ Clinical Gate 2: "What if the patient were pregnant — how would this alter the threshold for bilirubin exchange transfusion?"

MANAGEMENT PHILOSOPHY (Gate 3, high-stakes boards: neet-ss, usmle-2, usmle-3):
Beyond the base Gate 3 (design assumptions), for these boards Gate 3 also benefits from engaging:
  a) WHY a treatment approach was designed as it was (e.g. "Why does sepsis management target MAP ≥ 65 specifically — what assumption about tissue perfusion physiology does this threshold encode?"), OR
  b) The philosophical tension between competing management frameworks (e.g. conservative vs aggressive, organ-support vs cure), OR
  c) What the existence of a treatment reveals about how medicine models the disease

Per-board Gate 2 depth calibration:
- neet-ss / usmle-3: requires surgical or ICU management decision-depth condition
- usmle-2: requires acute management scenario with competing clinical priorities
- usmle-1 / neet-pg / mbbs-y2: requires specific biochemical or mechanistic condition with differential
- plab: requires named NICE protocol deviation or clinical guideline boundary case
- neet-ug / mbbs-y1: requires specific physiological condition or named failure mechanism`

const ENGINEERING_CALIBRATION_BLOCK = `ENGINEERING CALIBRATION:
When domain is "engineering", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING FAILURE MODE (Gate 2, engineering domain):
Beyond the base Gate 2 condition (specific failure mode), engineering Gate 2 also requires the question to engage at least one of:
  a) A competing failure mode that could produce a similar symptom and how to distinguish which one is actually occurring, OR
  b) An operating condition that would change how a key measurement or reading should be interpreted (e.g. "What if this beam is also under thermal load — how does that change the stress calculation?"), OR
  c) A named edge-case operating environment specific to a real deployment (e.g. high-altitude, high-vibration, extreme temperature, cyclic fatigue)
✗ NOT engineering Gate 2: "What if the material fails?" — no specific competing failure mode named
✗ NOT engineering Gate 2: "What happens under extreme conditions?" — too generic
✓ Engineering Gate 2: "What if this shaft experiences both torsional and axial fatigue loading simultaneously — how do the two stress components combine and what test distinguishes their contribution?"
✓ Engineering Gate 2: "What if this system operated at high altitude — how would reduced air density change the thermal margin calculation?"

DESIGN PHILOSOPHY (Gate 3, advanced tiers: T3 licensed/professional, T4 doctoral/research):
Beyond the base Gate 3 (design assumptions), for these tiers Gate 3 also benefits from engaging:
  a) WHY a design threshold or safety factor was set as it was (e.g. "Why does this pressure vessel code mandate a safety factor of 4 specifically — what assumption about material fatigue and inspection interval does this encode?"), OR
  b) The philosophical tension between competing design frameworks (e.g. redundancy vs simplicity, fail-safe vs fail-operational), OR
  c) What the existence of a design standard reveals about how the field models risk

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved design-tradeoff condition, not yet standardized
- T3 (licensed/professional engineer): requires a code-compliance or safety-margin decision-depth condition
- T2 (undergraduate): requires a specific mechanistic or load-case condition with a named failure mode`

export const DOMAIN_CRUCIBLES: Record<Domain, DomainCrucibleConfig> = {
  medicine: {
    label: 'Medicine',
    tiers: {
      T2: { label: 'Undergraduate / Early Clinical', legacyExamBoards: ['mbbs-y1', 'mbbs-y2', 'neet-ug', 'usmle-1', 'general'] },
      T3: { label: 'Graduate / Specialist', legacyExamBoards: ['neet-pg', 'usmle-2', 'plab'] },
      T4: { label: 'Advanced Specialist / Near-Independent Practice', legacyExamBoards: ['neet-ss', 'usmle-3'] },
    },
    calibrationBlock: MEDICINE_CALIBRATION_BLOCK,
    caseWriterRole: 'clinical educator',
    caseStyle: {
      'neet-ug': 'NEET UG undergraduate medical India — physiological depth, clinical reasoning at mechanism level',
      'neet-pg': 'NEET PG postgraduate India — emphasise pathophysiology, diagnostics, management principles',
      'neet-ss': 'NEET SS super-specialty India — surgical or subspecialty decision-making, advanced management',
      'usmle-1': 'USMLE Step 1 — basic science mechanisms, biochemistry, pathophysiology',
      'usmle-2': 'USMLE Step 2 CK — clinical knowledge, management of acute presentations',
      'usmle-3': 'USMLE Step 3 — clinical management, ICU decisions, long-term care',
      'plab': 'PLAB UK — NICE guidelines, UK NHS protocols, GP and hospital presentations',
      'mbbs-y1': 'MBBS Year 1 — basic physiology and anatomy, first principles',
      'mbbs-y2': 'MBBS Year 2 — applied pathology, pharmacology, early clinical reasoning',
      'general': 'general medical education',
    },
    defaultCaseStyleKey: 'general',
    caseInstructions: (topic: string) => `Write a concise clinical vignette for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: patient age/sex, presenting complaint, 2-3 key findings (symptoms, signs, or labs)
- Do NOT include the diagnosis or differential
- Do NOT include management
- End naturally, leaving the mechanism unexplained
- Tone: real hospital/exam case, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely diagnosis>", "<alternative 1>", "<alternative 2>"]}`,
    // Verbatim copy of depthRubric.ts DEPTH_LAYERS[n].exampleClinical — kept in sync manually;
    // this is what LevelStudyPanel shows for medicine sessions via the registry lookup.
    layerExamples: {
      1: '"Why does hemolysis cause a rise specifically in unconjugated bilirubin?"',
      2: '"What if a patient has simultaneous hemolysis AND hepatocellular damage — how do conjugated and unconjugated bilirubin fractions compete?"',
      3: '"Why does the body use unconjugated bilirubin as an intermediate at all — what evolutionary tradeoff between heme recycling efficiency and neurotoxicity risk does this reveal?"',
      4: '"Why does medicine treat bilirubin as a waste product to be eliminated rather than as a signal — what does this reveal about the reductive vs. systems framing in clinical biochemistry?"',
    },
  },

  engineering: {
    label: 'Engineering',
    tiers: {
      T2: { label: 'Undergraduate' },
      T3: { label: 'Licensed / Professional Engineer' },
      T4: { label: 'Doctoral / Research' },
    },
    calibrationBlock: ENGINEERING_CALIBRATION_BLOCK,
    caseWriterRole: 'engineering educator',
    caseStyle: {
      T2: 'undergraduate engineering coursework — mechanism-level failure analysis, first-principles load/stress reasoning',
      T3: 'professional/licensed engineering practice — code compliance, safety margins, real deployment tradeoffs',
      T4: 'doctoral/research-level engineering — novel design tradeoffs, unresolved or emerging failure modes',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise engineering failure/design case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: system/component context, an observed symptom or anomaly, 2-3 key findings (measurements, readings, or inspection notes)
- Do NOT include the root cause or diagnosis
- Do NOT include the fix or remediation
- End naturally, leaving the mechanism unexplained
- Tone: real field report or design-review case, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely root cause>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"Why does a cantilever beam experience maximum bending stress at the fixed support rather than at the free end?"',
      2: '"What if this shaft experiences both torsional and axial fatigue loading simultaneously — how do the two stress components combine and what test distinguishes their contribution?"',
      3: '"Why does engineering practice specify a safety factor rather than designing exactly to the calculated failure load — what assumption about material variability and inspection interval does this encode?"',
      4: '"Why do engineering codes treat failure as something to be prevented by margin rather than predicted by precise calculation — what does this reveal about how the field models uncertainty itself?"',
    },
  },
}

/** Resolve which domain applies for a request that may only carry the legacy appMode/examBoard shape. */
export function resolveDomain(appMode: string, domain?: Domain): Domain | undefined {
  if (domain) return domain
  if (appMode === 'clinical') return 'medicine'
  return undefined
}

/** Resolve tier from an explicit tier, falling back to a legacy examBoard lookup (medicine). */
export function resolveTier(domain: Domain, examBoard?: ExamBoard, tier?: Tier): Tier | undefined {
  if (tier) return tier
  if (!examBoard) return undefined
  const config = DOMAIN_CRUCIBLES[domain]
  for (const [t, info] of Object.entries(config.tiers) as [Tier, TierInfo][]) {
    if (info.legacyExamBoards?.includes(examBoard)) return t
  }
  return undefined
}

/** Resolve the caseStyle key: ExamBoard for medicine (legacy behavior), Tier for other domains. */
export function resolveCaseStyleKey(domain: Domain, examBoard?: ExamBoard, tier?: Tier): string {
  const config = DOMAIN_CRUCIBLES[domain]
  if (domain === 'medicine') return (examBoard ?? config.defaultCaseStyleKey)
  return (tier ?? config.defaultCaseStyleKey)
}
