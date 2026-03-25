import { cn } from "@/lib/utils";
import { useEffect } from "react";

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
  const isUrgent = remainingSeconds <= 10 && remainingSeconds > 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `${seconds}`;

  const motivational =
    MOTIVATIONAL[Math.floor(remainingSeconds / 5) % MOTIVATIONAL.length];

  // Vibrate at 10s mark
  useEffect(() => {
    if (remainingSeconds === 10 && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }, [remainingSeconds]);

  if (isInline) {
    const inlineR = 38;
    const inlineCirc = 2 * Math.PI * inlineR;
    return (
      <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle cx={44} cy={44} r={inlineR} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle cx={44} cy={44} r={inlineR} fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round" strokeDasharray={inlineCirc} strokeDashoffset={inlineCirc * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">{timeDisplay}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic text-center">{motivational}</p>
      </div>
    );
  }

  // Banner mode — compact fixed top bar, non-blocking
  const bannerR = 18;
  const bannerCirc = 2 * Math.PI * bannerR;
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center gap-3 animate-fade-in transition-colors duration-300",
        isUrgent
          ? "bg-destructive/95 backdrop-blur-sm"
          : "bg-primary/95 backdrop-blur-sm"
      )}
    >
      {/* Mini circular progress */}
      <div className="relative w-9 h-9 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx={22} cy={22} r={bannerR} fill="none" stroke="hsl(0 0% 100% / 0.25)" strokeWidth="3" />
          <circle cx={22} cy={22} r={bannerR} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray={bannerCirc} strokeDashoffset={bannerCirc * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-white tabular-nums">{timeDisplay}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isUrgent ? (
          <p className="text-xs font-bold text-white animate-pulse">
            ⚡ Volte para o foco agora!
          </p>
        ) : (
          <p className="text-xs font-medium text-white/90 truncate">
            Descanso — {exerciseName}
          </p>
        )}
      </div>
    </div>
  );
}
