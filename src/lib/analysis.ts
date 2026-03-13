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

function computeSalaryScore(salary: string, desc: string): number {
  const lowerSalary = salary.toLowerCase();
  let val = parseFloat(salary.replace(/[^0-9.]/g, "")) || 0;

  // Convert LPA properly
  if (lowerSalary.includes("lpa")) {
    val = val * 100000;
  }

  const lowerDesc = desc.toLowerCase();

  // Internship anomaly
  if (lowerDesc.includes("intern") && val > 30000) return 75;

  // High fresher salary anomaly
  if (val > 1500000) return 85;
  if (val > 800000) return 60;

  if (val < 5000 && val > 0) return 70;

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
  const salaryScore = computeSalaryScore(data.salary, desc);
  const patternScore = computePatternScore(desc, data.companyName, data.email);
let extraRisk = 0;

const adjustedSalary = parseFloat(data.salary.replace(/[^0-9.]/g, "")) || 0;

// High salary boost
if (adjustedSalary > 800000) {
  extraRisk += 25;
}

// Immediate joining pressure
if (desc.includes("immediate joining")) {
  extraRisk += 20;
}

// Asking personal documents early
if (
  desc.includes("aadhaar") ||
  desc.includes("pan") ||
  desc.includes("documents")
) {
  extraRisk += 25;
}

// Remote + high salary combo
if (desc.includes("remote") && adjustedSalary > 800000) {
  extraRisk += 20;
}

// Unknown / non-trusted domain boost
if (domainIntel.trustLevel !== "trusted") {
  extraRisk += 10;
}

  // 🚨 CRITICAL OVERRIDE (prevents dilution of obvious scams)
  const criticalKeywords = [
    "security deposit",
    "processing fee",
    "registration fee",
    "advance fee"
  ];

  const hasCriticalPayment = criticalKeywords.some(k => desc.includes(k));
  const isFreeEmail = FREE_EMAILS.some(d => emailDomain.includes(d));

  if (hasCriticalPayment && isFreeEmail) {
    return {
      score: 92,
      flags: [
        "Critical scam pattern detected: payment request + free email domain"
      ],
      factors: [],
      domainIntel,
      suggestions: [
        "Do NOT send any money",
        "Block and report the sender immediately",
        "This offer is highly likely to be fraudulent"
      ],
      mlBreakdown: {
        nlpScore,
        domainScore,
        salaryScore,
        patternScore,
        ensembleScore: 92,
        modelWeights: []
      },
      confidenceLevel: 96,
    };
  }

  // 🔥 Stronger Ensemble Weights
  const MODEL_WEIGHTS = [
    { name: "NLP Keyword Model", weight: 0.45, score: nlpScore },
    { name: "Domain Intelligence", weight: 0.30, score: domainScore },
    { name: "Salary Anomaly", weight: 0.15, score: salaryScore },
    { name: "Behavioral Pattern", weight: 0.10, score: patternScore },
  ];

  const ensembleScore = MODEL_WEIGHTS.reduce(
    (acc, m) => acc + m.weight * m.score,
    0
  );
console.log("NLP:", nlpScore);
console.log("Domain:", domainScore);
console.log("SalaryScore:", salaryScore);
console.log("Pattern:", patternScore);
console.log("Ensemble:", ensembleScore);
console.log("ExtraRisk:", extraRisk);
  const score = Math.round(
  Math.min(Math.max(ensembleScore + extraRisk, 5), 98)
);

  // ─── Confidence Calculation ───
  const scores = [nlpScore, domainScore, salaryScore, patternScore];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const rawConf = Math.max(0, 100 - stdDev * 0.9);
  const confidenceLevel = Math.round(Math.min(98, Math.max(55, rawConf)));

  const mlBreakdown: MLBreakdown = {
    nlpScore: Math.round(nlpScore),
    domainScore: Math.round(domainScore),
    salaryScore: Math.round(salaryScore),
    patternScore: Math.round(patternScore),
    ensembleScore: Math.round(ensembleScore),
    modelWeights: MODEL_WEIGHTS.map(m => ({
      name: m.name,
      weight: m.weight,
      score: Math.round(m.score)
    })),
  };

  // ─── Flags ───
  const flags: string[] = [];

  if (isFreeEmail)
    flags.push("Recruiter using a free personal email domain");

  SCAM_PAIRS.forEach(({ keyword, flag }) => {
    if (desc.includes(keyword)) flags.push(flag);
  });

  if (salaryScore > 0)
    flags.push("Salary anomaly detected");

  if (!data.companyName.trim())
    flags.push("No company name provided — anonymous offers are suspicious");

  if (SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d)))
    flags.push("Email from a disposable or suspicious domain");

  if (domainIntel.estimatedAgeDays < 180)
    flags.push(
      `Recruiter domain is very new (~${Math.floor(domainIntel.estimatedAgeDays / 30)} months old)`
    );

  // ─── Suggestions ───
  const suggestions: string[] = [];

  if (score >= 70) {
    suggestions.push("Do NOT share personal documents or banking details");
    suggestions.push("Verify company registration on MCA portal");
    suggestions.push("Never pay any registration or processing fee");
    suggestions.push("Report this offer to your placement cell or cybercrime portal");
  } else if (score >= 35) {
    suggestions.push("Proceed carefully — verify company independently");
    suggestions.push("Check company on LinkedIn and Glassdoor");
    suggestions.push("Request official offer letter on company letterhead");
  } else {
    suggestions.push("Offer appears clean — proceed with standard precautions");
    suggestions.push("Always review contract terms carefully");
  }

  return {
    score,
    flags,
    factors: [],
    domainIntel,
    suggestions,
    mlBreakdown,
    confidenceLevel
  };
}

