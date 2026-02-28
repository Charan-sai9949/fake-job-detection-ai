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
}

export interface AnalysisResult {
  score: number;
  flags: string[];
  factors: RiskFactor[];
  domainIntel: DomainIntelligence;
  suggestions: string[];
}

const FREE_EMAILS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ymail.com"];
const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", "temp-mail", "throwam"];

const SCAM_PAIRS: { keyword: string; flag: string; weight: number }[] = [
  { keyword: "pay to apply", flag: "Payment required to apply — a clear scam indicator", weight: 20 },
  { keyword: "registration fee", flag: "Registration fee mentioned — legitimate jobs never charge fees", weight: 20 },
  { keyword: "advance fee", flag: "Advance fee request detected", weight: 18 },
  { keyword: "urgent", flag: "Excessive urgency language detected", weight: 8 },
  { keyword: "no experience required", flag: "Suspicious 'no experience required' claim for high-pay role", weight: 8 },
  { keyword: "work from home", flag: "Unverified remote work opportunity", weight: 5 },
  { keyword: "unlimited earnings", flag: "Unrealistic 'unlimited earnings' promise detected", weight: 12 },
  { keyword: "wire transfer", flag: "Wire transfer payment method mentioned", weight: 15 },
  { keyword: "western union", flag: "Western Union payment method — common in scams", weight: 18 },
  { keyword: "lottery", flag: "Lottery-style language detected", weight: 20 },
  { keyword: "congratulations", flag: "Unsolicited 'congratulations' — typical scam opener", weight: 10 },
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
  if (!domain) return { domain: "", estimatedAgeDays: 0, trustLevel: "suspicious", riskBoost: 15 };

  const isFree = FREE_EMAILS.some((d) => domain.includes(d));
  const isSuspiciousTld = SUSPICIOUS_TLDS.some((d) => domain.includes(d));

  if (isSuspiciousTld) {
    return { domain, estimatedAgeDays: 30, trustLevel: "suspicious", riskBoost: 30 };
  }

  const seed = getDomainSeed(domain);
  const knownDomains = ["google.com", "microsoft.com", "amazon.com", "tcs.com", "infosys.com", "wipro.com", "hcl.com"];
  const isKnown = knownDomains.some((d) => domain.includes(d.split(".")[0]));

  if (isKnown) {
    return { domain, estimatedAgeDays: 365 * 15 + Math.floor(seedRandom(seed) * 1000), trustLevel: "trusted", riskBoost: 0 };
  }

  if (isFree) {
    return { domain, estimatedAgeDays: 365 * 5, trustLevel: "new", riskBoost: 10 };
  }

  // Simulate domain age: range 30–3650 days
  const raw = seedRandom(seed);
  const ageDays = Math.floor(30 + raw * 3620);
  const trustLevel: DomainIntelligence["trustLevel"] = ageDays < 180 ? "new" : ageDays < 730 ? "new" : "trusted";
  const riskBoost = ageDays < 180 ? 20 : ageDays < 365 ? 8 : 0;

  return { domain, estimatedAgeDays: ageDays, trustLevel: ageDays >= 730 ? "trusted" : "new", riskBoost };
}

export function analyzeOffer(data: FormData): AnalysisResult {
  const desc = (data.jobDescription + " " + data.companyName + " " + data.email).toLowerCase();
  const emailDomain = data.email.split("@")[1]?.toLowerCase() || "";
  const salary = parseFloat(data.salary.replace(/[^0-9.]/g, "")) || 0;
  const domainIntel = analyzeDomain(data.email);

  const factors: RiskFactor[] = [
    {
      label: "Email Domain",
      weight: 25,
      triggered: FREE_EMAILS.some((d) => emailDomain.includes(d)) || SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d)),
      detail: FREE_EMAILS.some((d) => emailDomain.includes(d))
        ? "Free personal email domain used"
        : SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d))
        ? "Suspicious TLD domain"
        : "Professional domain detected",
    },
    {
      label: "Salary Realism",
      weight: 20,
      triggered: salary > 200000 || (salary < 5000 && salary > 0),
      detail: salary > 200000 ? "Unrealistically high salary" : salary < 5000 && salary > 0 ? "Suspiciously low salary" : "Salary within normal range",
    },
    {
      label: "Scam Keywords",
      weight: 35,
      triggered: SCAM_PAIRS.some(({ keyword }) => desc.includes(keyword)),
      detail: `${SCAM_PAIRS.filter(({ keyword }) => desc.includes(keyword)).length} scam keyword(s) found`,
    },
    {
      label: "Company Identity",
      weight: 15,
      triggered: !data.companyName.trim(),
      detail: data.companyName.trim() ? "Company name provided" : "No company name — anonymous offer",
    },
    {
      label: "Domain Age",
      weight: 20,
      triggered: domainIntel.estimatedAgeDays < 180,
      detail: `Domain estimated ${Math.floor(domainIntel.estimatedAgeDays / 30)} months old`,
    },
  ];

  let score = 5;
  if (factors[0].triggered) score += 25;
  if (factors[1].triggered) score += 20;
  const keywordCount = SCAM_PAIRS.filter(({ keyword }) => desc.includes(keyword)).length;
  score += Math.min(keywordCount * 10, 35);
  if (factors[3].triggered) score += 15;
  score += domainIntel.riskBoost;

  score = Math.min(Math.max(score, 5), 98);

  const flags: string[] = [];
  if (FREE_EMAILS.some((d) => emailDomain.includes(d))) flags.push("Recruiter using a free personal email domain");
  SCAM_PAIRS.forEach(({ keyword, flag }) => { if (desc.includes(keyword)) flags.push(flag); });
  if (salary > 200000) flags.push("Unusually high salary offer — possible lure tactic");
  if (!data.companyName.trim()) flags.push("No company name provided — anonymous offers are suspicious");
  if (SUSPICIOUS_TLDS.some((d) => emailDomain.includes(d))) flags.push("Email from a disposable/suspicious domain");
  if (domainIntel.estimatedAgeDays < 180) flags.push(`Recruiter domain is very new (~${Math.floor(domainIntel.estimatedAgeDays / 30)} months old)`);

  const suggestions: string[] = [];
  if (score >= 65) {
    suggestions.push("Do NOT share personal documents or banking details");
    suggestions.push("Report this offer to your college placement cell");
    suggestions.push("Verify company registration on MCA21 portal");
    suggestions.push("Do not pay any registration or processing fee");
  } else if (score >= 30) {
    suggestions.push("Proceed carefully — verify company details independently");
    suggestions.push("Check company on LinkedIn before responding");
    suggestions.push("Request an official offer letter on company letterhead");
    suggestions.push("Video call with HR to verify authenticity");
  } else {
    suggestions.push("Offer appears clean — proceed with standard precautions");
    suggestions.push("Always read the full contract before signing");
    suggestions.push("Confirm salary and role details in writing");
  }

  return { score, flags, factors, domainIntel, suggestions };
}
