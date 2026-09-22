// deno test supabase/functions/_shared/prescription-engine/engine.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildPrescriptionPlan } from "./engine.ts";
import { aggregateVolume } from "./muscles.ts";
import { enforcePlan } from "./enforce.ts";
import { EMPTY_OVERRIDES } from "./types.ts";
import type { EngineInputs, MuscleKey, ReadinessResult } from "./types.ts";

function readiness(score: number, confidence: ReadinessResult["confidence"] = "alta"): ReadinessResult {
  return { score, confidence, signals: [], missing: [] };
}

function baseInputs(over: Partial<EngineInputs> = {}): EngineInputs {
  return {
    age: 30, sex: "masculino", weightKg: 80, heightCm: 178,
    level: "intermediario", objective: "hipertrofia", secondaryObjectives: [],
    trainingLocation: "academia", equipment: [], preferences: null,
    weeklyFrequency: 4, sessionMinutes: 60,
    availableDays: [], allowsConsecutiveDays: null, maxConsecutiveSessions: null,
    effort: { avgRir: null, setsWithRir: 0, totalSets: 0, coveragePct: 0, reading: "desconhecido" },
    structured: {
      weeklyFrequency: true, sessionMinutes: true, availableDays: true,
      priorities: true, equipment: true, consecutiveDays: true,
    },
    injuries: null, medicalRestrictions: null, painReports: [],
    priorities: {}, previousWeeklyVolume: {}, previousPlannedVolume: {},
    adherencePct: 85, sessionsLast4Weeks: 14, progressionSignal: "estavel",
    lastDeloadWeeksAgo: null, readiness: readiness(70),
    trainerDirectives: null, manualProtocol: false,
    overrides: structuredClone(EMPTY_OVERRIDES),
    ...over,
  };
}

function sets(plan: ReturnType<typeof buildPrescriptionPlan>, m: MuscleKey): number {
  return plan.muscles.find((x) => x.muscle === m)?.directSets ?? 0;
}

Deno.test("1. iniciante 3x/semana com recuperação ruim recebe dose baixa", () => {
  const plan = buildPrescriptionPlan(baseInputs({
    level: "iniciante", weeklyFrequency: 3, readiness: readiness(35), adherencePct: null,
  }));
  assert(sets(plan, "peito") <= 10, `peito=${sets(plan, "peito")}`);
  assert(plan.totalDirectSets <= plan.weeklySetCapacity);
});

Deno.test("2. intermediário 4x com boa recuperação recebe mais que o iniciante", () => {
  const low = buildPrescriptionPlan(baseInputs({ level: "iniciante", weeklyFrequency: 3, readiness: readiness(35) }));
  const mid = buildPrescriptionPlan(baseInputs({ readiness: readiness(80) }));
  assert(mid.totalDirectSets > low.totalDirectSets);
});

Deno.test("3. avançado 5x com músculo prioritário concentra volume no foco", () => {
  const plan = buildPrescriptionPlan(baseInputs({
    level: "avancado", weeklyFrequency: 5, sessionMinutes: 75,
    readiness: readiness(85), adherencePct: 95, priorities: { costas: "alta", panturrilhas: "manutencao" },
  }));
  assert(sets(plan, "costas") > sets(plan, "peito"));
  assert(sets(plan, "panturrilhas") < sets(plan, "peito"));
  assertEquals(plan.muscles.find((m) => m.muscle === "costas")?.status, "PRIORIDADE");
});

Deno.test("4. volume alto perdendo performance dispara descarga e reduz dose", () => {
  const plan = buildPrescriptionPlan(baseInputs({
    level: "avancado", previousWeeklyVolume: { peito: 18, costas: 20 },
    previousPlannedVolume: { peito: 18, costas: 20 },
    progressionSignal: "piorando", readiness: readiness(38), adherencePct: 90,
  }));
  assert(plan.deload.recommended, "deload deveria ser sugerido");
  assert(sets(plan, "peito") < 18);
  assertEquals(plan.muscles.find((m) => m.muscle === "peito")?.targetRir, "4");
});

Deno.test("5. aluno que não cumpre o treino não recebe aumento de volume", () => {
  const plan = buildPrescriptionPlan(baseInputs({
    adherencePct: 40, previousPlannedVolume: { peito: 12 }, previousWeeklyVolume: { peito: 6 },
  }));
  assert(sets(plan, "peito") <= 12);
});

Deno.test("6. pouco tempo por sessão limita o volume total à capacidade real", () => {
  const plan = buildPrescriptionPlan(baseInputs({ weeklyFrequency: 3, sessionMinutes: 35 }));
  assert(plan.totalDirectSets <= plan.weeklySetCapacity, `${plan.totalDirectSets} > ${plan.weeklySetCapacity}`);
  assert(plan.weeklySetCapacity < 40);
});

Deno.test("7. prescrição manual do treinador é sinalizada como prioritária", () => {
  const plan = buildPrescriptionPlan(baseInputs({ manualProtocol: true }));
  assert(plan.safetyAlerts.some((a) => a.includes("prioridade absoluta")));
});

Deno.test("8. poucos dados => confiança baixa com motivos explícitos", () => {
  const plan = buildPrescriptionPlan(baseInputs({
    age: null, weightKg: null, heightCm: null, adherencePct: null,
    readiness: readiness(50, "baixa"), previousWeeklyVolume: {},
  }));
  assertEquals(plan.confidence, "baixa");
  assert(plan.confidenceReasons.length > 0);
});

Deno.test("9. limites por sessão e frequência são coerentes", () => {
  const plan = buildPrescriptionPlan(baseInputs({ weeklyFrequency: 4, sessionMinutes: 70 }));
  for (const m of plan.muscles) {
    assert(m.maxSetsPerSession <= 8, `${m.label} acima do teto por sessão`);
    assert(m.frequency >= 1 && m.frequency <= 4);
    assert(m.maxSetsPerSession * m.frequency >= m.directSets - 1, `${m.label} não cabe na frequência`);
  }
});

Deno.test("10. enforcePlan corta séries que a IA excedeu", () => {
  const plan = buildPrescriptionPlan(baseInputs());
  const target = plan.muscles.find((m) => m.muscle === "biceps")!;
  const protocol: Record<string, unknown> = {
    treinos: [{ exercicios: [{ nome: "Rosca direta", series: target.directSets + 6, repeticoes: "10-12" }] }],
  };
  const report = enforcePlan(protocol, plan);
  const generated = report.perMuscle.find((p) => p.muscle === "biceps")!;
  assert(generated.generatedDirect <= target.directSets + 1, `${generated.generatedDirect} vs ${target.directSets}`);
  assert(report.adjustments.length > 0);
});

Deno.test("11. volume equivalente separa série direta de indireta", () => {
  const agg = aggregateVolume([{ name: "Supino reto com barra", sets: 4 }]);
  assertEquals(agg.direct.peito, 4);
  assertEquals(agg.indirect.triceps, 2);
  assertEquals(agg.totalEquivalent.triceps, 2);
});
