import type { AppMode, ExamBoard, Domain, Tier } from './types'

export interface TopicSuggestion {
  label: string
  domain?: string
}

export const EPISTEMIC_SUGGESTIONS: TopicSuggestion[] = [
  // Physics & Cosmology
  { label: 'Quantum entanglement', domain: 'Physics' },
  { label: 'Black holes and information paradox', domain: 'Physics' },
  { label: 'Wave-particle duality', domain: 'Physics' },
  { label: 'Entropy and the arrow of time', domain: 'Physics' },
  // Computer Science
  { label: 'TCP/IP reliability', domain: 'CS' },
  { label: 'Public-key cryptography', domain: 'CS' },
  { label: 'Neural network backpropagation', domain: 'CS' },
  { label: "Dijkstra's algorithm", domain: 'CS' },
  { label: 'Garbage collection in memory management', domain: 'CS' },
  // Biology
  { label: 'DNA replication fidelity', domain: 'Biology' },
  { label: 'Photosynthesis electron transport chain', domain: 'Biology' },
  { label: 'CRISPR-Cas9 mechanism', domain: 'Biology' },
  { label: 'Evolution and natural selection', domain: 'Biology' },
  { label: 'Mitochondrial membrane potential', domain: 'Biology' },
  // Economics
  { label: 'Keynesian multiplier effect', domain: 'Economics' },
  { label: 'Nash equilibrium in game theory', domain: 'Economics' },
  { label: 'Inflation and monetary policy', domain: 'Economics' },
  { label: 'Supply chain bullwhip effect', domain: 'Economics' },
  // Math & Logic
  { label: "Gödel's incompleteness theorems", domain: 'Mathematics' },
  { label: 'Fourier transform', domain: 'Mathematics' },
  { label: 'Bayesian inference', domain: 'Mathematics' },
  { label: 'P vs NP problem', domain: 'Mathematics' },
  // Philosophy & Cognition
  { label: 'Consciousness and qualia', domain: 'Philosophy' },
  { label: 'Free will and determinism', domain: 'Philosophy' },
  { label: 'Emergence in complex systems', domain: 'Philosophy' },
  // Chemistry
  { label: 'Electrochemical cell potential', domain: 'Chemistry' },
  { label: 'Enzyme catalysis and transition states', domain: 'Chemistry' },
]

