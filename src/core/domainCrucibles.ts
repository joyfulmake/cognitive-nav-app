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

const LAW_CALIBRATION_BLOCK = `LEGAL CALIBRATION:
When domain is "law", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING ARGUMENT (Gate 2, legal domain):
Beyond the base Gate 2 condition, legal Gate 2 also requires the question to engage at least one of:
  a) A competing legal argument or precedent that could produce a different outcome and why it applies or is distinguished, OR
  b) A jurisdiction-specific or fact-pattern edge case that would change how a rule is applied, OR
  c) A named exception or defense that shifts the analysis
✗ NOT legal Gate 2: "What if the contract is unfair?" — no specific legal doctrine named
✗ NOT legal Gate 2: "What happens if someone breaks the law?" — too generic
✓ Legal Gate 2: "What if the defendant acted under duress AND the jurisdiction recognizes only economic duress — does the defense still apply?"
✓ Legal Gate 2: "What if this precedent was set in a diversity jurisdiction — does it bind a federal question case?"

DOCTRINAL PHILOSOPHY (Gate 3, advanced tiers: T3 graduate/practicing, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a legal standard or threshold was set as it was (e.g. "Why does 'beyond reasonable doubt' sit where it does on the standard-of-proof spectrum?"), OR
  b) The philosophical tension between competing interpretive frameworks (e.g. originalism vs living constitutionalism, textualism vs purposivism), OR
  c) What the existence of a doctrine reveals about how the law models fairness or risk

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved doctrinal tension, not yet settled by courts
- T3 (graduate/practicing): requires a case-law distinguishing or multi-jurisdiction conflict condition
- T2 (undergraduate/pre-law): requires a specific fact-pattern condition with a named rule or exception`

const CS_CALIBRATION_BLOCK = `COMPUTER SCIENCE CALIBRATION:
When domain is "computer-science", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING FAILURE MODE (Gate 2, computer-science domain):
Beyond the base Gate 2 condition, CS Gate 2 also requires the question to engage at least one of:
  a) A competing failure mode (race condition, off-by-one, cache invalidation) that could produce the same symptom, OR
  b) A specific input or concurrency condition that would change program behavior, OR
  c) A named scale or environment edge case (network partition, clock skew, memory pressure)
✗ NOT CS Gate 2: "What if the code has a bug?" — no specific failure mode named
✗ NOT CS Gate 2: "What happens with lots of users?" — too generic
✓ CS Gate 2: "What if two threads increment the counter simultaneously without a lock — does the read-modify-write race lose an update?"
✓ CS Gate 2: "What if the network partitions mid-transaction — does the system choose consistency or availability at that instant?"

ARCHITECTURAL PHILOSOPHY (Gate 3, advanced tiers: T3 professional, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY an architectural tradeoff was made as it was (e.g. "Why does this system choose eventual consistency — what assumption about acceptable staleness does this encode?"), OR
  b) The philosophical tension between competing paradigms (e.g. CAP theorem tradeoffs, stateful vs stateless design), OR
  c) What the existence of an abstraction reveals about how the field models correctness

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved systems-design tension, not yet standardized
- T3 (professional): requires a production-incident or scale-threshold decision-depth condition
- T2 (undergraduate): requires a specific algorithmic or concurrency condition with a named failure mode`

const PHYSICAL_SCIENCES_CALIBRATION_BLOCK = `PHYSICAL SCIENCES CALIBRATION:
When domain is "physical-sciences", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING MECHANISM (Gate 2, physical-sciences domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing physical mechanism that could produce the same observation and how to distinguish them, OR
  b) A confounding variable that would change how an experimental result is interpreted, OR
  c) A named boundary condition where a model's assumptions break down
✗ NOT Gate 2: "What if the experiment goes wrong?" — no specific confound named
✗ NOT Gate 2: "What happens at high energy?" — too generic
✓ Gate 2: "What if both thermal expansion AND phase transition contribute to the volume change — how do dilatometry and calorimetry separate the two effects?"
✓ Gate 2: "What if this reaction is measured near the diffusion limit — does the rate law still reflect the intrinsic kinetics?"

MODEL PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a physical law or model is framed the way it is (e.g. "Why does thermodynamics define entropy as a state function — what assumption about path-independence does this encode?"), OR
  b) The philosophical tension between competing theoretical frameworks (e.g. classical vs quantum, deterministic vs statistical), OR
  c) What the existence of a physical constant or law reveals about the field's model of reality

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved theoretical tension, not yet settled by experiment
- T3 (graduate): requires a multi-mechanism experimental-design condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or boundary`

