import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Dumbbell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SetLog {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  repsDone: number;
  restSeconds: number;
  restRespected: boolean;
  completedAt: Date;
  rir?: number | null;
}

/** Escala simples de esforço. Opcional: o aluno conclui o treino sem preencher. */
const RIR_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

interface ExerciseSetTrackerProps {
  exerciseName: string;
  totalSets: number;
  prescribedReps: string;
  prescribedRest: string;
  restSeconds: number;
  completedSets: SetLog[];
  lastWeight: number;
  canLog: boolean;
  onLogSet: (
    exerciseName: string,
    setNumber: number,
    weightKg: number,
    repsDone: number,
    restSeconds: number,
    rir?: number | null
  ) => void;
  onExerciseClick?: (exerciseName: string) => void;
}

export function ExerciseSetTracker({
  exerciseName,
  totalSets,
  prescribedReps,
  prescribedRest,
  restSeconds,
  completedSets,
  lastWeight,
  canLog,
  onLogSet,
  onExerciseClick,
}: ExerciseSetTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const nextSet = completedSets.length + 1;
  const allDone = completedSets.length >= totalSets;

  // Parse prescribed reps for default value
  const defaultReps = parseInt(prescribedReps) || 12;

  const [weights, setWeights] = useState<Record<number, string>>({});
  const [reps, setReps] = useState<Record<number, string>>({});
  const [rirBySet, setRirBySet] = useState<Record<number, number>>({});

  const getWeight = (setNum: number) => {
    if (weights[setNum] !== undefined) return weights[setNum];
    // Use last logged weight from this session or previous
    const lastInSession = completedSets.length > 0
      ? completedSets[completedSets.length - 1].weightKg
      : lastWeight;
    return String(lastInSession || 0);
  };

  const getReps = (setNum: number) => {
    if (reps[setNum] !== undefined) return reps[setNum];
    return String(defaultReps);
  };

  const handleLog = (setNum: number) => {
    const w = parseFloat(getWeight(setNum)) || 0;
    const r = parseInt(getReps(setNum)) || 0;
    const rir = rirBySet[setNum];
    onLogSet(exerciseName, setNum, w, r, restSeconds, rir === undefined ? null : rir);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-xl border transition-all",
          allDone
            ? "border-foreground/30 bg-foreground/5"
            : "border-border/50 bg-card"
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={(e) => { if (onExerciseClick) { e.stopPropagation(); onExerciseClick(exerciseName); } }}>
            <div className="flex items-center gap-2 min-w-0">
              {allDone ? (
                <CheckCircle2 className="w-5 h-5 text-brand-gold shrink-0" />
              ) : (
                <Dumbbell className="w-5 h-5 text-brand-gold shrink-0" />
              )}
              <span
                className={cn(
                  "font-medium text-sm truncate",
                  allDone && "text-foreground"
                )}
              >
                {exerciseName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={allDone ? "default" : "outline"}
                className={cn(
                  "text-xs",
                  allDone && "bg-foreground/20 text-foreground border-foreground/30"
                )}
              >
                {completedSets.length}/{totalSets}
              </Badge>
               <ChevronDown
                 className={cn(
                   "w-4 h-4 text-brand-gold",
                   isOpen && "rotate-180"
                 )}
               />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Prescribed info */}
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{totalSets} séries</span>
              <span>{prescribedReps} reps</span>
              <span>{prescribedRest} descanso</span>
            </div>

            {lastWeight > 0 && (
              <p className="text-xs text-muted-foreground">
                Última carga: <span className="text-foreground font-semibold">{lastWeight} kg</span>
              </p>
            )}

            {/* Sets */}
            {Array.from({ length: totalSets }, (_, i) => i + 1).map((setNum) => {
              const completed = completedSets.find(
                (s) => s.setNumber === setNum
              );
              const isNext = setNum === nextSet;

              if (completed) {
                return (
                  <div
                    key={setNum}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/10 border border-foreground/20"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span className="text-xs text-muted-foreground w-12">
                      Série {setNum}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {completed.weightKg} kg
                    </span>
                    <span className="text-xs text-muted-foreground">×</span>
                    <span className="text-sm font-semibold text-foreground">
                      {completed.repsDone} reps
                    </span>
                    {completed.rir !== null && completed.rir !== undefined && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        RIR {completed.rir >= 4 ? "4+" : completed.rir}
                      </span>
                    )}
                  </div>
                );
              }

              if (isNext && !allDone) {
                return (
                  <div
                    key={setNum}
                    className="px-3 py-2 rounded-lg border border-border/50 bg-muted/30 space-y-2"
                  >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">
                      Série {setNum}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="kg"
                      className="w-16 h-8 text-sm text-center"
                      value={getWeight(setNum)}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [setNum]: e.target.value,
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="reps"
                      className="w-14 h-8 text-sm text-center"
                      value={getReps(setNum)}
                      onChange={(e) =>
                        setReps((prev) => ({
                          ...prev,
                          [setNum]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 px-3 text-xs ml-auto"
                      disabled={!canLog}
                      onClick={() => handleLog(setNum)}
                    >
                      OK
                    </Button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground mr-1">
                        Esforço (opcional) — repetições que sobraram:
                      </span>
                      {RIR_OPTIONS.map((opt) => {
                        const active = rirBySet[setNum] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-label={`Registrar RIR ${opt.label} na série ${setNum}`}
                            aria-pressed={active}
                            onClick={() =>
                              setRirBySet((prev) => {
                                const next = { ...prev };
                                if (active) delete next[setNum];
                                else next[setNum] = opt.value;
                                return next;
                              })
                            }
                            className={cn(
                              "min-w-11 h-9 px-2 rounded-lg border text-xs transition-colors duration-200",
                              active
                                ? "border-brand-gold bg-brand-gold/15 text-foreground"
                                : "border-border/50 text-muted-foreground"
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Future sets
              return (
                <div
                  key={setNum}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20 opacity-40"
                >
                  <span className="text-xs text-muted-foreground w-12">
                    Série {setNum}
                  </span>
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