export const CLINICAL_SUGGESTIONS: Partial<Record<ExamBoard, TopicSuggestion[]>> = {
  'neet-ug': [
    { label: 'Jaundice pathophysiology' },
    { label: 'Hypertension mechanisms' },
    { label: 'Diabetes mellitus type 2' },
    { label: 'Acute asthma management' },
    { label: 'Iron deficiency anaemia' },
    { label: 'Thyroid hormone synthesis' },
    { label: 'Renal tubular acidosis' },
    { label: 'Acute appendicitis' },
  ],
  'neet-pg': [
    { label: 'Acute MI pathophysiology' },
    { label: 'Sepsis and SIRS criteria' },
    { label: 'Acute pancreatitis' },
    { label: 'Stroke thrombolysis window' },
    { label: 'Acute kidney injury staging' },
    { label: 'Diabetic ketoacidosis' },
    { label: 'Upper GI bleed management' },
    { label: 'Pulmonary embolism diagnosis' },
  ],
  'neet-ss': [
    { label: 'Coronary artery bypass vs PCI' },
    { label: 'Liver transplant indications' },
    { label: 'Renal replacement therapy timing' },
    { label: 'Oncological surgical margins' },
    { label: 'Aortic stenosis surgical timing' },
  ],
  'usmle-1': [
    { label: 'Enzyme kinetics and Michaelis-Menten' },
    { label: 'Membrane transport mechanisms' },
    { label: 'Cell cycle checkpoints' },
    { label: 'Complement pathway activation' },
    { label: 'Blood coagulation cascade' },
    { label: 'Oxidative phosphorylation' },
    { label: 'Glycolysis regulation' },
    { label: 'Immune tolerance mechanisms' },
  ],
  'usmle-2': [
    { label: 'Heart failure pharmacotherapy' },
    { label: 'Community-acquired pneumonia' },
    { label: 'Atrial fibrillation rate vs rhythm' },
    { label: 'Preeclampsia pathophysiology' },
    { label: 'Inflammatory bowel disease' },
    { label: 'Meningitis empirical treatment' },
  ],
  'usmle-3': [
    { label: 'Septic shock resuscitation targets' },
    { label: 'Ventilator-associated pneumonia prevention' },
    { label: 'Anti-epileptic drug selection' },
    { label: 'Transfusion thresholds in ICU' },
    { label: 'ARDS lung-protective ventilation' },
  ],
  'plab': [
    { label: 'NICE hypertension management' },
    { label: 'Atrial fibrillation NICE pathway' },
    { label: 'Depression treatment escalation' },
    { label: 'Chest pain NICE guidelines' },
    { label: 'Antibiotic stewardship UK' },
  ],
  'mbbs-y1': [
    { label: 'Cardiac action potential phases' },
    { label: 'Renal tubular reabsorption' },
    { label: 'Autonomic neurotransmitters' },
    { label: 'Blood coagulation cascade' },
    { label: 'Skeletal muscle contraction mechanism' },
    { label: 'Acid-base balance physiology' },
  ],
  'mbbs-y2': [
    { label: 'Hepatic drug metabolism CYP450' },
    { label: 'Inflammatory mediators' },
    { label: 'Renal clearance and GFR' },
    { label: 'Hormone receptor signalling' },
    { label: 'Wound healing phases' },
    { label: 'Tumour suppressor mechanisms' },
  ],
  'general': [
    { label: 'Jaundice pathophysiology' },
    { label: 'Hypertension mechanisms' },
    { label: 'Acute MI management' },
    { label: 'Sepsis pathophysiology' },
    { label: 'Antibiotic resistance mechanisms' },
    { label: 'Pain pathways and analgesia' },
  ],
}