const LIFE_SCIENCES_CALIBRATION_BLOCK = `LIFE SCIENCES CALIBRATION:
When domain is "life-sciences", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING MECHANISM (Gate 2, life-sciences domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing biological mechanism that could produce the same phenotype and how to distinguish them, OR
  b) A confounding variable that would change how an experimental result is interpreted, OR
  c) A named edge-case organism, tissue, or condition where the mechanism differs
✗ NOT Gate 2: "What if the gene doesn't work?" — no specific competing mechanism named
✗ NOT Gate 2: "What happens in disease?" — too generic
✓ Gate 2: "What if both a point mutation AND altered splicing reduce the protein — how do sequencing and RT-PCR distinguish the two contributions?"
✓ Gate 2: "What if this pathway is studied in a hypoxic tissue — does the same rate-limiting step still hold?"

EVOLUTIONARY PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a biological process evolved the mechanism it did (e.g. "Why does the cell use a proofreading step rather than a faster, error-prone one — what tradeoff between speed and fidelity does this encode?"), OR
  b) The philosophical tension between competing models (e.g. gene-centric vs systems-level views of evolution), OR
  c) What the existence of a regulatory mechanism reveals about how the field models control in living systems

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved mechanistic tension, not yet settled experimentally
- T3 (graduate): requires a multi-mechanism experimental-design condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or edge case`

const MATHEMATICS_CALIBRATION_BLOCK = `MATHEMATICS CALIBRATION:
When domain is "mathematics", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING PROOF STRATEGY (Gate 2, mathematics domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing proof strategy and why one succeeds where another fails, OR
  b) A specific edge case or counterexample that would break a naive version of a claim, OR
  c) A named boundary condition where a theorem's hypotheses stop holding
✗ NOT Gate 2: "What if the proof is wrong?" — no specific edge case named
✗ NOT Gate 2: "Does this always work?" — too generic
✓ Gate 2: "What if the function is continuous but not differentiable at one point — does the mean value theorem still apply there?"
✓ Gate 2: "What if the matrix is singular — does the standard inverse-based solution method break, and does a pseudo-inverse approach still converge?"

FOUNDATIONAL PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY an axiom or definition was chosen as it was (e.g. "Why does ZFC exclude a universal set — what paradox does this axiom schema prevent?"), OR
  b) The philosophical tension between competing foundational frameworks (e.g. constructivist vs classical logic), OR
  c) What the existence of a definition reveals about how mathematics models a concept

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved proof-strategy tension, not yet settled in the literature
- T3 (graduate): requires a multi-case proof-structure condition
- T2 (undergraduate): requires a specific counterexample or boundary condition with a named theorem hypothesis`

const BUSINESS_CALIBRATION_BLOCK = `BUSINESS/ECONOMICS/FINANCE CALIBRATION:
When domain is "business-economics-finance", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING MECHANISM (Gate 2, business-economics-finance domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing market or behavioral mechanism that could produce the same outcome and how to distinguish them, OR
  b) A confounding variable that would change how a business or market result is interpreted, OR
  c) A named edge-case market condition (illiquidity, information asymmetry, regulatory shock)
✗ NOT Gate 2: "What if the business fails?" — no specific mechanism named
✗ NOT Gate 2: "What happens in a recession?" — too generic
✓ Gate 2: "What if both a demand shock AND a supply-chain constraint drive the price rise — how do quantity and inventory data separate the two effects?"
✓ Gate 2: "What if this asset is thinly traded — does the observed price still reflect fair value, or does illiquidity distort it?"

INCENTIVE PHILOSOPHY (Gate 3, advanced tiers: T3 graduate/practicing, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY an incentive structure or threshold was designed as it was (e.g. "Why does this compensation scheme cap the bonus rather than scale it linearly — what assumption about risk-taking does this encode?"), OR
  b) The philosophical tension between competing economic frameworks (e.g. efficient-market vs behavioral views), OR
  c) What the existence of a market mechanism reveals about how the field models rational behavior

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved market-design tension, not yet settled empirically
- T3 (graduate/practicing): requires a multi-mechanism valuation or strategy condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or market edge case`

const HUMANITIES_CALIBRATION_BLOCK = `HUMANITIES CALIBRATION:
When domain is "humanities", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING INTERPRETATION (Gate 2, humanities domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing interpretation or causal explanation and what evidence distinguishes them, OR
  b) A specific historical, textual, or contextual condition that would change a reading, OR
  c) A named counter-example that complicates a general claim
✗ NOT Gate 2: "What if the interpretation is wrong?" — no specific competing reading named
✗ NOT Gate 2: "What did people think back then?" — too generic
✓ Gate 2: "What if this text is read through its original oral-performance context rather than as silent prose — does the argument's rhetorical structure change?"
✓ Gate 2: "What if the event is explained by both economic pressure AND ideological shift — how do primary sources weigh the two causes?"

FRAMEWORK PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY an interpretive framework was adopted as it was (e.g. "Why does this reading privilege authorial intent over reader-response — what assumption about meaning does this encode?"), OR
  b) The philosophical tension between competing schools of interpretation (e.g. structuralist vs post-structuralist), OR
  c) What the existence of a canon or genre reveals about how the field models meaning or value

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved interpretive tension, not yet settled in the scholarship
- T3 (graduate): requires a multi-source or multi-framework comparative condition
- T2 (undergraduate): requires a specific contextual condition with a named counter-example`

