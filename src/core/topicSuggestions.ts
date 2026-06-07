import type { AppMode, ExamBoard } from './types'

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

export function getSuggestions(
  appMode: AppMode,
  examBoard?: ExamBoard,
  count = 8
): TopicSuggestion[] {
  if (appMode === 'clinical') {
    const board = examBoard ?? 'general'
    const specific = CLINICAL_SUGGESTIONS[board] ?? CLINICAL_SUGGESTIONS['general'] ?? []
    return specific.slice(0, count)
  }
  // Shuffle and pick from epistemic
  const shuffled = [...EPISTEMIC_SUGGESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
