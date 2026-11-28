import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { Program, Review } from "@/hooks/useHyrox90";
import { checkpoints, dateBR, durationOf, reviewStatusLabel } from "@/lib/hyrox90";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
const fields = [
  ["weight", "Peso (kg)"],
  ["waist", "Cintura (cm)"],
  ["abdomen", "Abdômen (cm)"],
  ["running", "Corrida: distância, pace e percepção"],
  ["stations", "Burpees e Wall Balls: evolução e dificuldades"],
  ["strength", "Cargas, repetições e RIR"],
  ["recovery", "Sono, fadiga e dor"],
  ["nutrition", "Adesão percebida, fome e energia (opcional)"],
  ["questions", "Dificuldades e rotina"],
  ["adjustments", "Solicitação de ajustes"],
];
export function HyroxReviews({
  program,
  reviews,
  admin,
  refresh,
}: {
  program: Program;
  reviews: Review[];
  admin: boolean;
  refresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [day, setDay] = useState(30);
  const existing = reviews.find((r) => r.checkpoint === day);
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {checkpoints(program.start_date, durationOf(program.config)).map((c) => (
          <Button
            key={c.day}
            variant={day === c.day ? "default" : "outline"}
            onClick={() => setDay(c.day)}
            className="h-auto py-3 flex-col items-start"
          >
            <span>Revisão {c.day} dias</span>
            <span className="text-xs opacity-80">{dateBR(c.date)}</span>
          </Button>
        ))}
      </div>
      <ReviewForm
        key={`${program.id}-${day}-${existing?.reviewed_at ?? ""}`}
        program={program}
        day={day}
        existing={existing}
        admin={admin}
        refresh={refresh}
        userId={user?.id}
      />
    </section>
  );
}
function ReviewForm({
  program,
  day,
  existing,
  admin,
  refresh,
  userId,
}: {
  program: Program;
  day: number;
  existing?: Review;
  admin: boolean;
  refresh: () => Promise<void>;
  userId?: string;
}) {
  const { isFull } = useEntitlements();
  const readOnly =
    admin || !isFull || !!existing?.reviewed_at || existing?.status === "in_review";
  const [answers, setAnswers] = useState<Record<string, string>>(
    (existing?.responses as Record<string, string>) ?? {},
  );
  const [feedback, setFeedback] = useState(existing?.feedback ?? "");
  const [busy, setBusy] = useState(false);
  async function markInReview() {
    if (!existing) return;
    const { error } = await supabase.from("hyrox_reviews").update({ status: "in_review" }).eq("id", existing.id);
    if (error) return toast.error("Não foi possível atualizar o status.");
    await refresh();
  }
  async function save(review = false) {
    if (!userId) return;
    setBusy(true);
    try {
      const patch = review
        ? {
            feedback,
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
            status: "updated",
          }
        : {
            responses: answers as Json,
            submitted_at: new Date().toISOString(),
            status: "submitted",
          };
      const q = existing
        ? supabase.from("hyrox_reviews").update(patch).eq("id", existing.id)
        : supabase
            .from("hyrox_reviews")
            .insert({ program_id: program.id, checkpoint: day, ...patch });
      const { error } = await q;
      if (error) throw error;
      await refresh();
      toast.success(
        review
          ? "Revisão do treinador registrada."
          : "Revisão enviada para Gabriel.",
      );
    } catch {
      toast.error("Não foi possível salvar a revisão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="text-primary">
          {reviewStatusLabel[(existing?.status ?? "pending") as keyof typeof reviewStatusLabel]}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {fields.map(([key, label]) => (
          <label key={key} className="space-y-2">
            <Label>{label}</Label>
            {key === "weight" || key === "waist" || key === "abdomen" ? (
              <Input
                type="number"
                min={1}
                step="0.1"
                value={answers[key] ?? ""}
                disabled={readOnly}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [key]: e.target.value }))
                }
              />
            ) : (
              <Textarea
                rows={3}
                value={answers[key] ?? ""}
                disabled={readOnly}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [key]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
      </div>
      {!admin && !readOnly && (
        <Button disabled={busy} onClick={() => save()}>
          Enviar revisão
        </Button>
      )}
      {admin ? (
        <div className="space-y-3 border-t border-border pt-5">
          <Label htmlFor="coach-feedback">
            Devolutiva do treinador (visível ao aluno)
          </Label>
          <Textarea
            id="coach-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          {existing?.status === "submitted" && (
            <Button variant="outline" onClick={markInReview}>Marcar como em análise</Button>
          )}
          <Button
            disabled={busy || !existing?.submitted_at}
            onClick={() => save(true)}
          >
            Registrar revisão do treinador
          </Button>
        </div>
      ) : (
        existing?.feedback && (
          <div className="border-l-2 border-primary pl-4">
            <h3 className="font-medium">Devolutiva do treinador</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line mt-2">
              {existing.feedback}
            </p>
          </div>
        )
      )}
    </div>
  );
}