const SOCIAL_SCIENCES_CALIBRATION_BLOCK = `SOCIAL SCIENCES CALIBRATION:
When domain is "social-sciences", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING EXPLANATION (Gate 2, social-sciences domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing behavioral or structural explanation and what evidence distinguishes them, OR
  b) A confounding variable that would change how a study's result is interpreted, OR
  c) A named population or context edge case where the effect differs
✗ NOT Gate 2: "What if people behave differently?" — no specific mechanism named
✗ NOT Gate 2: "What happens in society?" — too generic
✓ Gate 2: "What if both social desirability bias AND selection bias inflate the reported effect — how would a randomized design separate them?"
✓ Gate 2: "What if this finding is studied in a collectivist culture — does the same individual-level mechanism still predict the outcome?"

STRUCTURAL PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a theoretical framework models behavior or structure the way it does (e.g. "Why does this model treat institutions as constraints rather than actors — what assumption about agency does this encode?"), OR
  b) The philosophical tension between competing paradigms (e.g. structuralist vs individualist explanations), OR
  c) What the existence of a measure or construct reveals about how the field models the social world

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved theoretical tension, not yet settled empirically
- T3 (graduate): requires a multi-mechanism research-design condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or population edge case`

const ARTS_DESIGN_CALIBRATION_BLOCK = `ARTS & DESIGN CALIBRATION:
When domain is "arts-design", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING EXPLANATION (Gate 2, arts-design domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing formal or technical explanation for an aesthetic effect and how to distinguish them, OR
  b) A specific material, context, or constraint that would change how a work is read, OR
  c) A named edge-case medium or convention where the technique behaves differently
✗ NOT Gate 2: "What if the design doesn't work?" — no specific technique named
✗ NOT Gate 2: "What makes it look good?" — too generic
✓ Gate 2: "What if both color contrast AND negative space create the focal hierarchy — how would removing one in isolation reveal each contribution?"
✓ Gate 2: "What if this composition principle is applied in a moving-image medium rather than static — does the same balance still hold across frames?"

INTENT PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a design convention or principle was established as it was (e.g. "Why does this grid system fix a baseline rhythm — what assumption about reading behavior does this encode?"), OR
  b) The philosophical tension between competing design philosophies (e.g. form-follows-function vs ornament-as-meaning), OR
  c) What the existence of a convention reveals about how the field models perception or intent

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved formal tension, not yet settled in practice or theory
- T3 (graduate): requires a multi-technique comparative condition
- T2 (undergraduate): requires a specific technical condition with a named constraint or edge case`

const TRADES_CALIBRATION_BLOCK = `TRADES & VOCATIONAL CALIBRATION:
When domain is "trades-vocational", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING FAILURE MODE (Gate 2, trades-vocational domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing failure mode that could produce the same symptom and how a technician would distinguish them, OR
  b) A specific operating condition that would change how a reading or symptom is interpreted, OR
  c) A named edge-case installation or environment where the standard fix doesn't apply
✗ NOT Gate 2: "What if it breaks?" — no specific failure mode named
✗ NOT Gate 2: "What happens if it's installed wrong?" — too generic
✓ Gate 2: "What if both a loose neutral AND a failing GFCI produce the same nuisance tripping — how would a technician's meter readings separate the two?"
✓ Gate 2: "What if this circuit is in a high-humidity environment — does the standard clearance code still apply?"

STANDARDS PHILOSOPHY (Gate 3, advanced tiers: T3 licensed/professional, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a code or safety standard was set as it was (e.g. "Why does this electrical code mandate a specific clearance distance — what assumption about arc-flash risk does this encode?"), OR
  b) The philosophical tension between competing standards bodies or practices (e.g. prescriptive vs performance-based codes), OR
  c) What the existence of a standard reveals about how the trade models risk

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved standards-design tension, not yet codified
- T3 (licensed/professional): requires a code-compliance or diagnostic decision-depth condition
- T2 (apprentice/undergraduate): requires a specific mechanistic condition with a named failure mode`

const EDUCATION_CALIBRATION_BLOCK = `EDUCATION CALIBRATION:
When domain is "education", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING EXPLANATION (Gate 2, education domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing pedagogical explanation for a learning outcome and what evidence distinguishes them, OR
  b) A confounding variable that would change how an assessment result is interpreted, OR
  c) A named learner population or context edge case where the method's effect differs
✗ NOT Gate 2: "What if the method doesn't work?" — no specific mechanism named
✗ NOT Gate 2: "What helps students learn?" — too generic
✓ Gate 2: "What if both prior-knowledge gaps AND working-memory load explain the same low test score — how would a diagnostic pre-test separate the two?"
✓ Gate 2: "What if this method is used with learners who have limited first-language literacy — does the same scaffolding effect still hold?"

CURRICULUM PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a curriculum or assessment design choice was made as it was (e.g. "Why does this curriculum sequence abstraction after concrete examples — what assumption about cognitive load does this encode?"), OR
  b) The philosophical tension between competing pedagogical frameworks (e.g. behaviorist vs constructivist), OR
  c) What the existence of a standard or rubric reveals about how the field models learning

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved pedagogical tension, not yet settled empirically
- T3 (graduate): requires a multi-mechanism research-design condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or learner edge case`

