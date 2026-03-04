import { Dumbbell, Heart, Bone, Scale, Brain, CalendarCheck } from "lucide-react";

interface SubScore {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}

interface SisSubScoreCardsProps {
  mechanical: number | null;
  recovery: number | null;
  structural: number | null;
  bodyComp: number | null;
  cognitive: number | null;
  consistency: number | null;
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export function SisSubScoreCards({ mechanical, recovery, structural, bodyComp, cognitive, consistency }: SisSubScoreCardsProps) {
  const cards: SubScore[] = [
    { label: "Mecânico", value: mechanical, icon: <Dumbbell className="h-4 w-4" /> },
    { label: "Recuperação", value: recovery, icon: <Heart className="h-4 w-4" /> },
    { label: "Estrutural", value: structural, icon: <Bone className="h-4 w-4" /> },
    { label: "Composição", value: bodyComp, icon: <Scale className="h-4 w-4" /> },
    { label: "Cognitivo", value: cognitive, icon: <Brain className="h-4 w-4" /> },
    { label: "Consistência", value: consistency, icon: <CalendarCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(card => (
        <div key={card.label} className="rounded-xl border border-border/50 bg-card p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            {card.icon}
            <span className="text-[11px] font-medium uppercase tracking-wider">{card.label}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {card.value !== null ? Math.round(card.value) : "—"}
          </p>
          {card.value !== null && <ScoreBar value={card.value} />}
        </div>
      ))}
    </div>
  );
}
