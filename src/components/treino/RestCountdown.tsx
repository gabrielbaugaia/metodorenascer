import { cn } from "@/lib/utils";

interface RestCountdownProps {
  remainingSeconds: number;
  totalSeconds: number;
  exerciseName: string;
  variant?: "fullscreen" | "inline";
}

const MOTIVATIONAL = [
  "Respire fundo...",
  "Recupere-se para a próxima série 💪",
  "Descanso é parte do treino!",
  "Foco no objetivo!",
  "Você está evoluindo!",
];

export function RestCountdown({
  remainingSeconds,
  totalSeconds,
  exerciseName,
  variant = "fullscreen",
}: RestCountdownProps) {
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;
  const isInline = variant === "inline";
  const radius = isInline ? 38 : 58;
  const viewBox = isInline ? "0 0 88 88" : "0 0 128 128";
  const center = isInline ? 44 : 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `${seconds}`;

  const motivational =
    MOTIVATIONAL[Math.floor(remainingSeconds / 5) % MOTIVATIONAL.length];

  if (isInline) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox={viewBox}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="5"
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {timeDisplay}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic text-center">{motivational}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-fade-in">
      {/* Circular progress */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox={viewBox}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground tabular-nums">
            {timeDisplay}
          </span>
          <span className="text-xs text-muted-foreground mt-1">segundos</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center space-y-2 max-w-xs px-4">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">
          Intervalo de Descanso
        </p>
        <p className="text-xs text-muted-foreground">{exerciseName}</p>
        <p className="text-sm text-muted-foreground italic">{motivational}</p>
      </div>
    </div>
  );
}