const AGRICULTURE_CALIBRATION_BLOCK = `AGRICULTURE & ENVIRONMENTAL SCIENCE CALIBRATION:
When domain is "agriculture-environmental-science", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING MECHANISM (Gate 2, agriculture-environmental-science domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing ecological or agronomic mechanism that could produce the same observation and how to distinguish them, OR
  b) A confounding variable that would change how a field result is interpreted, OR
  c) A named edge-case soil, climate, or ecosystem condition where the mechanism differs
✗ NOT Gate 2: "What if the crop fails?" — no specific mechanism named
✗ NOT Gate 2: "What happens with climate change?" — too generic
✓ Gate 2: "What if both nitrogen deficiency AND root-zone waterlogging cause the same leaf yellowing — how would a soil test and drainage check separate the two?"
✓ Gate 2: "What if this practice is studied in a semi-arid ecosystem — does the same nutrient-cycling mechanism still dominate?"

SYSTEMS PHILOSOPHY (Gate 3, advanced tiers: T3 graduate, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a land-use or conservation threshold was set as it was (e.g. "Why does this policy set the buffer-zone width where it does — what assumption about runoff dynamics does this encode?"), OR
  b) The philosophical tension between competing land-management frameworks (e.g. intensive yield vs regenerative practice), OR
  c) What the existence of a threshold reveals about how the field models ecological risk

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved ecological tension, not yet settled empirically
- T3 (graduate): requires a multi-mechanism field-study condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or ecosystem edge case`

const ENTREPRENEURSHIP_CALIBRATION_BLOCK = `ENTREPRENEURSHIP CALIBRATION:
When domain is "entrepreneurship", these ADDITIONAL requirements apply on top of the base gate criteria:

COMPETING EXPLANATION (Gate 2, entrepreneurship domain):
Beyond the base Gate 2 condition, Gate 2 also requires the question to engage at least one of:
  a) A competing explanation for a venture signal (traction, churn, conversion) and what evidence distinguishes them, OR
  b) A confounding variable that would change how a growth metric is interpreted, OR
  c) A named edge-case market or customer segment where the signal behaves differently
✗ NOT Gate 2: "What if the startup fails?" — no specific mechanism named
✗ NOT Gate 2: "What makes a business succeed?" — too generic
✓ Gate 2: "What if both a pricing change AND a seasonal effect explain the same revenue dip — how would a cohort analysis separate the two?"
✓ Gate 2: "What if this channel is tested with an early-adopter segment only — does the same conversion rate hold for the mainstream market?"

STRATEGIC PHILOSOPHY (Gate 3, advanced tiers: T3 graduate/practicing, T4 doctoral/research):
Beyond the base Gate 3, for these tiers Gate 3 also benefits from engaging:
  a) WHY a strategic threshold or pivot criterion was set as it was (e.g. "Why does this framework set the pivot threshold at that retention rate — what assumption about product-market fit does this encode?"), OR
  b) The philosophical tension between competing strategic frameworks (e.g. lean iteration vs bold-bet vision), OR
  c) What the existence of a metric or milestone reveals about how the field models venture risk

Per-tier Gate 2 depth calibration:
- T4 (doctoral/research): requires a novel or unresolved strategic tension, not yet settled empirically
- T3 (graduate/practicing): requires a multi-mechanism strategic-decision condition
- T2 (undergraduate): requires a specific mechanistic condition with a named confound or segment edge case`

