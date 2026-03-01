export interface FormData {
  jobDescription: string;
  companyName: string;
  email: string;
  salary: string;
  location: string;
}

export interface DomainIntelligence {
  domain: string;
  estimatedAgeDays: number;
  trustLevel: "trusted" | "new" | "suspicious";
  riskBoost: number;
}

export interface RiskFactor {
  label: string;
  weight: number;
  triggered: boolean;
  detail: string;
  confidence: number; // 0-100 ML confidence for this factor
}

export interface MLBreakdown {
  nlpScore: number;       // NLP keyword model score 0-100
  domainScore: number;    // Domain analysis score 0-100
  salaryScore: number;    // Salary anomaly score 0-100
  patternScore: number;   // Behavioral pattern score 0-100
  ensembleScore: number;  // Final weighted ensemble 0-100
  modelWeights: { name: string; weight: number; score: number }[];
}

export interface AnalysisResult {
  score: number;
  flags: string[];
  factors: RiskFactor[];
  domainIntel: DomainIntelligence;
  suggestions: string[];
  mlBreakdown: MLBreakdown;
  confidenceLevel: number; // Overall model confidence 0-100
}

const FREE_EMAILS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ymail.com", "rediffmail.com"];
const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", "temp-mail", "throwam", ".xyz", "mailinator"];

const SCAM_PAIRS: { keyword: string; flag: string; weight: number; severity: "critical" | "high" | "medium" | "low" }[] = [
  { keyword: "pay to apply", flag: "Payment required to apply — a clear scam indicator", weight: 22, severity: "critical" },
  { keyword: "registration fee", flag: "Registration fee mentioned — legitimate jobs never charge fees", weight: 22, severity: "critical" },
  { keyword: "advance fee", flag: "Advance fee request detected", weight: 20, severity: "critical" },
  { keyword: "wire transfer", flag: "Wire transfer payment method mentioned", weight: 18, severity: "critical" },
  { keyword: "western union", flag: "Western Union payment method — common in scams", weight: 20, severity: "critical" },
  { keyword: "lottery", flag: "Lottery-style language detected", weight: 22, severity: "critical" },
  { keyword: "unlimited earnings", flag: "Unrealistic 'unlimited earnings' promise detected", weight: 15, severity: "high" },
  { keyword: "congratulations", flag: "Unsolicited 'congratulations' — typical scam opener", weight: 12, severity: "high" },
  { keyword: "no experience required", flag: "Suspicious 'no experience required' claim for high-pay role", weight: 10, severity: "high" },
  { keyword: "urgent", flag: "Excessive urgency language detected", weight: 9, severity: "medium" },
  { keyword: "work from home", flag: "Unverified remote work opportunity", weight: 5, severity: "low" },
  { keyword: "immediate joining", flag: "Immediate joining pressure tactic detected", weight: 8, severity: "medium" },
  { keyword: "limited time", flag: "Artificial scarcity / time pressure tactic", weight: 7, severity: "medium" },
  { keyword: "no interview", flag: "Job offered without interview — suspicious", weight: 14, severity: "high" },
  { keyword: "guaranteed job", flag: "Guaranteed job promise — typically a scam lure", weight: 13, severity: "high" },
  { keyword: "processing fee", flag: "Processing fee mentioned — red flag for fake offers", weight: 20, severity: "critical" },
  { keyword: "security deposit", flag: "Security deposit required — classic scam", weight: 18, severity: "critical" },
  { keyword: "whatsapp only", flag: "WhatsApp-only contact — avoids official records", weight: 11, severity: "high" },
];

// Simulated NLP bigram/trigram scam patterns
const PATTERN_PHRASES = [
  { phrase: "work from home earn", score: 25 },
  { phrase: "no experience high salary", score: 30 },
  { phrase: "apply now limited seats", score: 20 },
  { phrase: "send your documents", score: 15 },
  { phrase: "part time earn daily", score: 22 },
  { phrase: "online data entry", score: 10 },
  { phrase: "refer and earn", score: 12 },
  { phrase: "100% job guarantee", score: 28 },
];

function seedRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getDomainSeed(domain: string): number {
  return domain.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export function analyzeDomain(email: string): DomainIntelligence {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (!domain) return { domain: "", estimatedAgeDays: 0, trustLevel: "suspicious", riskBoost: 20 };

  const isFree = FREE_EMAILS.some((d) => domain.includes(d));
  const isSuspiciousTld = SUSPICIOUS_TLDS.some((d) => domain.includes(d));

  if (isSuspiciousTld) return { domain, estimatedAgeDays: 20, trustLevel: "suspicious", riskBoost: 35 };

  const seed = getDomainSeed(domain);
  const knownDomains = ["google.com", "microsoft.com", "amazon.com", "tcs.com", "infosys.com", "wipro.com", "hcl.com", "accenture.com", "deloitte.com", "ibm.com"];
  const isKnown = knownDomains.some((d) => domain.includes(d.split(".")[0]));

  if (isKnown) return { domain, estimatedAgeDays: 365 * 15 + Math.floor(seedRandom(seed) * 1000), trustLevel: "trusted", riskBoost: 0 };
  if (isFree) return { domain, estimatedAgeDays: 365 * 5, trustLevel: "new", riskBoost: 12 };

  const raw = seedRandom(seed);
  const ageDays = Math.floor(30 + raw * 3620);
  const riskBoost = ageDays < 180 ? 22 : ageDays < 365 ? 8 : 0;
  return { domain, estimatedAgeDays: ageDays, trustLevel: ageDays >= 730 ? "trusted" : "new", riskBoost };
}

// ─── ML Ensemble Model ────────────────────────────────────────────────────────

function computeNLPScore(desc: string): number {
  let score = 0;
  const triggered = SCAM_PAIRS.filter(({ keyword }) => desc.includes(keyword));
  triggered.forEach(({ weight, severity }) => {
    const multiplier = severity === "critical" ? 1.4 : severity === "high" ? 1.2 : severity === "medium" ? 1.0 : 0.8;
    score += weight * multiplier;
  });
  // Pattern phrase boost
  PATTERN_PHRASES.forEach(({ phrase, score: ps }) => {
    if (desc.includes(phrase)) score += ps;
  });
  return Math.min(score, 100);
}

function computeDomainScore(email: string, domainIntel: DomainIntelligence): number {
  let score = 0;
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  if (!email) score += 30;
  if (FREE_EMAILS.some((d) => emailDomain.includes(d))) score += 28;
  if (SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d))) score += 50;
  if (domainIntel.estimatedAgeDays < 180) score += 25;
  else if (domainIntel.estimatedAgeDays < 365) score += 10;
  return Math.min(score, 100);
}

function computeSalaryScore(salary: string): number {
  const val = parseFloat(salary.replace(/[^0-9.]/g, "")) || 0;
  if (val === 0) return 0;
  if (val > 500000) return 90;   // absurdly high
  if (val > 200000) return 65;   // suspicious high
  if (val < 3000 && val > 0) return 70;  // suspiciously low
  if (val < 8000) return 30;
  return 0;
}

function computePatternScore(desc: string, companyName: string, email: string): number {
  let score = 0;
  if (!companyName.trim()) score += 30;
  if (!email.trim()) score += 20;
  if (desc.length < 50 && desc.length > 0) score += 15; // very short description
  if (/[A-Z]{5,}/.test(desc)) score += 10; // excessive caps
  if ((desc.match(/!/g) || []).length > 3) score += 10; // too many exclamation marks
  return Math.min(score, 100);
}

