import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, ArrowLeft, RotateCcw,
  Download, Shield, Globe, Star, Info, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CircularGauge from "@/components/CircularGauge";
import MLBreakdownPanel from "@/components/MLBreakdownPanel";
import { type AnalysisResult, type FormData } from "@/lib/analysis";
import jsPDF from "jspdf";

interface ResultState extends AnalysisResult {
  form: FormData;
}

function AnimatedBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${width}%` }} />
    </div>
  );
}

function StaggerCard({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-stagger-in ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

const DOMAIN_TRUST_CONFIG = {
  trusted: { label: "Trusted Domain", color: "text-success", bg: "bg-success/20 border-success/30", icon: <Shield className="w-4 h-4" /> },
  new: { label: "New Domain", color: "text-warning", bg: "bg-warning/20 border-warning/30", icon: <ShieldAlert className="w-4 h-4" /> },
  suspicious: { label: "Suspicious Domain", color: "text-destructive", bg: "bg-destructive/20 border-destructive/30", icon: <ShieldX className="w-4 h-4" /> },
};

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!state) navigate("/check");
    else setTimeout(() => setMounted(true), 50);
  }, [state, navigate]);

  if (!state) return null;

  const { score, flags, factors, domainIntel, suggestions, form, mlBreakdown, confidenceLevel } = state;
  const barColor = score < 30 ? "bg-success" : score < 65 ? "bg-warning" : "bg-destructive";
  const trustCfg = DOMAIN_TRUST_CONFIG[domainIntel.trustLevel];
  const top3Flags = flags.slice(0, 3);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("AIGuard Safety Report", 20, 18);
    doc.setTextColor(180, 180, 200);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

    let y = 55;
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ML Ensemble Risk Assessment", 20, y);
    y += 10;
    doc.setFontSize(32);
    const riskColor = score < 30 ? [34, 197, 94] : score < 65 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(`${score}%`, 20, y + 10);
    doc.setFontSize(14);
    const label = score < 30 ? "SAFE" : score < 65 ? "SUSPICIOUS" : "HIGH RISK";
    doc.text(label, 60, y + 10);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text(`Model Confidence: ${confidenceLevel}%`, 20, y + 20);
    y += 30;

    doc.setTextColor(30, 30, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ML Sub-model Scores", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    mlBreakdown.modelWeights.forEach(({ name, score: ms, weight }) => {
      doc.text(`• ${name}: ${ms}% (weight: ${weight.toFixed(2)})`, 20, y);
      y += 7;
    });
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Offer Details", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const details = [
      ["Company", form.companyName || "Not provided"],
      ["Email", form.email || "Not provided"],
      ["Salary", form.salary ? `₹${form.salary}` : "Not provided"],
      ["Location", form.location || "Not provided"],
    ];
    details.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(v, 60, y);
      y += 7;
    });
    y += 5;

    if (flags.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Detected Red Flags", 20, y); y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      flags.forEach((f) => {
        const lines = doc.splitTextToSize(`• ${f}`, pageW - 40);
        doc.text(lines, 20, y);
        y += lines.length * 6 + 2;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Safety Recommendations", 20, y); y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    suggestions.forEach((s) => {
      const lines = doc.splitTextToSize(`✓ ${s}`, pageW - 40);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 2;
    });

    doc.save("AIGuard_Safety_Report.pdf");
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/check" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Check
        </Link>

        {/* Circular Gauge Card */}
        <StaggerCard delay={0} className="glass rounded-2xl p-8 border border-border mb-6 text-center">
          <CircularGauge score={score} size={200} />
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">ML Confidence:</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confidenceLevel >= 85 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
              {confidenceLevel}%
            </span>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
            {score < 30 ? "This offer appears legitimate. Proceed with standard precautions."
              : score < 65 ? "Some red flags detected. Research this company thoroughly before proceeding."
              : "Multiple scam indicators found. We strongly advise against applying to this offer."}
          </p>
        </StaggerCard>

        {/* ML Breakdown */}
        <StaggerCard delay={100}>
          <MLBreakdownPanel mlBreakdown={mlBreakdown} confidenceLevel={confidenceLevel} score={score} />
        </StaggerCard>

        {/* Risk Factor Breakdown */}
        <StaggerCard delay={200} className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Risk Factor Breakdown
          </h2>
          <div className="space-y-4">
            {factors.map((f, i) => (
              <div key={f.label} className="animate-stagger-in" style={{ animationDelay: `${300 + i * 80}ms`, animationFillMode: "both" }}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${f.triggered ? barColor : "bg-success"}`} />
                    <span className="font-medium">{f.label}</span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded-full font-mono">
                      {f.confidence}% conf
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{f.detail}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.triggered ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                      {f.triggered ? `+${f.weight}pts` : "Clean"}
                    </span>
                  </div>
                </div>
                <AnimatedBar value={f.triggered ? f.weight * 4 : 5} color={f.triggered ? barColor : "bg-success"} delay={i * 120} />
              </div>
            ))}
          </div>

          {top3Flags.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-warning" /> Top Red Flags
              </p>
              <ul className="space-y-2">
                {top3Flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm animate-stagger-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                    <ChevronRight className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </StaggerCard>

        {/* Domain Intelligence */}
        <StaggerCard delay={300} className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Domain Intelligence
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${trustCfg.bg} ${trustCfg.color} animate-border-glow`}>
              {trustCfg.icon} {trustCfg.label}
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p><span className="text-foreground font-medium">Domain:</span> {domainIntel.domain || "Not provided"}</p>
              <p>
                <span className="text-foreground font-medium">Estimated Age:</span> ~{Math.floor(domainIntel.estimatedAgeDays / 30)} months
                {domainIntel.estimatedAgeDays < 180 && <span className="text-destructive ml-2 text-xs">(Very new — high risk)</span>}
              </p>
            </div>
          </div>
        </StaggerCard>

        {/* All Red Flags */}
        <StaggerCard delay={400} className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> Detected Issues ({flags.length})
          </h2>
          {flags.length === 0 ? (
            <div className="flex items-center gap-3 text-success animate-slide-up">
              <CheckCircle2 className="w-5 h-5" />
              <span>No red flags detected. Offer appears clean.</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-stagger-in hover:bg-destructive/15 transition-colors"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          )}
        </StaggerCard>

        {/* Smart Suggestions */}
        <StaggerCard delay={500} className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Smart Suggestions
          </h2>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className={`flex items-start gap-3 text-sm p-3 rounded-lg border animate-stagger-in hover:scale-[1.01] transition-transform ${
                score >= 65 ? "bg-destructive/10 border-destructive/20" :
                score >= 30 ? "bg-warning/10 border-warning/20" : "bg-success/10 border-success/20"
              }`} style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${score >= 65 ? "text-destructive" : score >= 30 ? "text-warning" : "text-success"}`} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </StaggerCard>

        {/* Offer Details */}
        <StaggerCard delay={600} className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4">Analyzed Offer Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Company", value: form.companyName || "Not provided" },
              { label: "Email", value: form.email || "Not provided" },
              { label: "Salary", value: form.salary ? `₹${form.salary}` : "Not provided" },
              { label: "Location", value: form.location || "Not provided" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0 hover:bg-secondary/30 px-2 rounded transition-colors">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-right max-w-[200px] truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </StaggerCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up delay-700" style={{ animationFillMode: "both" }}>
          <Link to="/check" className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-border hover:bg-secondary hover:scale-105 transition-all">
              <RotateCcw className="w-4 h-4" /> Check Another Offer
            </Button>
          </Link>
          <Link to="/compare" className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-primary/50 hover:bg-primary/10 text-primary hover:scale-105 transition-all">
              Compare Offers
            </Button>
          </Link>
          <Button onClick={downloadPDF} className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all glow-primary">
            <Download className="w-4 h-4" /> Download Report
          </Button>
        </div>
      </div>
    </div>
  );
}