export const DOMAIN_CRUCIBLES: Record<Domain, DomainCrucibleConfig> = {
  medicine: {
    label: 'Medicine',
    tiers: {
      T1: { label: 'Foundational (Pre-Medical / School Biology)' },
      T2: { label: 'Undergraduate / Early Clinical', legacyExamBoards: ['mbbs-y1', 'mbbs-y2', 'neet-ug', 'usmle-1', 'general'] },
      T3: { label: 'Graduate / Specialist', legacyExamBoards: ['neet-pg', 'usmle-2', 'plab'] },
      T4: { label: 'Advanced Specialist / Near-Independent Practice', legacyExamBoards: ['neet-ss', 'usmle-3'] },
      T5: { label: 'Frontier (Post-Fellowship / Physician-Scientist)' },
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
      'T1': 'pre-medical / school biology — foundational physiology, introductory case framing',
      'T5': 'physician-scientist / post-fellowship — novel or unresolved clinical-research case',
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
      T1: { label: 'Foundational (Pre-University Physics)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Licensed / Professional Engineer' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Postdoctoral / Field-Shaping Research)' },
    },
    calibrationBlock: ENGINEERING_CALIBRATION_BLOCK,
    caseWriterRole: 'engineering educator',
    caseStyle: {
      T1: 'pre-university physics/mechanics — foundational load and force reasoning',
      T2: 'undergraduate engineering coursework — mechanism-level failure analysis, first-principles load/stress reasoning',
      T3: 'professional/licensed engineering practice — code compliance, safety margins, real deployment tradeoffs',
      T4: 'doctoral/research-level engineering — novel design tradeoffs, unresolved or emerging failure modes',
      T5: 'postdoctoral/field-shaping engineering research — unstandardized, frontier design problems',
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

  law: {
    label: 'Law',
    tiers: {
      T1: { label: 'Foundational (Pre-Law / School Civics)' },
      T2: { label: 'Undergraduate / Law School' },
      T3: { label: 'Graduate / Practicing Attorney' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Scholar / Appellate Specialist)' },
    },
    calibrationBlock: LAW_CALIBRATION_BLOCK,
    caseWriterRole: 'legal educator',
    caseStyle: {
      T1: 'pre-law civics — foundational rule and rights reasoning',
      T2: 'law school coursework — issue-spotting, rule application, distinguishing facts',
      T3: 'practicing-attorney level — case strategy, precedent conflict, jurisdictional nuance',
      T4: 'doctoral/research-level legal scholarship — unresolved doctrinal tension',
      T5: 'appellate specialist / legal scholar — frontier, unsettled questions of law',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise legal fact pattern for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: parties involved, the triggering event, 2-3 key facts relevant to the legal issue
- Do NOT include the legal conclusion or which party prevails
- Do NOT include the applicable rule's outcome
- End naturally, leaving the legal question open
- Tone: real case file or bar-exam fact pattern, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence fact pattern>", "differentials": ["<most likely legal outcome>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is a tort?"',
      2: '"Why does negligence require a duty of care before breach can even be assessed?"',
      3: '"What if the defendant owed a duty under one jurisdiction\'s test but not another\'s — how does the choice-of-law analysis resolve the conflict?"',
      4: '"Why does tort law impose liability based on foreseeability rather than strict causation alone — what assumption about fairness and deterrence does this encode?"',
    },
  },

  'computer-science': {
    label: 'Computer Science',
    tiers: {
      T1: { label: 'Foundational (Pre-University / School Coding)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Professional / Industry' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: CS_CALIBRATION_BLOCK,
    caseWriterRole: 'computer science educator',
    caseStyle: {
      T1: 'pre-university coding fundamentals — foundational logic and control-flow reasoning',
      T2: 'undergraduate CS coursework — algorithms, data structures, systems fundamentals',
      T3: 'professional/industry practice — production incidents, scale, real deployment tradeoffs',
      T4: 'doctoral/research-level computer science — novel or unresolved systems-design tension',
      T5: 'field-shaping systems research — frontier, unstandardized problems',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise software bug report or system incident case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: system/component context, an observed symptom, 2-3 key findings (logs, metrics, or repro steps)
- Do NOT include the root cause
- Do NOT include the fix
- End naturally, leaving the mechanism unexplained
- Tone: real incident report or bug ticket, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely root cause>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is a race condition?"',
      2: '"Why does an unsynchronized read-modify-write on shared state produce lost updates?"',
      3: '"What if two services retry the same request during a network partition — does the system\'s idempotency key still prevent a duplicate side effect?"',
      4: '"Why do distributed systems choose eventual consistency over strict consistency by default — what assumption about the cost of coordination does this encode?"',
    },
  },

  'physical-sciences': {
    label: 'Physical Sciences',
    tiers: {
      T1: { label: 'Foundational (School Physics / Chemistry)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Specialist' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: PHYSICAL_SCIENCES_CALIBRATION_BLOCK,
    caseWriterRole: 'physical sciences educator',
    caseStyle: {
      T1: 'school physics/chemistry — foundational mechanism and measurement reasoning',
      T2: 'undergraduate coursework — experimental design, mechanism identification',
      T3: 'graduate-level research — multi-mechanism experimental interpretation',
      T4: 'doctoral/research-level physical science — unresolved theoretical tension',
      T5: 'field-shaping physical science research — frontier, unsettled by experiment',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise experimental observation case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: experimental setup context, an observed measurement or anomaly, 2-3 key findings (data, readings, conditions)
- Do NOT include the underlying mechanism or explanation
- Do NOT include the conclusion
- End naturally, leaving the mechanism unexplained
- Tone: real lab report or research note, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely mechanism>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is entropy?"',
      2: '"Why does entropy increase in a spontaneous process — what does the second law require?"',
      3: '"What if a system exchanges both heat AND work with its surroundings simultaneously — how do calorimetry and mechanical measurements separate the two contributions to entropy change?"',
      4: '"Why does thermodynamics define entropy as a state function rather than a path-dependent quantity — what assumption about the arrow of time does this encode?"',
    },
  },

  'life-sciences': {
    label: 'Life Sciences',
    tiers: {
      T1: { label: 'Foundational (School Biology)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Specialist' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: LIFE_SCIENCES_CALIBRATION_BLOCK,
    caseWriterRole: 'life sciences educator',
    caseStyle: {
      T1: 'school biology — foundational mechanism and observation reasoning',
      T2: 'undergraduate coursework — experimental design, mechanism identification',
      T3: 'graduate-level research — multi-mechanism experimental interpretation',
      T4: 'doctoral/research-level life science — unresolved mechanistic tension',
      T5: 'field-shaping life-science research — frontier, unsettled by experiment',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise experimental observation case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: experimental/organism context, an observed phenotype or anomaly, 2-3 key findings (assay results, measurements)
- Do NOT include the underlying mechanism or explanation
- Do NOT include the conclusion
- End naturally, leaving the mechanism unexplained
- Tone: real lab report or research note, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely mechanism>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is a gene?"',
      2: '"Why does a mutation in a coding region change protein function?"',
      3: '"What if both a point mutation AND altered splicing reduce the same protein — how do sequencing and RT-PCR distinguish the two contributions?"',
      4: '"Why does the cell use a proofreading step in DNA replication rather than a faster, error-prone one — what tradeoff between speed and fidelity does this reveal about evolutionary pressure?"',
    },
  },

  mathematics: {
    label: 'Mathematics',
    tiers: {
      T1: { label: 'Foundational (School Mathematics)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Specialist' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: MATHEMATICS_CALIBRATION_BLOCK,
    caseWriterRole: 'mathematics educator',
    caseStyle: {
      T1: 'school mathematics — foundational reasoning about structure and proof',
      T2: 'undergraduate coursework — proof strategy, counterexample identification',
      T3: 'graduate-level research — multi-case proof structure',
      T4: 'doctoral/research-level mathematics — unresolved proof-strategy tension',
      T5: 'field-shaping mathematical research — frontier, unsettled in the literature',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise problem-scenario case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: the mathematical setup, a claim or conjecture being examined, 2-3 key given conditions
- Do NOT include the proof or resolution
- Do NOT include whether the claim is true or false
- End naturally, leaving the question open
- Tone: real problem set or research note, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely resolution>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is a prime number?"',
      2: '"Why does the fundamental theorem of arithmetic guarantee a unique factorization?"',
      3: '"What if a number is tested for primality using a probabilistic algorithm — does a single pass guarantee correctness, or does the failure probability compound?"',
      4: '"Why does ZFC exclude a universal set — what paradox does this axiom schema exist specifically to prevent?"',
    },
  },

  'business-economics-finance': {
    label: 'Business, Economics & Finance',
    tiers: {
      T1: { label: 'Foundational (School Economics)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Practicing' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: BUSINESS_CALIBRATION_BLOCK,
    caseWriterRole: 'business and economics educator',
    caseStyle: {
      T1: 'school economics — foundational supply/demand and incentive reasoning',
      T2: 'undergraduate coursework — market mechanism identification, case analysis',
      T3: 'graduate/practicing level — valuation, strategy, multi-mechanism interpretation',
      T4: 'doctoral/research-level economics — unresolved market-design tension',
      T5: 'field-shaping economic research — frontier, unsettled empirically',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise business or market case scenario for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: company/market context, an observed metric change or anomaly, 2-3 key findings (data points, market conditions)
- Do NOT include the underlying cause
- Do NOT include the recommended action
- End naturally, leaving the mechanism unexplained
- Tone: real business case or market report, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely cause>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is inflation?"',
      2: '"Why does an increase in the money supply tend to raise the general price level?"',
      3: '"What if both a demand shock AND a supply-chain constraint drive the same price rise — how do quantity and inventory data separate the two effects?"',
      4: '"Why does monetary policy target a specific inflation rate rather than zero — what assumption about wage rigidity and growth does this threshold encode?"',
    },
  },

  humanities: {
    label: 'Humanities',
    tiers: {
      T1: { label: 'Foundational (School History / Literature)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Specialist' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Scholarship)' },
    },
    calibrationBlock: HUMANITIES_CALIBRATION_BLOCK,
    caseWriterRole: 'humanities educator',
    caseStyle: {
      T1: 'school history/literature — foundational interpretive reasoning',
      T2: 'undergraduate coursework — interpretation, contextual reading',
      T3: 'graduate-level scholarship — multi-source comparative interpretation',
      T4: 'doctoral/research-level humanities — unresolved interpretive tension',
      T5: 'field-shaping humanities scholarship — frontier, unsettled in the literature',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise historical or textual scenario for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: the source or event context, an observed detail or tension, 2-3 key contextual facts
- Do NOT include the interpretation or conclusion
- Do NOT include which explanation is correct
- End naturally, leaving the interpretation open
- Tone: real primary-source excerpt or case study, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely interpretation>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is the Renaissance?"',
      2: '"Why did the printing press accelerate the spread of Reformation ideas?"',
      3: '"What if this event is explained by both economic pressure AND ideological shift — how do primary sources weigh the two causes against each other?"',
      4: '"Why does this historical reading privilege authorial intent over reader-response — what assumption about meaning and evidence does this interpretive choice encode?"',
    },
  },

  'social-sciences': {
    label: 'Social Sciences',
    tiers: {
      T1: { label: 'Foundational (School Civics / Psychology)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Specialist' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: SOCIAL_SCIENCES_CALIBRATION_BLOCK,
    caseWriterRole: 'social sciences educator',
    caseStyle: {
      T1: 'school civics/psychology — foundational behavioral reasoning',
      T2: 'undergraduate coursework — study design, mechanism identification',
      T3: 'graduate-level research — multi-mechanism research-design interpretation',
      T4: 'doctoral/research-level social science — unresolved theoretical tension',
      T5: 'field-shaping social science research — frontier, unsettled empirically',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise behavioral or social-study scenario for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: study/population context, an observed behavioral result or anomaly, 2-3 key findings (data, survey results, conditions)
- Do NOT include the underlying explanation
- Do NOT include the conclusion
- End naturally, leaving the mechanism unexplained
- Tone: real research note or case study, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely explanation>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is cognitive dissonance?"',
      2: '"Why does holding two conflicting beliefs create psychological discomfort that motivates belief change?"',
      3: '"What if both social desirability bias AND selection bias inflate the same reported effect — how would a randomized design separate the two contributions?"',
      4: '"Why does this model treat institutions as constraints on behavior rather than as actors themselves — what assumption about agency and structure does this encode?"',
    },
  },

  'arts-design': {
    label: 'Arts & Design',
    tiers: {
      T1: { label: 'Foundational (School Art / Design)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Practicing' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Practice)' },
    },
    calibrationBlock: ARTS_DESIGN_CALIBRATION_BLOCK,
    caseWriterRole: 'arts and design educator',
    caseStyle: {
      T1: 'school art/design — foundational formal and technical reasoning',
      T2: 'undergraduate coursework — technique identification, composition analysis',
      T3: 'graduate/practicing level — multi-technique comparative critique',
      T4: 'doctoral/research-level arts and design — unresolved formal tension',
      T5: 'field-shaping design practice — frontier, unsettled in theory or practice',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise critique scenario for a work or design for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: the work/medium context, an observed formal effect, 2-3 key technical details
- Do NOT include the interpretation or critical judgment
- Do NOT include which technique explains the effect
- End naturally, leaving the technique unexplained
- Tone: real critique note or design review, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely technique>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is negative space?"',
      2: '"Why does negative space create a sense of focal hierarchy in a composition?"',
      3: '"What if both color contrast AND negative space create the same focal hierarchy — how would removing one in isolation reveal each element\'s contribution?"',
      4: '"Why does this grid system fix a baseline rhythm rather than allow free placement — what assumption about reading behavior and consistency does this convention encode?"',
    },
  },

  'trades-vocational': {
    label: 'Trades & Vocational',
    tiers: {
      T1: { label: 'Foundational (Pre-Apprentice / School Shop)' },
      T2: { label: 'Apprentice / Undergraduate' },
      T3: { label: 'Licensed / Professional' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Master Tradesperson / Standards-Setting)' },
    },
    calibrationBlock: TRADES_CALIBRATION_BLOCK,
    caseWriterRole: 'trades and vocational educator',
    caseStyle: {
      T1: 'pre-apprentice / school shop — foundational tool and safety reasoning',
      T2: 'apprentice-level coursework — diagnostic fundamentals, named failure modes',
      T3: 'licensed/professional practice — code compliance, real diagnostic tradeoffs',
      T4: 'doctoral/research-level trades — unresolved standards-design tension',
      T5: 'master tradesperson / standards-setting — frontier, not yet codified',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise field diagnostic case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: installation/system context, an observed symptom, 2-3 key findings (readings, inspection notes)
- Do NOT include the root cause
- Do NOT include the fix
- End naturally, leaving the mechanism unexplained
- Tone: real service call or inspection report, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely cause>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is a ground fault?"',
      2: '"Why does a ground fault trip a GFCI by detecting a current imbalance?"',
      3: '"What if both a loose neutral AND a failing GFCI produce the same nuisance tripping — how would a technician\'s meter readings separate the two causes?"',
      4: '"Why does this electrical code mandate a specific clearance distance rather than leave it to installer judgment — what assumption about arc-flash risk does this encode?"',
    },
  },

  education: {
    label: 'Education',
    tiers: {
      T1: { label: 'Foundational (Pre-Service / School Observation)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Practicing Educator' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: EDUCATION_CALIBRATION_BLOCK,
    caseWriterRole: 'education studies educator',
    caseStyle: {
      T1: 'pre-service / school observation — foundational pedagogical reasoning',
      T2: 'undergraduate coursework — pedagogical mechanism identification',
      T3: 'graduate/practicing level — multi-mechanism classroom research interpretation',
      T4: 'doctoral/research-level education — unresolved pedagogical tension',
      T5: 'field-shaping education research — frontier, unsettled empirically',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise classroom or learner-outcome scenario for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: classroom/learner context, an observed learning outcome or anomaly, 2-3 key findings (assessment data, observations)
- Do NOT include the underlying explanation
- Do NOT include the recommended intervention
- End naturally, leaving the mechanism unexplained
- Tone: real classroom research note, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely explanation>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is scaffolding in teaching?"',
      2: '"Why does reducing support gradually help a learner internalize a skill?"',
      3: '"What if both prior-knowledge gaps AND working-memory load explain the same low test score — how would a diagnostic pre-test separate the two contributions?"',
      4: '"Why does this curriculum sequence abstraction after concrete examples rather than the reverse — what assumption about cognitive load does this design choice encode?"',
    },
  },

  'agriculture-environmental-science': {
    label: 'Agriculture & Environmental Science',
    tiers: {
      T1: { label: 'Foundational (School Environmental Science)' },
      T2: { label: 'Undergraduate' },
      T3: { label: 'Graduate / Specialist' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Field-Shaping Research)' },
    },
    calibrationBlock: AGRICULTURE_CALIBRATION_BLOCK,
    caseWriterRole: 'agriculture and environmental science educator',
    caseStyle: {
      T1: 'school environmental science — foundational ecological reasoning',
      T2: 'undergraduate coursework — agronomic/ecological mechanism identification',
      T3: 'graduate-level research — multi-mechanism field-study interpretation',
      T4: 'doctoral/research-level environmental science — unresolved ecological tension',
      T5: 'field-shaping environmental research — frontier, unsettled empirically',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise field observation case for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: field/ecosystem context, an observed anomaly, 2-3 key findings (soil/water tests, measurements, conditions)
- Do NOT include the underlying cause
- Do NOT include the recommended remediation
- End naturally, leaving the mechanism unexplained
- Tone: real field report or research note, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely cause>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is soil erosion?"',
      2: '"Why does removing ground cover accelerate soil erosion during rainfall?"',
      3: '"What if both nitrogen deficiency AND root-zone waterlogging cause the same leaf yellowing — how would a soil test and drainage check separate the two causes?"',
      4: '"Why does this conservation policy set the buffer-zone width where it does rather than a wider or narrower margin — what assumption about runoff dynamics does this threshold encode?"',
    },
  },

  entrepreneurship: {
    label: 'Entrepreneurship',
    tiers: {
      T1: { label: 'Foundational (School / Early Exposure)' },
      T2: { label: 'Undergraduate / First-Time Founder' },
      T3: { label: 'Graduate / Experienced Founder' },
      T4: { label: 'Doctoral / Research' },
      T5: { label: 'Frontier (Serial Founder / Field-Shaping Research)' },
    },
    calibrationBlock: ENTREPRENEURSHIP_CALIBRATION_BLOCK,
    caseWriterRole: 'entrepreneurship educator',
    caseStyle: {
      T1: 'school / early exposure — foundational venture reasoning',
      T2: 'first-time founder level — traction-signal identification, basic metrics',
      T3: 'experienced founder / graduate level — multi-mechanism strategic-decision interpretation',
      T4: 'doctoral/research-level entrepreneurship — unresolved strategic tension',
      T5: 'serial founder / field-shaping research — frontier, unsettled empirically',
    },
    defaultCaseStyleKey: 'T2',
    caseInstructions: (topic: string) => `Write a concise startup/venture scenario for the topic: "${topic}".

Rules:
- 3-4 sentences only
- Include: venture/market context, an observed metric change or anomaly, 2-3 key findings (data points, customer signals)
- Do NOT include the underlying cause
- Do NOT include the recommended action
- End naturally, leaving the mechanism unexplained
- Tone: real founder update or case study, not textbook prose

Return JSON:
{"vignette": "<3-4 sentence case>", "differentials": ["<most likely cause>", "<alternative 1>", "<alternative 2>"]}`,
    layerExamples: {
      1: '"What is product-market fit?"',
      2: '"Why does high retention signal stronger product-market fit than high signups alone?"',
      3: '"What if both a pricing change AND a seasonal effect explain the same revenue dip — how would a cohort analysis separate the two contributions?"',
      4: '"Why does this framework set the pivot threshold at that specific retention rate rather than a different one — what assumption about product-market fit does this threshold encode?"',
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

/** Resolve the caseStyle key: ExamBoard takes priority for medicine (legacy behavior), else Tier,
 *  else the domain default. Medicine's T1/T5 have no examBoard, so they fall through to tier. */
export function resolveCaseStyleKey(domain: Domain, examBoard?: ExamBoard, tier?: Tier): string {
  const config = DOMAIN_CRUCIBLES[domain]
  if (domain === 'medicine' && examBoard) return examBoard
  return (tier ?? config.defaultCaseStyleKey)
}