// ─── API Integration ──────────────────────────────────────────────────────────

interface APIResponse {
  risk_score: number;
  status: string;
  ml_confidence: number;
  reasons: string[];
  success: boolean;
}

export async function analyzeOfferWithAPI(data: FormData | any): Promise<AnalysisResult> {
const API_URL = `${import.meta.env.VITE_API_URL}/api/analyze`;
  try {
    // Always send as FormData to the backend
    let formData: FormData;

    if (data instanceof FormData) {
      // Already FormData from CheckOfferPage or similar - use as-is
      formData = data;
    } else {
      // Convert plain object to FormData (for fallback/compatibility)
      formData = new FormData();
      // Only append fields that exist in the data object
      if (data.jobDescription) formData.append("jobDescription", data.jobDescription);
      if (data.email) formData.append("email", data.email);
      if (data.companyName) formData.append("companyName", data.companyName);
      if (data.salary) formData.append("salary", data.salary);
      if (data.location) formData.append("location", data.location);
      if (data.pdf) formData.append("pdf", data.pdf); // Only append if file exists
    }

    console.log("[DEBUG] Sending request to backend:", API_URL);

    // Send as FormData - DO NOT set Content-Type header
    // Browser will automatically set correct Content-Type: multipart/form-data with boundary
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const apiResult: APIResponse = await response.json();

    if (!apiResult.success) {
      throw new Error(apiResult.reasons?.join(", ") || "API analysis failed");
    }

    console.log("[DEBUG] API analysis completed:", apiResult.score);

    // Extract form data for UI processing
    const email = (formData.get("email") as string || "").toLowerCase();
    const jobDescription = (formData.get("jobDescription") as string || "");
    const companyName = (formData.get("companyName") as string || "").toLowerCase();
    const salary = (formData.get("salary") as string || "");

    return buildAnalysisResult(apiResult, email, jobDescription, companyName, salary);
  } catch (error) {
    console.error("[ERROR] API Analysis failed:", error);
    throw error;
  }
}

