import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  classification: string;
  statusText: string;
}

export function StatusBadge({ classification, statusText }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    ELITE: "bg-primary/20 text-primary border-primary/40",
    ALTO: "bg-green-500/20 text-green-400 border-green-500/40",
    MODERADO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    RISCO: "bg-red-500/20 text-red-400 border-red-500/40",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border",
          styles[classification] ?? styles.MODERADO
        )}
      >
        {classification}
      </span>
      <p className="text-sm font-semibold text-foreground tracking-wide">{statusText}</p>
    </div>
  );
}
