import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  checkpoints,
  dayDate,
  phaseDay,
  schedule90,
  blankSets,
  participation,
  validateSets,
} from "./hyrox90";
test("início em 01/12/2026 gera revisões em 30/12, 29/01 e 28/02", () =>
  assert.deepEqual(checkpoints("2026-12-01"), [
    { day: 30, date: "2026-12-30" },
    { day: 60, date: "2027-01-29" },
    { day: 90, date: "2027-02-28" },
  ]));
test("90 dias inclusive e fases de 30 dias, sem estender o período", () => {
  assert.equal(dayDate("2026-12-01", 90), "2027-02-28");
  assert.equal(phaseDay("2026-12-01", "2026-12-31").phase, 1);
  assert.equal(phaseDay("2026-12-01", "2027-01-30").phase, 2);
  assert.equal(phaseDay("2026-12-01", "2027-03-01").ended, true);
});
test("corrida segunda, quarta e sábado às 7h não define intensidade ou treino externo", () => {
  const rows = schedule90("2026-12-01", [
    { weekday: 1, time: "07:00", kind: "running" },
    { weekday: 3, time: "07:00", kind: "running" },
    { weekday: 6, time: "07:00", kind: "running" },
  ]);
  assert.equal(rows.length, 38);
  assert.equal(rows[0].planned_date, "2026-12-02");
  assert.ok(
    rows.every((r) => r.workout_key === null && r.planned_time === "07:00"),
  );
  assert.ok(rows.every((r) => r.planned_date <= "2027-02-28"));
});
test("cada série começa sem carga, reps, RIR ou conclusão inventada", () =>
  assert.deepEqual(
    blankSets({
      key: "A",
      name: "A",
      instructions: "",
      exercises: [
        {
          id: "a",
          name: "Supino",
          sets: 3,
          reps: "5–8",
          rir: "2–3",
          rest: "120–180s",
        },
      ],
    }).map((e) => [e.weight, e.reps, e.rir, e.done]),
    [
      [null, null, null, false],
      [null, null, null, false],
      [null, null, null, false],
    ],
  ));
test("férias e ausências planejadas não penalizam participação", () =>
  assert.equal(
    participation([
      { status: "completed" },
      { status: "planned_absence" },
      { status: "planned" },
    ]),
    50,
  ));
test("RIR opcional; valores inválidos são rejeitados sem ajustar carga", () => {
  const e = {
    exercise_id: "a",
    exercise_name: "A",
    set: 1,
    weight: 20,
    reps: 8,
    rir: null,
    done: true,
    note: "",
  };
  validateSets([e]);
  assert.throws(() => validateSets([{ ...e, rir: 11 }]));
  assert.throws(() => validateSets([{ ...e, weight: -1 }]));
  assert.equal(e.weight, 20);
});
test("reprogramar início recalcula somente datas sem compensar férias", () =>
  assert.deepEqual(
    checkpoints("2026-12-08").map((c) => c.date),
    ["2027-01-06", "2027-02-05", "2027-03-07"],
  ));
