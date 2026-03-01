import { useEffect, useState } from "react";
import { Brain, Cpu, TrendingUp, BarChart3, Zap } from "lucide-react";
import { type MLBreakdown } from "@/lib/analysis";

interface Props {
  mlBreakdown: MLBreakdown;
  confidenceLevel: number;
  score: number;
}

function AnimatedBar({ value, color, delay = 0, label }: { value: number; color: string; delay?: number; label: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 200 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${width}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return <span>{val}</span>;
}

const MODEL_ICONS = [
  <Brain className="w-4 h-4" />,
  <Cpu className="w-4 h-4" />,
  <TrendingUp className="w-4 h-4" />,
  <BarChart3 className="w-4 h-4" />,
];

const MODEL_COLORS = ["bg-primary", "bg-accent", "bg-warning", "bg-success"];
const MODEL_SCORE_COLORS = [
  (s: number) => s > 60 ? "bg-destructive" : s > 30 ? "bg-warning" : "bg-success",
  (s: number) => s > 60 ? "bg-destructive" : s > 30 ? "bg-warning" : "bg-success",
  (s: number) => s > 60 ? "bg-destructive" : s > 30 ? "bg-warning" : "bg-success",
  (s: number) => s > 60 ? "bg-destructive" : s > 30 ? "bg-warning" : "bg-success",
];

export default function MLBreakdownPanel({ mlBreakdown, confidenceLevel, score }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  const confColor = confidenceLevel >= 85 ? "text-success" : confidenceLevel >= 70 ? "text-warning" : "text-muted-foreground";

  return (
    <div className={`glass rounded-xl p-6 border border-border mb-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary animate-pulse" />
          ML Ensemble Prediction
        </h2>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-secondary border border-border ${confColor}`}>
          <div className={`w-2 h-2 rounded-full ${confColor.replace("text-", "bg-")} animate-pulse`} />
          <CountUp target={confidenceLevel} />% Confidence
        </div>
      </div>

      {/* Model weights grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {mlBreakdown.modelWeights.map((m, i) => (
          <div
            key={m.name}
            className="glass rounded-lg p-3 border border-border animate-stagger-in"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`p-1 rounded ${MODEL_COLORS[i]}/20 text-${MODEL_COLORS[i].replace("bg-", "")}`}>
                {MODEL_ICONS[i]}
              </span>
              <span className="text-xs font-medium leading-tight">{m.name}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-xl font-bold font-mono">
                <CountUp target={m.score} duration={1000 + i * 200} />
              </div>
              <div className="text-xs text-muted-foreground">w={m.weight.toFixed(2)}</div>
            </div>
            <AnimatedBar
              value={m.score}
              color={MODEL_SCORE_COLORS[i](m.score)}
              delay={i * 150}
              label=""
            />
          </div>
        ))}
      </div>

      {/* Ensemble result */}
      <div className={`flex items-center justify-between p-4 rounded-lg border animate-border-glow ${
        score >= 65 ? "bg-destructive/10 border-destructive/40" :
        score >= 30 ? "bg-warning/10 border-warning/40" : "bg-success/10 border-success/40"
      }`}>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Weighted Ensemble Score</p>
          <p className="text-2xl font-bold font-mono">
            <CountUp target={mlBreakdown.ensembleScore} duration={1500} />%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Model Agreement</p>
          <div className="flex gap-1 justify-end">
            {mlBreakdown.modelWeights.map((m, i) => (
              <div
                key={i}
                className={`w-2 h-6 rounded-full transition-all duration-500 ${
                  Math.abs(m.score - mlBreakdown.ensembleScore) < 20
                    ? "bg-success opacity-90"
                    : "bg-warning opacity-60"
                }`}
                style={{ height: `${12 + (m.score / 100) * 20}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
