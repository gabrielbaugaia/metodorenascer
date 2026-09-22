import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { MUSCLE_LABELS } from "@/lib/prescription/labels";
import type { MuscleKey, MusclePriority } from "@/lib/prescription/types";

export interface TrainingAvailability {
  frequenciaSemanal: string;
  diasSemana: string[];
  duracaoSessaoMin: string;
  diasConsecutivos: string;
  maxSessoesConsecutivas: string;
  prioridades: Partial<Record<MuscleKey, MusclePriority>>;
  equipamentos: string[];
}

export const emptyAvailability: TrainingAvailability = {
  frequenciaSemanal: "",
  diasSemana: [],
  duracaoSessaoMin: "",
  diasConsecutivos: "",
  maxSessoesConsecutivas: "",
  prioridades: {},
  equipamentos: [],
};

const DIAS = [
  { key: "segunda", label: "Seg" },
  { key: "terca", label: "Ter" },
  { key: "quarta", label: "Qua" },
  { key: "quinta", label: "Qui" },
  { key: "sexta", label: "Sex" },
  { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];

const EQUIPAMENTOS = [
  "Máquinas",
  "Pesos livres",
  "Halteres",
  "Barra",
  "Polia/cabos",
  "Peso do corpo",
  "Elásticos",
  "Esteira/bike",
];

const PRIORIDADE_LABEL: Record<MusclePriority, string> = {
  alta: "Foco",
  desenvolvimento: "Normal",
  manutencao: "Manter",
  reduzir: "Reduzir",
};

const PRIORIDADE_ORDER: MusclePriority[] = ["alta", "desenvolvimento", "manutencao", "reduzir"];

const MUSCLE_ORDER: MuscleKey[] = [
  "peito",
  "costas",
  "deltoide_lateral",
  "deltoide_posterior",
  "biceps",
  "triceps",
  "quadriceps",
  "posterior_coxa",
  "gluteos",
  "panturrilhas",
  "abdomen",
];

interface Props {
  value: TrainingAvailability;
  onChange: (value: TrainingAvailability) => void;
}

export function TrainingAvailabilityFields({ value, onChange }: Props) {
  const set = <K extends keyof TrainingAvailability>(key: K, v: TrainingAvailability[K]) =>
    onChange({ ...value, [key]: v });

  const toggleDay = (day: string) => {
    const has = value.diasSemana.includes(day);
    set("diasSemana", has ? value.diasSemana.filter((d) => d !== day) : [...value.diasSemana, day]);
  };

  const toggleEquip = (item: string) => {
    const has = value.equipamentos.includes(item);
    set("equipamentos", has ? value.equipamentos.filter((e) => e !== item) : [...value.equipamentos, item]);
  };

  const cyclePriority = (muscle: MuscleKey) => {
    const current = value.prioridades[muscle] ?? "desenvolvimento";
    const next = PRIORIDADE_ORDER[(PRIORIDADE_ORDER.indexOf(current) + 1) % PRIORIDADE_ORDER.length];
    const prioridades = { ...value.prioridades };
    if (next === "desenvolvimento") delete prioridades[muscle];
    else prioridades[muscle] = next;
    set("prioridades", prioridades);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-foreground" />
          Disponibilidade e Prioridades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="frequencia_semanal">Quantos dias por semana você consegue treinar?</Label>
            <Select value={value.frequenciaSemanal} onValueChange={(v) => set("frequenciaSemanal", v)}>
              <SelectTrigger id="frequencia_semanal" className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}x por semana</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao_sessao">Quanto tempo você tem por treino?</Label>
            <Select value={value.duracaoSessaoMin} onValueChange={(v) => set("duracaoSessaoMin", v)}>
              <SelectTrigger id="duracao_sessao" className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {[30, 40, 45, 60, 75, 90, 120].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} minutos</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias_consecutivos">Aceita treinar em dias seguidos?</Label>
            <Select value={value.diasConsecutivos} onValueChange={(v) => set("diasConsecutivos", v)}>
              <SelectTrigger id="dias_consecutivos" className="h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não, prefiro dias alternados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value.diasConsecutivos === "sim" && (
            <div className="space-y-2">
              <Label htmlFor="max_consecutivos">No máximo quantos dias seguidos?</Label>
              <Select value={value.maxSessoesConsecutivas} onValueChange={(v) => set("maxSessoesConsecutivas", v)}>
                <SelectTrigger id="max_consecutivos" className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} dias</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Quais dias da semana você tem disponíveis?</Label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => {
              const active = value.diasSemana.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Dia disponível: ${d.label}`}
                  onClick={() => toggleDay(d.key)}
                  className={cn(
                    "min-w-11 h-11 px-3 rounded-lg border text-sm transition-colors duration-200",
                    active ? "border-brand-gold bg-brand-gold/15 text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Equipamentos disponíveis no seu local de treino</Label>
          <div className="flex flex-wrap gap-2">
            {EQUIPAMENTOS.map((item) => {
              const active = value.equipamentos.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Equipamento: ${item}`}
                  onClick={() => toggleEquip(item)}
                  className={cn(
                    "h-11 px-3 rounded-lg border text-sm transition-colors duration-200",
                    active ? "border-brand-gold bg-brand-gold/15 text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Prioridade por grupo muscular</Label>
          <p className="text-xs text-muted-foreground">
            Toque para alternar entre Normal, Foco, Manter e Reduzir. Deixe em Normal o que não for prioridade.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MUSCLE_ORDER.map((m) => {
              const p = value.prioridades[m] ?? "desenvolvimento";
              return (
                <button
                  key={m}
                  type="button"
                  aria-label={`Prioridade de ${MUSCLE_LABELS[m]}: ${PRIORIDADE_LABEL[p]}`}
                  onClick={() => cyclePriority(m)}
                  className={cn(
                    "min-h-11 px-3 py-2 rounded-lg border text-left text-sm transition-colors duration-200",
                    p === "alta"
                      ? "border-brand-gold bg-brand-gold/15"
                      : p === "reduzir"
                      ? "border-destructive/50 bg-destructive/10"
                      : p === "manutencao"
                      ? "border-border bg-muted/40"
                      : "border-border",
                  )}
                >
                  <span className="block text-foreground">{MUSCLE_LABELS[m]}</span>
                  <span className="block text-xs text-muted-foreground">{PRIORIDADE_LABEL[p]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