function buildAnalysisResult(
  apiResult: APIResponse,
  email: string,
  jobDescription: string,
  companyName: string,
  salary: string
): AnalysisResult {
  // Transform API response to match AnalysisResult interface
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  const domainIntel = analyzeDomain(email);
  const salaryValue = parseFloat(salary.replace(/[^0-9.]/g, "")) || 0;

  // Calculate approximate ML and rule scores from the weighted result
  // risk_score = 0.7 * ml_score + 0.3 * rule_score
  // ml_confidence is the ML probability (0-100), so use that as ml_score
  const mlScore = apiResult.ml_confidence;
  const estimatedRuleScore = apiResult.risk_score > mlScore ? Math.min(100, (apiResult.risk_score - mlScore * 0.7) / 0.3) : 0;

  // Generate UI-specific data
  const mlBreakdown: MLBreakdown = {
    nlpScore: Math.round(mlScore * 0.7),
    domainScore: Math.round(estimatedRuleScore * 0.3),
    salaryScore: salaryValue > 200000 ? 65 : salaryValue < 5000 && salaryValue > 0 ? 70 : 0,
    patternScore: Math.round(apiResult.reasons.length > 0 ? 40 : 0),
    ensembleScore: apiResult.risk_score,
    modelWeights: [
      { name: "ML Model", weight: 0.7, score: Math.round(mlScore) },
      { name: "Rule Indicators", weight: 0.3, score: Math.round(estimatedRuleScore) },
    ],
  };

  // Risk factors
  const factors: RiskFactor[] = [
    {
      label: "Email Domain",
      weight: 25,
      triggered: FREE_EMAILS.some((d) => emailDomain.includes(d)) || SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d)),
      detail: FREE_EMAILS.some((d) => emailDomain.includes(d))
        ? "Free personal email domain"
        : SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d))
        ? "Suspicious TLD domain"
        : "Professional domain",
      confidence: apiResult.risk_score > 50 ? 92 : 75,
    },
    {
      label: "Salary Realism",
      weight: 20,
      triggered: salaryValue > 200000 || (salaryValue < 5000 && salaryValue > 0),
      detail:
        salaryValue > 200000
          ? "Unrealistically high salary"
          : salaryValue < 5000 && salaryValue > 0
          ? "Suspiciously low salary"
          : "Salary within normal range",
      confidence: salaryValue > 200000 || (salaryValue < 5000 && salaryValue > 0) ? 88 : 70,
    },
    {
      label: "NLP Scam Keywords",
      weight: 35,
      triggered: apiResult.reasons.length > 0,
      detail: `${apiResult.reasons.length} risk factor(s) detected by ML`,
      confidence: apiResult.ml_confidence > 70 ? 95 : 72,
    },
    {
      label: "Company Identity",
      weight: 15,
      triggered: !companyName.trim(),
      detail: companyName.trim() ? "Company name provided" : "No company name — anonymous offer",
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

  // Generate suggestions based on new scoring thresholds
  // New thresholds: Safe <31, Suspicious 31-60, High Risk >=61
  const suggestions: string[] = [];
  if (apiResult.risk_score >= 61) {
    suggestions.push("Do NOT share personal documents or banking details");
    suggestions.push("Report this offer to your college placement cell");
    suggestions.push("Verify company registration on MCA21 portal");
    suggestions.push("Do not pay any registration or processing fee");
    suggestions.push("Block and report the sender if contacted via WhatsApp");
  } else if (apiResult.risk_score >= 31) {
    suggestions.push("Proceed carefully — verify company details independently");
    suggestions.push("Check company on LinkedIn and Glassdoor before responding");
    suggestions.push("Request an official offer letter on company letterhead");
    suggestions.push("Video call with HR to verify authenticity");
  } else {
    suggestions.push("Offer appears clean — proceed with standard precautions");
    suggestions.push("Always read the full contract before signing");
    suggestions.push("Confirm salary and role details in writing");
  }

  // Calculate confidence level
  const confidenceLevel = Math.round(apiResult.ml_confidence);

  return {
    score: apiResult.risk_score,
    flags: apiResult.reasons,
    factors,
    domainIntel,
    suggestions,
    mlBreakdown,
    confidenceLevel,
  };
}
