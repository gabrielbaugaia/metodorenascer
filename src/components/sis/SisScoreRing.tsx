import { useEffect, useRef, useState } from "react";
import { CLASSIFICATION_COLORS, type SisClassification } from "@/lib/sisScoreCalc";

interface SisScoreRingProps {
  score: number;
  classification: SisClassification;
  label: string;
  delta7vs30: number;
  hasTodayScore: boolean;
}

export function SisScoreRing({ score, classification, label, delta7vs30, hasTodayScore }: SisScoreRingProps) {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  const color = CLASSIFICATION_COLORS[classification] ?? "hsl(var(--primary))";

  const [displayScore, setDisplayScore] = useState(score);
  const prevRef = useRef(score);

  useEffect(() => {
    const from = prevRef.current;
    const to = score;
    prevRef.current = score;
    if (from === to) { setDisplayScore(to); return; }
    const duration = 600;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
        <circle cx={radius} cy={radius} r={normalizedRadius} fill="transparent" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={radius} cy={radius} r={normalizedRadius} fill="transparent"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x={radius} y={radius - 8} textAnchor="middle" dominantBaseline="central" className="fill-foreground font-bold" fontSize="36" transform={`rotate(90 ${radius} ${radius})`}>
          {displayScore}
        </text>
        <text x={radius} y={radius + 20} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground" fontSize="11" transform={`rotate(90 ${radius} ${radius})`}>
          Shape Intelligence
        </text>
      </svg>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
          {label}
        </span>
        {delta7vs30 !== 0 && (
          <span className={`text-xs font-medium ${delta7vs30 > 0 ? "text-green-500" : "text-red-400"}`}>
            {delta7vs30 > 0 ? "↑" : "↓"} {Math.abs(delta7vs30).toFixed(1)}
          </span>
        )}
      </div>

      {!hasTodayScore && (
        <p className="text-[10px] text-muted-foreground/70 animate-pulse">
          Score pendente — registre dados hoje
        </p>
      )}
    </div>
  );
}
