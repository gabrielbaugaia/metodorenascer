import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import {
  TrainingAvailabilityFields,
  emptyAvailability,
  type TrainingAvailability,
} from "@/components/anamnese/TrainingAvailabilityFields";

/**
 * Complemento curto para alunos antigos: pede só a disponibilidade de treino.
 * Nunca bloqueia o acesso ao treino atual — na ausência dos dados o motor
 * segue usando o texto livre da anamnese com confiança menor.
 */
export function AvailabilityUpdateCard() {
  const { user } = useAuth();
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<TrainingAvailability>(emptyAvailability);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "anamnese_completa, treino_frequencia_semanal, treino_dias_semana, treino_duracao_sessao_min, treino_dias_consecutivos, treino_max_sessoes_consecutivas, treino_prioridades, treino_equipamentos",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (!active || !data) return;
      const p = data as Record<string, unknown>;
      const missing = !p.treino_frequencia_semanal || !p.treino_duracao_sessao_min ||
        !Array.isArray(p.treino_dias_semana) || (p.treino_dias_semana as string[]).length === 0;
      setNeedsUpdate(Boolean(p.anamnese_completa) && missing);
      setAvailability({
        frequenciaSemanal: p.treino_frequencia_semanal ? String(p.treino_frequencia_semanal) : "",
        diasSemana: Array.isArray(p.treino_dias_semana) ? (p.treino_dias_semana as string[]) : [],
        duracaoSessaoMin: p.treino_duracao_sessao_min ? String(p.treino_duracao_sessao_min) : "",
        diasConsecutivos: typeof p.treino_dias_consecutivos === "boolean"
          ? (p.treino_dias_consecutivos ? "sim" : "nao")
          : "",
        maxSessoesConsecutivas: p.treino_max_sessoes_consecutivas ? String(p.treino_max_sessoes_consecutivas) : "",
        prioridades: (p.treino_prioridades && typeof p.treino_prioridades === "object"
          ? p.treino_prioridades
          : {}) as TrainingAvailability["prioridades"],
        equipamentos: Array.isArray(p.treino_equipamentos) ? (p.treino_equipamentos as string[]) : [],
      });
    })();
    return () => { active = false; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        treino_frequencia_semanal: availability.frequenciaSemanal ? Number(availability.frequenciaSemanal) : null,
        treino_dias_semana: availability.diasSemana.length ? availability.diasSemana : null,
        treino_duracao_sessao_min: availability.duracaoSessaoMin ? Number(availability.duracaoSessaoMin) : null,
        treino_dias_consecutivos: availability.diasConsecutivos ? availability.diasConsecutivos === "sim" : null,
        treino_max_sessoes_consecutivas: availability.maxSessoesConsecutivas
          ? Number(availability.maxSessoesConsecutivas)
          : null,
        treino_prioridades: Object.keys(availability.prioridades).length ? availability.prioridades : null,
        treino_equipamentos: availability.equipamentos.length ? availability.equipamentos : null,
      } as never)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar agora. Tente novamente.");
      return;
    }
    toast.success("Disponibilidade atualizada.");
    setOpen(false);
    setNeedsUpdate(false);
  };

  if (!needsUpdate) return null;

  return (
    <>
      <Card className="border-brand-gold/40">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <CalendarDays className="h-5 w-5 text-brand-gold shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm text-foreground">Atualizar disponibilidade de treino</p>
            <p className="text-xs text-muted-foreground">
              Leva menos de um minuto e deixa o próximo treino mais preciso. Seu treino atual continua disponível.
            </p>
          </div>
          <Button size="sm" className="min-h-11 sm:min-h-9" onClick={() => setOpen(true)}>
            Atualizar
          </Button>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Disponibilidade de treino</SheetTitle>
            <SheetDescription>
              Informe apenas o que mudou. Esses dados orientam o volume e a divisão do seu próximo treino.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <TrainingAvailabilityFields value={availability} onChange={setAvailability} />
            <Button className="w-full min-h-11" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar disponibilidade"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
