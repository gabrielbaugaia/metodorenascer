import { useEffect, useRef, useState } from "react";

interface ScoreRingProps {
  score: number;
  classification: string;
  celebrate?: boolean;
  emptyLabel?: string;
  size?: number;
}

export function ScoreRing({ score, celebrate, emptyLabel, size = 138 }: ScoreRingProps) {
  const radius = size / 2;
  const stroke = 7.5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(Math.max(score, 0) / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;

  // Anel sempre em bronze — estados de risco ficam no texto de status.
  const color = "hsl(33 35% 51%)";

  const [displayScore, setDisplayScore] = useState(score);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    const from = prevScoreRef.current;
    const to = score;
    prevScoreRef.current = score;

    if (from === to) {
      setDisplayScore(to);
      return;
    }

    const duration = 500;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [score]);

  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (celebrate) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(timer);
    }
  }, [celebrate]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={pulse ? "transition-transform duration-500 scale-[1.03]" : "transition-transform duration-500"}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke="hsl(216 12% 24%)"
            strokeWidth={stroke}
          />
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          <text
            x={radius}
            y={radius - 4}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-sidebar-foreground"
            fontSize={size > 130 ? 38 : 32}
            fontWeight={700}
            transform={`rotate(90 ${radius} ${radius})`}
          >
            {displayScore}
          </text>
          <text
            x={radius}
            y={radius + 22}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-sidebar-foreground/50"
            fontSize="11"
            transform={`rotate(90 ${radius} ${radius})`}
          >
            / 100
          </text>
        </svg>
      </div>

      <div className="text-center">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-sidebar-foreground/50">
          Score do dia
        </p>
        {emptyLabel && (
          <p className="mt-1 text-[0.7rem] text-sidebar-foreground/40">
            Registre o check-in para calcular
          </p>
        )}
      </div>
    </div>
  );
}
