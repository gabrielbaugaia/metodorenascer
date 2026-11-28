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
};
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
export function checkpoints(start: string) {
  return ([30, 60, 90] as const).map((day) => ({
    day,
    date: dayDate(start, day),
  }));
}
export function phaseDay(start: string, today: string) {
  const elapsed =
    differenceInCalendarDays(parseISO(today), parseISO(start)) + 1;
  return {
    day: Math.max(0, Math.min(90, elapsed)),
    phase: Math.max(0, Math.min(2, Math.floor((elapsed - 1) / 30))),
    upcoming: elapsed < 1,
    ended: elapsed > 90,
  };
}
export function schedule90(start: string, schedule: Schedule[]) {
  return Array.from({ length: 90 }, (_, i) => dayDate(start, i + 1)).flatMap(
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
export function participation(activities: { status: string }[]) {
  const counted = activities.filter((a) => a.status !== "planned_absence");
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
