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
}

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
    restSeconds: number
  ) => void;
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
}: ExerciseSetTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const nextSet = completedSets.length + 1;
  const allDone = completedSets.length >= totalSets;

  // Parse prescribed reps for default value
  const defaultReps = parseInt(prescribedReps) || 12;

  const [weights, setWeights] = useState<Record<number, string>>({});
  const [reps, setReps] = useState<Record<number, string>>({});

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
    onLogSet(exerciseName, setNum, w, r, restSeconds);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-xl border transition-all",
          allDone
            ? "border-primary/30 bg-primary/5"
            : "border-border/50 bg-card"
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer select-none">
            <div className="flex items-center gap-2 min-w-0">
              {allDone ? (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Dumbbell className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  "font-medium text-sm truncate",
                  allDone && "text-primary"
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
                  allDone && "bg-primary/20 text-primary border-primary/30"
                )}
              >
                {completedSets.length}/{totalSets}
              </Badge>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
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
                Última carga: <span className="text-primary font-semibold">{lastWeight} kg</span>
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
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
                  </div>
                );
              }

              if (isNext && !allDone) {
                return (
                  <div
                    key={setNum}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/30"
                  >
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
                      variant="fire"
                      className="h-8 px-3 text-xs ml-auto"
                      disabled={!canLog}
                      onClick={() => handleLog(setNum)}
                    >
                      OK
                    </Button>
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
