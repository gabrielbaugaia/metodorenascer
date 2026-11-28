import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rir: string;
  rest: string;
};
export type Workout = {
  key: string;
  name: string;
  instructions: string;
  exercises: Exercise[];
};
export type Baseline = {
  date: string;
  weight: number | null;
  fat: number | null;
  lean: number | null;
  waist: number | null;
  height: number | null;
  source: string;
};
export type Schedule = {
  weekday: number;
  time: string;
  kind: "strength" | "running" | "hyrox";
  workout_key?: string;
};
export type ProgramConfig = {
  phases: { name: string; guidance: string }[];
  workouts: Workout[];
  schedule: Schedule[];
  baseline: Baseline[];
  goal: string;
  external_notes: string;
  safety: string;
  duration_days?: 30 | 60 | 90;
  special_periods?: SpecialPeriod[];
  trainer_guidance?: string;
};
export type SpecialPeriod = {
  start: string;
  end: string;
  title: string;
  guidance: string;
};
export type StationEntry = {
  station: string;
  time_s: number | null;
  distance_m: number | null;
  reps: number | null;
  load_kg: number | null;
  pauses: number | null;
};
export const HYROX_STATIONS = [
  "SkiErg",
  "Sled Push",
  "Sled Pull",
  "Burpee Broad Jump",
  "Remo",
  "Farmers Carry",
  "Sandbag Lunges",
  "Wall Balls",
];
export function blankStations(): StationEntry[] {
  return HYROX_STATIONS.map((station) => ({
    station,
    time_s: null,
    distance_m: null,
    reps: null,
    load_kg: null,
    pauses: null,
  }));
}
export const durationOf = (c: Pick<ProgramConfig, "duration_days">) =>
  c.duration_days ?? 90;
export function activeSpecialPeriod(c: ProgramConfig, date: string) {
  return (
    c.special_periods?.find((p) => p.start <= date && date <= p.end) ?? null
  );
}
/** "5:40" -> 340 seconds; invalid -> null */
export function paceSeconds(pace: string | null | undefined) {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec((pace ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export function checkinAlerts(c: {
  fatigue: number | null;
  recovery: number | null;
  discomfort: string;
  difficulty: number | null;
}) {
  const out: string[] = [];
  if (c.discomfort.trim()) out.push("Relato de dor ou desconforto");
  if ((c.fatigue ?? 0) >= 4) out.push("Fadiga elevada");
  if (c.recovery !== null && c.recovery <= 2) out.push("Recuperação baixa");
  if ((c.difficulty ?? 0) >= 5) out.push("Queda de desempenho relatada");
  return out;
}
export function previousSets(
  activities: { id: string; status: string; actual_date: string | null; set_entries: unknown }[],
  currentId: string,
  exerciseId: string,
) {
  const prev = activities
    .filter(
      (a) =>
        a.id !== currentId &&
        a.status === "completed" &&
        Array.isArray(a.set_entries) &&
        (a.set_entries as SetEntry[]).some(
          (e) => e.exercise_id === exerciseId && e.done,
        ),
    )
    .sort((a, b) => (b.actual_date ?? "").localeCompare(a.actual_date ?? ""))[0];
  return prev
    ? (prev.set_entries as SetEntry[]).filter(
        (e) => e.exercise_id === exerciseId && e.done,
      )
    : [];
}
export const reviewStatusLabel = {
  pending: "Revisão pendente",
  submitted: "Revisão enviada",
  in_review: "Em análise pelo treinador",
  updated: "Protocolo atualizado",
} as const;
export type SetEntry = {
  exercise_id: string;
  exercise_name: string;
  set: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  done: boolean;
  note: string;
};
export function emptyConfig(): ProgramConfig {
  return {
    phases: [
      { name: "Construção da base", guidance: "" },
      { name: "Força relativa", guidance: "" },
      { name: "Transferência à performance", guidance: "" },
    ],
    workouts: [],
    schedule: [],
    baseline: [],
    goal: "",
    external_notes: "",
    safety: "",
  };
}
export function dayDate(start: string, day: number) {
  return format(addDays(parseISO(start), day - 1), "yyyy-MM-dd");
}
export function checkpoints(start: string, duration = 90) {
  return ([30, 60, 90] as const).filter((d) => d <= duration).map((day) => ({
    day,
    date: dayDate(start, day),
  }));
}
export function phaseDay(start: string, today: string, duration = 90) {
  const elapsed =
    differenceInCalendarDays(parseISO(today), parseISO(start)) + 1;
  const phases = Math.max(1, duration / 30);
  return {
    day: Math.max(0, Math.min(duration, elapsed)),
    phase: Math.max(0, Math.min(phases - 1, Math.floor((elapsed - 1) / 30))),
    upcoming: elapsed < 1,
    ended: elapsed > duration,
  };
}
export function schedule90(start: string, schedule: Schedule[], duration = 90) {
  return Array.from({ length: duration }, (_, i) => dayDate(start, i + 1)).flatMap(
    (date) =>
      schedule
        .filter((item) => item.weekday === parseISO(date).getDay())
        .map((item) => ({
          kind: item.kind,
          workout_key: item.workout_key ?? null,
          planned_date: date,
          planned_time: item.time,
          status: "planned" as const,
        })),
  );
}
export function blankSets(workout?: Workout): SetEntry[] {
  return (
    workout?.exercises.flatMap((ex) =>
      Array.from({ length: ex.sets }, (_, i) => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        set: i + 1,
        weight: null,
        reps: null,
        rir: null,
        done: false,
        note: "",
      })),
    ) ?? []
  );
}
export function participation(
  activities: { status: string; planned_date?: string; kind?: string }[],
  special: SpecialPeriod[] = [],
) {
  const counted = activities.filter(
    (a) =>
      a.status !== "planned_absence" &&
      a.kind !== "checkin" &&
      // planned reductions in special periods never count as missed sessions
      !(
        a.status !== "completed" &&
        a.planned_date &&
        special.some((p) => p.start <= a.planned_date! && a.planned_date! <= p.end)
      ),
  );
  return counted.length
    ? Math.round(
        (counted.filter((a) => a.status === "completed").length /
          counted.length) *
          100,
      )
    : null;
}
export const dateBR = (date: string) => date.split("-").reverse().join("/");
export const kindLabel = {
  strength: "Musculação",
  running: "Corrida",
  hyrox: "HYROX",
  recovery: "Recuperação",
  checkin: "Check-in semanal",
};
export function validateSets(entries: SetEntry[]) {
  if (
    entries.some(
      (e) =>
        (e.weight !== null && (!Number.isFinite(e.weight) || e.weight < 0)) ||
        (e.reps !== null && (!Number.isInteger(e.reps) || e.reps < 0)) ||
        (e.rir !== null &&
          (!Number.isFinite(e.rir) || e.rir < 0 || e.rir > 10)),
    )
  )
    throw new Error("Confira carga, repetições e RIR (0–10).");
}
