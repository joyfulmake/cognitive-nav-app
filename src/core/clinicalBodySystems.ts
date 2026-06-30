export type BodySystem =
  | 'Cardiovascular'
  | 'Respiratory'
  | 'Gastrointestinal'
  | 'Renal & Urology'
  | 'Neurology'
  | 'Endocrine & Metabolism'
  | 'Haematology & Oncology'
  | 'Musculoskeletal'
  | 'Infectious Disease'
  | 'Reproductive & Obs-Gyn'
  | 'Dermatology'
  | 'Psychiatry'
  | 'General'

export const BODY_SYSTEMS: BodySystem[] = [
  'Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Renal & Urology',
  'Neurology', 'Endocrine & Metabolism', 'Haematology & Oncology',
  'Musculoskeletal', 'Infectious Disease', 'Reproductive & Obs-Gyn',
  'Dermatology', 'Psychiatry', 'General',
]

export const BODY_SYSTEM_COLORS: Record<BodySystem, { color: string; bg: string }> = {
  'Cardiovascular':         { color: '#c43d0f', bg: '#fff5f0' },
  'Respiratory':            { color: '#1a5c8a', bg: '#edf4fa' },
  'Gastrointestinal':       { color: '#7c5c00', bg: '#fffbeb' },
  'Renal & Urology':        { color: '#1a6b3a', bg: '#f0fff5' },
  'Neurology':              { color: '#7c2d96', bg: '#faf0ff' },
  'Endocrine & Metabolism': { color: '#b86a14', bg: '#fff8f0' },
  'Haematology & Oncology': { color: '#8b1a1a', bg: '#fff0f0' },
  'Musculoskeletal':        { color: '#4a6a14', bg: '#f5fff0' },
  'Infectious Disease':     { color: '#006b6b', bg: '#f0ffff' },
  'Reproductive & Obs-Gyn': { color: '#6b2d5a', bg: '#fff0f8' },
  'Dermatology':            { color: '#8a5a00', bg: '#fffaf0' },
  'Psychiatry':             { color: '#4a4a8a', bg: '#f0f0ff' },
  'General':                { color: '#6a6a6a', bg: '#f5f5f5' },
}

export function classifyTopicToSystem(topic: string): BodySystem {
  const t = topic.toLowerCase()
  if (/heart|cardiac|coronary|atrial|ventricular|myocardial|aortic|hypertens|blood pressure|arrhythmia|fibrillation|angina|pci|bypass|stemi|nstemi|\baf\b|\bmi\b|heart failure|valv|chf|ecg|ekg/.test(t)) return 'Cardiovascular'
  if (/lung|respirat|asthma|copd|pneumon|pulmonar|ventilat|ards|pleural|bronch|trachea|dyspnea|wheez|oxygen saturation|spirometr/.test(t)) return 'Respiratory'
  if (/liver|hepat|gastro|bowel|intestin|colon|pancrea|bile|bilirubin|jaundice|ibd|crohn|ulcerative|gerd|peptic|ulcer|gallbladder|appendic|periton|gi bleed|upper gi|lower gi/.test(t)) return 'Gastrointestinal'
  if (/renal|kidney|nephro|urolog|urine|urinar|creatinine|\bgfr\b|dialysis|renal replace|aki|ckd|prostat|bladder|ureter|nephr/.test(t)) return 'Renal & Urology'
  if (/neuro|brain|stroke|seizure|epilepsy|dementia|alzheimer|parkinson|multiple sclerosis|headache|migraine|\bcns\b|cortex|basal ganglia|cerebell|encephal|myasthenia|neuropath/.test(t)) return 'Neurology'
  if (/diabet|thyroid|hormone|endocrin|insulin|glucose|adrenal|cortisol|pituitary|metabol|obesity|lipid|cholesterol|hba1c|ketoacidosis|hypoglycaem/.test(t)) return 'Endocrine & Metabolism'
  if (/blood|anaemia|anemia|haematol|hematol|leukemia|lymphoma|oncolog|cancer|tumour|tumor|coagulat|platelet|iron deficienc|sickle|malignancy|chemotherap/.test(t)) return 'Haematology & Oncology'
  if (/bone|joint|muscle|arthrit|fracture|orthop|ligament|tendon|rheumat|lupus|gout|osteoporosis|back pain|spondyl|osteoarthrit/.test(t)) return 'Musculoskeletal'
  if (/infect|sepsis|bacteria|viral|antibiotic|antimicrobial|\bhiv\b|tuberculosis|malaria|fungal|parasite|immunodeficien|fever of unknown|antimicrobial resist/.test(t)) return 'Infectious Disease'
  if (/pregnan|obstet|gynaecol|gynecol|menstrual|uterus|ovarian|cervical|maternal|fetal|eclampsia|fertility|contraception|endometrios/.test(t)) return 'Reproductive & Obs-Gyn'
  if (/skin|derm|rash|eczema|psoriasis|melanoma|acne|wound healing|pruritus|urticaria/.test(t)) return 'Dermatology'
  if (/psych|depression|anxiety|schizophren|bipolar|mental health|cognitive behav|behaviour|addiction|ocd|ptsd|personality disorder/.test(t)) return 'Psychiatry'
  return 'General'
}
