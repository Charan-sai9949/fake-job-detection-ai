import { useState } from "react";
import { Building2, Mail, DollarSign, MapPin, FileText, Shield, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeOffer, type FormData, type AnalysisResult } from "@/lib/analysis";
import CircularGauge from "@/components/CircularGauge";

const DOMAIN_TRUST_CONFIG = {
  trusted: { label: "Trusted", color: "text-success", icon: <Shield className="w-3 h-3" /> },
  new: { label: "New", color: "text-warning", icon: <ShieldAlert className="w-3 h-3" /> },
  suspicious: { label: "Suspicious", color: "text-destructive", icon: <ShieldX className="w-3 h-3" /> },
};

const emptyForm = (): FormData => ({ jobDescription: "", companyName: "", email: "", salary: "", location: "" });

function OfferForm({ label, form, onChange }: { label: string; form: FormData; onChange: (f: FormData) => void }) {
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...form, [e.target.name]: e.target.value });
  return (
    <div className="glass rounded-xl p-5 border border-border space-y-4 flex-1">
      <h3 className="font-bold text-base text-primary">{label}</h3>
      <div className="space-y-1">
        <Label className="flex items-center gap-1 text-xs"><FileText className="w-3 h-3" /> Job Description</Label>
        <Textarea name="jobDescription" value={form.jobDescription} onChange={handle}
          placeholder="Paste job description..." className="min-h-[100px] bg-secondary/50 text-sm resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: "companyName", placeholder: "Company Name", Icon: Building2 },
          { name: "email", placeholder: "Recruiter Email", Icon: Mail },
          { name: "salary", placeholder: "Salary (₹)", Icon: DollarSign },
          { name: "location", placeholder: "Location", Icon: MapPin },
        ].map(({ name, placeholder, Icon }) => (
          <div key={name} className="space-y-1">
            <Label className="flex items-center gap-1 text-xs"><Icon className="w-3 h-3" /> {placeholder}</Label>
            <Input name={name} value={(form as any)[name]} onChange={handle}
              placeholder={placeholder} className="bg-secondary/50 text-sm h-9" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result, form, isSafer }: { result: AnalysisResult; form: FormData; isSafer: boolean }) {
  const trustCfg = DOMAIN_TRUST_CONFIG[result.domainIntel.trustLevel];
  return (
    <div className={`glass rounded-xl p-5 border flex-1 relative ${isSafer ? "border-success/50 shadow-[0_0_20px_hsl(142_71%_45%/0.15)]" : "border-border"}`}>
      {isSafer && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-xs font-bold px-3 py-1 rounded-full">
          ✓ Safer Choice
        </div>
      )}
      <div className="flex justify-center mb-4">
        <CircularGauge score={result.score} size={150} />
      </div>

      {/* Domain Trust */}
      <div className={`flex items-center gap-2 text-xs font-semibold mb-4 ${trustCfg.color}`}>
        <Globe className="w-3 h-3" /> {trustCfg.icon} Domain: {trustCfg.label}
        <span className="text-muted-foreground font-normal">({result.domainIntel.domain || "N/A"})</span>
      </div>

      {/* Flags */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-warning" /> {result.flags.length} Red Flag(s)
        </p>
        {result.flags.length === 0 ? (
          <div className="flex items-center gap-2 text-success text-xs">
            <CheckCircle2 className="w-3 h-3" /> No issues found
          </div>
        ) : (
          <ul className="space-y-1">
            {result.flags.map((f, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />{f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Offer detail */}
      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
        {form.companyName && <p><span className="text-foreground font-medium">Company:</span> {form.companyName}</p>}
        {form.salary && <p><span className="text-foreground font-medium">Salary:</span> ₹{form.salary}</p>}
        {form.location && <p><span className="text-foreground font-medium">Location:</span> {form.location}</p>}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [formA, setFormA] = useState<FormData>(emptyForm());
  const [formB, setFormB] = useState<FormData>(emptyForm());
  const [results, setResults] = useState<{ a: AnalysisResult; b: AnalysisResult } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!formA.jobDescription.trim() && !formA.companyName.trim() && !formB.jobDescription.trim() && !formB.companyName.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setResults({ a: analyzeOffer(formA), b: analyzeOffer(formB) });
    setLoading(false);
  };

  const aIsSafer = results ? results.a.score <= results.b.score : false;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Compare <span className="text-primary">Job Offers</span>
          </h1>
          <p className="text-muted-foreground">Enter two job offers side-by-side to find out which one is safer.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <OfferForm label="Offer A" form={formA} onChange={setFormA} />
          <OfferForm label="Offer B" form={formB} onChange={setFormB} />
        </div>

        <div className="flex justify-center mb-8">
          <Button onClick={handleCompare} disabled={loading} size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold px-10">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Analyzing...</> : "Compare Now"}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-4">Comparison Results</h2>
            <div className="flex flex-col lg:flex-row gap-6">
              <ResultCard result={results.a} form={formA} isSafer={aIsSafer && results.a.score !== results.b.score} />
              <ResultCard result={results.b} form={formB} isSafer={!aIsSafer && results.a.score !== results.b.score} />
            </div>
            {results.a.score === results.b.score && (
              <p className="text-center text-muted-foreground text-sm mt-2">Both offers have an equal risk score.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