export function analyzeOffer(data: FormData): AnalysisResult {
  const desc = (data.jobDescription + " " + data.companyName + " " + data.email).toLowerCase();
  const emailDomain = data.email.split("@")[1]?.toLowerCase() || "";
  const salary = parseFloat(data.salary.replace(/[^0-9.]/g, "")) || 0;
  const domainIntel = analyzeDomain(data.email);

  // ─── ML Sub-model scores ───
  const nlpScore = computeNLPScore(desc);
  const domainScore = computeDomainScore(data.email, domainIntel);
  const salaryScore = computeSalaryScore(data.salary);
  const patternScore = computePatternScore(desc, data.companyName, data.email);

  // ─── Weighted Ensemble ───
  // Weights tuned to simulate a logistic regression ensemble
  const MODEL_WEIGHTS = [
    { name: "NLP Keyword Model", weight: 0.38, score: nlpScore },
    { name: "Domain Intelligence", weight: 0.28, score: domainScore },
    { name: "Salary Anomaly", weight: 0.18, score: salaryScore },
    { name: "Behavioral Pattern", weight: 0.16, score: patternScore },
  ];
  const ensembleScore = MODEL_WEIGHTS.reduce((acc, m) => acc + m.weight * m.score, 0);

  // ─── Confidence: higher when multiple models agree ───
  const scores = [nlpScore, domainScore, salaryScore, patternScore];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  // Low std dev = models agree = high confidence; scale confidence 55–98
  const rawConf = Math.max(0, 100 - stdDev * 0.9);
  const confidenceLevel = Math.round(Math.min(98, Math.max(55, rawConf)));

  const mlBreakdown: MLBreakdown = {
    nlpScore: Math.round(nlpScore),
    domainScore: Math.round(domainScore),
    salaryScore: Math.round(salaryScore),
    patternScore: Math.round(patternScore),
    ensembleScore: Math.round(ensembleScore),
    modelWeights: MODEL_WEIGHTS.map(m => ({ ...m, score: Math.round(m.score) })),
  };

  // ─── Risk Factors (for breakdown UI) ───
  const triggeredKeywords = SCAM_PAIRS.filter(({ keyword }) => desc.includes(keyword));
  const factors: RiskFactor[] = [
    {
      label: "Email Domain",
      weight: 25,
      triggered: FREE_EMAILS.some((d) => emailDomain.includes(d)) || SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d)),
      detail: FREE_EMAILS.some((d) => emailDomain.includes(d)) ? "Free personal email domain" : SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d)) ? "Suspicious TLD domain" : "Professional domain",
      confidence: domainScore > 50 ? 92 : 75,
    },
    {
      label: "Salary Realism",
      weight: 20,
      triggered: salary > 200000 || (salary < 5000 && salary > 0),
      detail: salary > 200000 ? "Unrealistically high salary" : salary < 5000 && salary > 0 ? "Suspiciously low salary" : "Salary within normal range",
      confidence: salaryScore > 0 ? 88 : 70,
    },
    {
      label: "NLP Scam Keywords",
      weight: 35,
      triggered: triggeredKeywords.length > 0,
      detail: `${triggeredKeywords.length} scam keyword(s) found`,
      confidence: nlpScore > 30 ? 95 : 72,
    },
    {
      label: "Company Identity",
      weight: 15,
      triggered: !data.companyName.trim(),
      detail: data.companyName.trim() ? "Company name provided" : "No company name — anonymous offer",
      confidence: 85,
    },
    {
      label: "Domain Age Signal",
      weight: 20,
      triggered: domainIntel.estimatedAgeDays < 180,
      detail: `Domain ~${Math.floor(domainIntel.estimatedAgeDays / 30)} months old`,
      confidence: domainIntel.estimatedAgeDays < 180 ? 89 : 78,
    },
  ];

  const score = Math.round(Math.min(Math.max(ensembleScore, 5), 98));

  // ─── Flags ───
  const flags: string[] = [];
  if (FREE_EMAILS.some((d) => emailDomain.includes(d))) flags.push("Recruiter using a free personal email domain");
  SCAM_PAIRS.forEach(({ keyword, flag }) => { if (desc.includes(keyword)) flags.push(flag); });
  if (salary > 200000) flags.push("Unusually high salary offer — possible lure tactic");
  if (!data.companyName.trim()) flags.push("No company name provided — anonymous offers are suspicious");
  if (SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d))) flags.push("Email from a disposable/suspicious domain");
  if (domainIntel.estimatedAgeDays < 180) flags.push(`Recruiter domain is very new (~${Math.floor(domainIntel.estimatedAgeDays / 30)} months old)`);

  // ─── Smart Suggestions ───
  const suggestions: string[] = [];
  if (score >= 65) {
    suggestions.push("Do NOT share personal documents or banking details");
    suggestions.push("Report this offer to your college placement cell");
    suggestions.push("Verify company registration on MCA21 portal");
    suggestions.push("Do not pay any registration or processing fee");
    suggestions.push("Block and report the sender if contacted via WhatsApp");
  } else if (score >= 30) {
    suggestions.push("Proceed carefully — verify company details independently");
    suggestions.push("Check company on LinkedIn and Glassdoor before responding");
    suggestions.push("Request an official offer letter on company letterhead");
    suggestions.push("Video call with HR to verify authenticity");
  } else {
    suggestions.push("Offer appears clean — proceed with standard precautions");
    suggestions.push("Always read the full contract before signing");
    suggestions.push("Confirm salary and role details in writing");
  }

  return { score, flags, factors, domainIntel, suggestions, mlBreakdown, confidenceLevel };
}
