import { useEffect, useState } from "react";

interface Props {
  score: number;
  size?: number;
}

export default function CircularGauge({ score, size = 200 }: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = score / 60;
    const interval = setInterval(() => {
      current += step;
      if (current >= score) { setAnimated(score); clearInterval(interval); }
      else setAnimated(Math.floor(current));
    }, 16);
    return () => clearInterval(interval);
  }, [score]);

  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  // Only use 270° of the circle (leave gap at bottom)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (animated / 100) * arcLength;

  const color = score < 30 ? "hsl(142 71% 45%)" : score < 65 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)";
  const label = score < 30 ? "Safe" : score < 65 ? "Suspicious" : "High Risk";
  const labelColor = score < 30 ? "text-success" : score < 65 ? "text-warning" : "text-destructive";

  // Start at -225deg (bottom-left) for 270° arc
  const startAngle = 135;
  const startRad = (startAngle * Math.PI) / 180;
  const sx = cx + radius * Math.cos(startRad);
  const sy = cy + radius * Math.sin(startRad);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={size * 0.075}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Filled arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.075}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.016s linear, stroke 0.5s ease", filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Center text */}
        <text x={cx} y={cy - size * 0.05} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.22} fontWeight="bold" fill={color}>
          {animated}
        </text>
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.08} fill="hsl(var(--muted-foreground))">
          RISK SCORE
        </text>
      </svg>
      <span className={`text-lg font-bold mt-1 ${labelColor}`}>{label}</span>
    </div>
  );
}
