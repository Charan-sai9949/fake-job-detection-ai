import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultState {
  score: number;
  flags: string[];
  form: {
    companyName: string;
    email: string;
    salary: string;
    location: string;
    jobDescription: string;
  };
}

function getRiskLevel(score: number) {
  if (score < 30) return { label: "Safe", color: "text-success", bg: "bg-success", border: "border-success/30", glow: "shadow-[0_0_30px_hsl(142_71%_45%/0.4)]", icon: <Shield className="w-8 h-8" />, desc: "This offer appears legitimate. Proceed with standard precautions." };
  if (score < 65) return { label: "Suspicious", color: "text-warning", bg: "bg-warning", border: "border-warning/30", glow: "shadow-[0_0_30px_hsl(38_92%_50%/0.4)]", icon: <ShieldAlert className="w-8 h-8" />, desc: "Some red flags detected. Research this company thoroughly before proceeding." };
  return { label: "High Risk", color: "text-destructive", bg: "bg-destructive", border: "border-destructive/30", glow: "shadow-[0_0_30px_hsl(0_84%_60%/0.4)]", icon: <ShieldX className="w-8 h-8" />, desc: "Multiple scam indicators found. We strongly advise against applying to this offer." };
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (!state) { navigate("/check"); return; }
    const target = state.score;
    let current = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { setAnimatedScore(target); setBarWidth(target); clearInterval(interval); }
      else { setAnimatedScore(Math.floor(current)); setBarWidth(current); }
    }, 16);
    return () => clearInterval(interval);
  }, [state, navigate]);

  if (!state) return null;

  const risk = getRiskLevel(state.score);
  const barColor = state.score < 30 ? "bg-success" : state.score < 65 ? "bg-warning" : "bg-destructive";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/check" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Check
        </Link>

        {/* Risk Score Card */}
        <div className={`glass rounded-2xl p-8 border ${risk.border} ${risk.glow} mb-6 text-center`}>
          <div className={`${risk.color} flex justify-center mb-4`}>{risk.icon}</div>
          <div className="text-6xl font-bold mb-1 animate-count-up">
            <span className={risk.color}>{animatedScore}</span>
            <span className="text-2xl text-muted-foreground">%</span>
          </div>
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${risk.bg} text-primary-foreground mb-3`}>
            {risk.label}
          </div>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">{risk.desc}</p>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Safe</span><span>Suspicious</span><span>High Risk</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden relative">
              {/* Zone markers */}
              <div className="absolute inset-y-0 left-[30%] w-px bg-border/50 z-10" />
              <div className="absolute inset-y-0 left-[65%] w-px bg-border/50 z-10" />
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-100`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Red Flags */}
        <div className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Detected Issues ({state.flags.length})
          </h2>
          {state.flags.length === 0 ? (
            <div className="flex items-center gap-3 text-success">
              <CheckCircle2 className="w-5 h-5" />
              <span>No red flags detected. Offer appears clean.</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {state.flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Offer Details Summary */}
        <div className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold text-lg mb-4">Analyzed Offer Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Company", value: state.form.companyName || "Not provided" },
              { label: "Email", value: state.form.email || "Not provided" },
              { label: "Salary", value: state.form.salary ? `₹${state.form.salary}` : "Not provided" },
              { label: "Location", value: state.form.location || "Not provided" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-right max-w-[200px] truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/check" className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-border hover:bg-secondary">
              <RotateCcw className="w-4 h-4" /> Check Another Offer
            </Button>
          </Link>
          {state.score >= 65 && (
            <Link to="/admin" className="flex-1">
              <Button className="w-full gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <ShieldX className="w-4 h-4" /> Report This Scam
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
