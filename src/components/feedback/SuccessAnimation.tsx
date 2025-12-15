import { useEffect, useState } from "react";
import { CheckCircle, Trophy, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  type?: "check" | "trophy" | "flame" | "star";
  message?: string;
  subMessage?: string;
}

export function SuccessAnimation({
  show,
  onComplete,
  type = "check",
  message = "Sucesso!",
  subMessage,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  const icons = {
    check: CheckCircle,
    trophy: Trophy,
    flame: Flame,
    star: Star,
  };

  const colors = {
    check: "text-green-500",
    trophy: "text-yellow-500",
    flame: "text-orange-500",
    star: "text-primary",
  };

  const Icon = icons[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 animate-scale-in">
        {/* Icon with pulse effect */}
        <div className="relative">
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-background to-muted",
              "shadow-xl animate-bounce-in"
            )}
          >
            <Icon className={cn("w-10 h-10", colors[type])} />
          </div>

          {/* Pulse rings */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2 animate-ping opacity-30",
              colors[type].replace("text-", "border-")
            )}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full border animate-pulse opacity-50",
              colors[type].replace("text-", "border-")
            )}
          />
        </div>

        {/* Text */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="text-xl font-bold text-foreground">{message}</p>
          {subMessage && (
            <p className="text-sm text-muted-foreground mt-1">{subMessage}</p>
          )}
        </div>

        {/* Confetti dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full animate-confetti",
                i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-orange-500" : "bg-green-500"
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
