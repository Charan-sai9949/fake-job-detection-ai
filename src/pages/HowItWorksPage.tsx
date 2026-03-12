import { Brain, Globe, Key, Database, ChevronRight } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Input Collection",
    desc: "User submits job description, company name, recruiter email, salary, and location via form or PDF upload.",
    icon: <Key className="w-6 h-6" />,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  {
    num: "02",
    title: "NLP Analysis",
    desc: "Natural Language Processing scans the job text for scam keywords, pressure tactics, and unrealistic promises.",
    icon: <Brain className="w-6 h-6" />,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    num: "03",
    title: "Domain Verification",
    desc: "The recruiter's email domain is checked against free email providers, disposable domains, and blacklisted addresses.",
    icon: <Globe className="w-6 h-6" />,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/20",
  },
  {
    num: "04",
    title: "Blacklist Check",
    desc: "Company name, domain, and salary data are cross-referenced against a crowd-sourced scam database.",
    icon: <Database className="w-6 h-6" />,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
];

const techniques = [
  {
    title: "NLP Keyword Detection",
    items: [
      "Scam trigger phrases: 'no experience required', 'work from home', 'advance fee'",
      "Urgency language: 'immediate joining', 'limited seats', 'respond now'",
      "Payment traps: 'registration fee', 'processing charge', 'security deposit'",
    ],
  },
  {
    title: "Email Domain Verification",
    items: [
      "Checks if email uses a free provider (Gmail, Yahoo) instead of a corporate domain",
      "Detects disposable/temporary domains (.tk, .ml, throwam, mailinator)",
      "Validates domain registration age and WHOIS records",
    ],
  },
  {
    title: "Salary Anomaly Detection",
    items: [
      "Compares salary to industry averages for the stated role",
      "Flags salaries that are unrealistically high or suspiciously low",
      "Cross-references with job location cost of living",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="text-primary">AIGuard</span> Works
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Our multi-layer AI detection pipeline combines NLP, domain verification, and blacklist checks 
            to deliver a comprehensive risk assessment of any job offer.
          </p>
        </div>

        {/* Flow Steps */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-8 text-center">Detection Pipeline</h2>
          <div className="relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-accent via-primary via-warning to-destructive opacity-40" />
            
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <div key={step.num} className="relative">
                  <div className={`glass rounded-xl p-5 border ${step.bg} text-center`}>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${step.bg} border ${step.bg.split(" ")[1]} mb-4 ${step.color}`}>
                      {step.icon}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mb-1">{step.num}</div>
                    <h3 className="font-semibold mb-2 text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-10 -right-3 z-10 w-6 h-6 items-center justify-center text-muted-foreground">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Score Explanation */}
        <div className="glass rounded-xl p-8 border border-border mb-10">
          <h2 className="text-xl font-semibold mb-6">Understanding Your Risk Score</h2>
          <div className="space-y-4">
            {[
              { range: "0 – 29%", label: "Safe", color: "bg-success", desc: "Offer appears legitimate. Standard due diligence advised." },
              { range: "30 – 64%", label: "Suspicious", color: "bg-warning", desc: "Potential red flags found. Research company thoroughly before applying." },
              { range: "65 – 100%", label: "High Risk", color: "bg-destructive", desc: "Multiple scam indicators detected. Do not share personal information." },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className={`w-16 h-2 rounded-full ${item.color} shrink-0`} />
                <div>
                  <span className="font-semibold text-sm">{item.range} — {item.label}: </span>
                  <span className="text-muted-foreground text-sm">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ML Score Explanation */}
        <div className="glass rounded-xl p-8 border border-border mb-10">
          <h2 className="text-xl font-semibold mb-6">Understanding Your ML Score</h2>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            The ML score represents the probability predicted by the machine learning model that a job offer may be fraudulent. 
            The model analyzes the job description and detects patterns commonly found in scam job postings.
          </p>
          <div className="space-y-4">
            {[
              { range: "0 – 40%", label: "Low Scam Probability", color: "bg-success", desc: "Very few scam patterns detected by the machine learning model." },
              { range: "41 – 70%", label: "Moderate Scam Probability", color: "bg-warning", desc: "Some suspicious language patterns detected. Users should verify company details before applying." },
              { range: "71 – 100%", label: "High Scam Probability", color: "bg-destructive", desc: "The machine learning model strongly detects scam-related patterns and fraudulent indicators." },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className={`w-16 h-2 rounded-full ${item.color} shrink-0`} />
                <div>
                  <span className="font-semibold text-sm">{item.range} — {item.label}: </span>
                  <span className="text-muted-foreground text-sm">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Techniques Deep Dive */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Detection Techniques</h2>
          {techniques.map((t) => (
            <div key={t.title} className="glass rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-primary mb-4">{t.title}</h3>
              <ul className="space-y-2">
                {t.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
