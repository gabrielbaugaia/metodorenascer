import { useEffect, useRef, useState } from "react";

interface ScoreRingProps {
  score: number;
  classification: string;
  celebrate?: boolean;
}

export function ScoreRing({ score, classification, celebrate }: ScoreRingProps) {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;

  const colorMap: Record<string, string> = {
    ELITE: "hsl(var(--primary))",
    ALTO: "hsl(120 60% 50%)",
    MODERADO: "hsl(45 100% 50%)",
    RISCO: "hsl(0 80% 55%)",
  };
  const color = colorMap[classification] ?? "hsl(var(--primary))";

  // Animated number count
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
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [score]);

  // Pulse glow state
  const [glowing, setGlowing] = useState(false);
  useEffect(() => {
    if (celebrate) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [celebrate]);

  return (
    <div className="flex flex-col items-center gap-3 relative">
      <div
        className={glowing ? "animate-scoreGlow" : ""}
        style={glowing ? { "--glow-color": color } as React.CSSProperties : undefined}
      >
        <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke="hsl(var(--muted))"
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
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
          <text
            x={radius}
            y={radius - 8}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground font-bold"
            fontSize="36"
            transform={`rotate(90 ${radius} ${radius})`}
          >
            {displayScore}
          </text>
          <text
            x={radius}
            y={radius + 20}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground"
            fontSize="12"
            transform={`rotate(90 ${radius} ${radius})`}
          >
            / 100
          </text>
        </svg>
      </div>
    </div>
  );
}