// Provisional placeholders for domains beyond Medicine — not tier-specific yet.
// Pending: universal topic bank per domain × tier (PRODUCT_ROADMAP.md Release 4.0).
const DOMAIN_SUGGESTIONS: Partial<Record<Domain, TopicSuggestion[]>> = {
  engineering: [
    { label: 'Cantilever beam deflection under load' },
    { label: 'Pressure vessel safety factor design' },
    { label: 'Fatigue failure in rotating shafts' },
    { label: 'Heat exchanger thermal efficiency' },
    { label: 'Control system feedback stability' },
    { label: 'Composite material delamination' },
  ],
  law: [
    { label: 'Negligence and duty of care' },
    { label: 'Offer, acceptance and consideration' },
    { label: 'Search and seizure exceptions' },
    { label: 'Precedent and stare decisis' },
    { label: 'Contract breach and remedies' },
    { label: 'Due process and equal protection' },
  ],
  'computer-science': [
    { label: 'Race conditions in concurrent systems' },
    { label: 'CAP theorem tradeoffs' },
    { label: 'Hash table collision handling' },
    { label: 'Garbage collection strategies' },
    { label: 'Distributed consensus (Raft/Paxos)' },
    { label: 'Cache invalidation strategies' },
  ],
  'physical-sciences': [
    { label: 'Entropy and the second law of thermodynamics' },
    { label: 'Wave-particle duality' },
    { label: 'Acid-base equilibrium' },
    { label: 'Electromagnetic induction' },
    { label: 'Plate tectonics and continental drift' },
    { label: 'Reaction rate kinetics' },
  ],
  'life-sciences': [
    { label: 'DNA replication fidelity' },
    { label: 'Natural selection and fitness' },
    { label: 'Enzyme kinetics and inhibition' },
    { label: 'Photosynthesis electron transport chain' },
    { label: 'Gene regulation and expression' },
    { label: 'Population genetics and drift' },
  ],
  mathematics: [
    { label: 'Fundamental theorem of arithmetic' },
    { label: "Gödel's incompleteness theorems" },
    { label: 'Mean value theorem' },
    { label: 'Eigenvalues and eigenvectors' },
    { label: 'Proof by induction' },
    { label: 'P vs NP problem' },
  ],
  'business-economics-finance': [
    { label: 'Supply and demand equilibrium' },
    { label: 'Efficient market hypothesis' },
    { label: 'Compound interest and time value of money' },
    { label: 'Market segmentation strategy' },
    { label: 'Inflation and monetary policy' },
    { label: 'Game theory in pricing strategy' },
  ],
  humanities: [
    { label: 'Causes of the French Revolution' },
    { label: 'Existentialism and authenticity' },
    { label: 'Unreliable narration in fiction' },
    { label: 'The printing press and the Reformation' },
    { label: 'Colonialism and historiography' },
    { label: 'Structuralism vs post-structuralism' },
  ],
  'social-sciences': [
    { label: 'Cognitive dissonance theory' },
    { label: 'Social identity and in-group bias' },
    { label: 'Institutional vs individual explanations' },
    { label: 'Operant conditioning' },
    { label: 'Political polarization mechanisms' },
    { label: 'Social capital and trust networks' },
  ],
  'arts-design': [
    { label: 'Composition and the rule of thirds' },
    { label: 'Color theory and contrast' },
    { label: 'Typographic grid systems' },
    { label: 'Form follows function' },
    { label: 'Negative space in composition' },
    { label: 'Golden ratio in design' },
  ],
  'trades-vocational': [
    { label: 'GFCI nuisance tripping diagnosis' },
    { label: 'Water hammer in plumbing systems' },
    { label: 'HVAC refrigerant cycle troubleshooting' },
    { label: 'Torque specifications and fastener failure' },
    { label: 'Welding penetration defects' },
    { label: 'Electrical grounding and bonding' },
  ],
  education: [
    { label: 'Scaffolding and the zone of proximal development' },
    { label: 'Working memory load in instruction' },
    { label: 'Formative vs summative assessment' },
    { label: 'Spaced repetition and retention' },
    { label: 'Differentiated instruction design' },
    { label: 'Growth mindset interventions' },
  ],
  'agriculture-environmental-science': [
    { label: 'Nitrogen cycle in soil fertility' },
    { label: 'Crop rotation and pest management' },
    { label: 'Watershed runoff and buffer zones' },
    { label: 'Soil erosion and ground cover' },
    { label: 'Carbon sequestration in agriculture' },
    { label: 'Invasive species ecosystem impact' },
  ],
  entrepreneurship: [
    { label: 'Product-market fit signals' },
    { label: 'Customer acquisition cost vs lifetime value' },
    { label: 'Churn and retention cohort analysis' },
    { label: 'Pivot vs persevere decision criteria' },
    { label: 'Pricing strategy experimentation' },
    { label: 'Network effects and defensibility' },
  ],
}

export function getSuggestions(
  appMode: AppMode,
  examBoard?: ExamBoard,
  count = 8,
  domain?: Domain,
  _tier?: Tier
): TopicSuggestion[] {
  if (appMode === 'clinical' && domain && domain !== 'medicine' && DOMAIN_SUGGESTIONS[domain]) {
    return DOMAIN_SUGGESTIONS[domain]!.slice(0, count)
  }
  if (appMode === 'clinical') {
    const board = examBoard ?? 'general'
    const specific = CLINICAL_SUGGESTIONS[board] ?? CLINICAL_SUGGESTIONS['general'] ?? []
    return specific.slice(0, count)
  }
  // Shuffle and pick from epistemic
  const shuffled = [...EPISTEMIC_SUGGESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
