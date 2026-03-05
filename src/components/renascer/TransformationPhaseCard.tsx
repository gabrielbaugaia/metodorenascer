import { useTransformationJourney } from "@/hooks/useTransformationJourney";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Award, Rocket, Flame, Crown } from "lucide-react";

const PHASE_ICONS = {
  installation: Rocket,
  consolidation: Flame,
  identity: Crown,
};

export function TransformationPhaseCard() {
  const {
    journey,
    currentDay,
    phase,
    phaseLabel,
    phaseMessage,
    badges,
    progress,
    isCompleted,
    isLoading,
    startJourney,
    isStarting,
  } = useTransformationJourney();

  if (isLoading) return null;

  // No journey yet — show start CTA
  if (!journey) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Jornada 90 Dias</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Inicie sua transformação comportamental de 90 dias. Construa hábitos, fortaleça disciplina e transforme sua identidade.
        </p>
        <Button size="sm" onClick={() => startJourney()} disabled={isStarting} className="w-full">
          {isStarting ? "Iniciando..." : "Iniciar Jornada"}
        </Button>
      </div>
    );
  }

  const PhaseIcon = phase ? PHASE_ICONS[phase] : Rocket;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhaseIcon className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">{phaseLabel}</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Dia {currentDay} / 90
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <p className="text-xs text-muted-foreground italic">"{phaseMessage}"</p>

      {/* Badge milestones */}
      <div className="flex gap-2 flex-wrap">
        {badges.map((b) => (
          <div
            key={b.badge}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
              b.earned
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Award className="h-3 w-3" />
            {b.label}
          </div>
        ))}
      </div>

      {isCompleted && (
        <p className="text-xs text-primary font-semibold text-center">
          🎉 Jornada completa! A disciplina se tornou sua identidade.
        </p>
      )}
    </div>
  );
}
