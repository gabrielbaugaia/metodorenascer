import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkoutFeedback {
  rpe: number | null;
  difficulty: "facil" | "adequado" | "dificil" | null;
  discomfort: boolean;
  discomfort_detail: string;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSubmit: (feedback: WorkoutFeedback) => void;
}

const DIFFICULTY = [
  { value: "facil", label: "Fácil" },
  { value: "adequado", label: "Adequado" },
  { value: "dificil", label: "Difícil" },
] as const;

export function WorkoutFeedbackDialog({ open, onOpenChange, saving, onSubmit }: Props) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<WorkoutFeedback["difficulty"]>(null);
  const [discomfort, setDiscomfort] = useState(false);
  const [detail, setDetail] = useState("");
  const [notes, setNotes] = useState("");

  const chip = (selected: boolean) =>
    cn(
      "h-10 rounded-md border text-sm transition-colors duration-200",
      selected ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Como foi o treino?</DialogTitle>
          <DialogDescription>Suas respostas ajudam o Gabriel Baú a ajustar os próximos treinos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Percepção de esforço (1 a 10)</Label>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={chip(rpe === n)} onClick={() => setRpe(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dificuldade</Label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY.map((d) => (
                <button key={d.value} type="button" className={chip(difficulty === d.value)} onClick={() => setDifficulty(d.value)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sentiu algum desconforto ou dor?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={chip(!discomfort)} onClick={() => setDiscomfort(false)}>Não</button>
              <button type="button" className={chip(discomfort)} onClick={() => setDiscomfort(true)}>Sim</button>
            </div>
            {discomfort && (
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 500))}
                placeholder="Onde e em qual exercício?"
                rows={2}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Algo que precisa ser ajustado? (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Carga, exercício, tempo, equipamento..."
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={saving}
            onClick={() =>
              onSubmit({ rpe, difficulty, discomfort, discomfort_detail: discomfort ? detail.trim() : "", notes: notes.trim() })
            }
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar e concluir treino
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
