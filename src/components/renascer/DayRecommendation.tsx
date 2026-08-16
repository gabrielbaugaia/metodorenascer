import { Target } from "lucide-react";

interface DayRecommendationProps {
  items: string[];
}

export function DayRecommendation({ items }: DayRecommendationProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-foreground" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Recomendação do Dia
        </h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-foreground mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
