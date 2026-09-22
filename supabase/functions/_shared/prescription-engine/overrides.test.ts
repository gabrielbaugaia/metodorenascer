// Overrides humanos e gate de segurança.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildPrescriptionPlan } from "./engine.ts";
import { evaluateGate } from "./gate.ts";
import { normalizeOverrides } from "./overrides.ts";
import { buildShadowDiff, currentVolumeFromProtocol } from "./shadow.ts";
import { TEST_PROFILES, buildTestInputs } from "./test-profiles.ts";
import { EMPTY_OVERRIDES, type EngineInputs } from "./types.ts";

function inputs(key = "intermediario_4x_boa_recuperacao"): EngineInputs {
  const profile = TEST_PROFILES.find((p) => p.key === key)!;
  return buildTestInputs(profile);
}

Deno.test("trava de volume do treinador vence o motor", () => {
  const i = inputs();
  i.overrides = {
    ...structuredClone(EMPTY_OVERRIDES),
    muscles: { peito: { lockedSets: 20 } },
  };
  const plan = buildPrescriptionPlan(i);
  const peito = plan.muscles.find((m) => m.muscle === "peito")!;
  assertEquals(peito.directSets, 20);
  assertEquals(peito.source, "override");
  assert(plan.overridesApplied.some((t) => t.includes("Peitoral")));
});

Deno.test("piso e teto manuais são respeitados", () => {
  const i = inputs();
  i.overrides = {
    ...structuredClone(EMPTY_OVERRIDES),
    muscles: { biceps: { minSets: 14 }, quadriceps: { maxSets: 6 } },
  };
  const plan = buildPrescriptionPlan(i);
  assert(plan.muscles.find((m) => m.muscle === "biceps")!.directSets >= 14);
  assert(plan.muscles.find((m) => m.muscle === "quadriceps")!.directSets <= 6);
});

Deno.test("treinador pode forçar e pode ignorar a descarga", () => {
  const forced = buildPrescriptionPlan({
    ...inputs(),
    overrides: { ...structuredClone(EMPTY_OVERRIDES), deloadDirective: "forcar" },
  });
  assert(forced.deload.recommended);

  const caindo = inputs("alto_volume_performance_caindo");
  assert(buildPrescriptionPlan(caindo).deload.recommended);
  const ignored = buildPrescriptionPlan({
    ...caindo,
    overrides: { ...structuredClone(EMPTY_OVERRIDES), deloadDirective: "ignorar" },
  });
  assertEquals(ignored.deload.recommended, false);
});

Deno.test("frequência travada pelo treinador substitui o cálculo", () => {
  const plan = buildPrescriptionPlan({
    ...inputs(),
    overrides: { ...structuredClone(EMPTY_OVERRIDES), lockedFrequency: 3 },
  });
  assertEquals(plan.weeklyFrequency, 3);
});

Deno.test("gate bloqueia relato clínico e sinaliza revisão em baixa aderência", () => {
  const clinico = inputs();
  clinico.injuries = "hérnia de disco com dor aguda";
  clinico.painReports = ["hérnia de disco com dor aguda"];
  const planClinico = buildPrescriptionPlan(clinico);
  assertEquals(evaluateGate(planClinico, clinico).status, "BLOQUEADO");

  const baixa = inputs("baixa_aderencia");
  const gate = evaluateGate(buildPrescriptionPlan(baixa), baixa);
  assertEquals(gate.status, "REQUER_REVISAO");
  assert(gate.reasons.length > 0);
});

Deno.test("gate bloqueia conflito entre agenda e frequência", () => {
  const i = inputs();
  i.availableDays = ["segunda", "quarta"];
  i.structured = { ...i.structured, availableDays: true };
  const gate = evaluateGate(buildPrescriptionPlan(i), i);
  assertEquals(gate.status, "BLOQUEADO");
});

Deno.test("normalizeOverrides descarta lixo e mantém o que é válido", () => {
  const ov = normalizeOverrides({
    muscle_locks: { peito: { lockedSets: 12 }, inexistente: { lockedSets: 9 }, costas: {} },
    locked_frequency: 12,
    excluded_exercises: ["Agachamento livre"],
    locked_exercises: [],
    deload_directive: "qualquer",
  });
  assertEquals(ov.muscles.peito?.lockedSets, 12);
  assertEquals(Object.keys(ov.muscles).length, 1);
  assertEquals(ov.lockedFrequency, null);
  assertEquals(ov.deloadDirective, null);
  assertEquals(ov.excludedExercises.length, 1);
});

Deno.test("shadow diff compara protocolo atual com a sugestão sem tocar em dados", () => {
  const i = inputs();
  const plan = buildPrescriptionPlan(i);
  const current = currentVolumeFromProtocol({
    id: "abc",
    created_at: "2026-01-01",
    prescription_meta: { plan: { muscles: [{ muscle: "peito", directSets: 6, frequency: 1 }] } },
  });
  assertEquals(current.source, "motor");
  const diff = buildShadowDiff(plan, current);
  const peito = diff.find((r) => r.muscle === "peito")!;
  assertEquals(peito.currentSets, 6);
  assertEquals(peito.diff, peito.suggestedSets - 6);
  assert(peito.reason.length > 0);
});
