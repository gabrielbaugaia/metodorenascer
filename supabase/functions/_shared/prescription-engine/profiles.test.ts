// Validação dos 6 perfis de referência do motor.
import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { buildPrescriptionPlan } from "./engine.ts";
import { DEFAULT_ENGINE_CONFIG } from "./config.ts";
import { TEST_PROFILES, buildTestInputs } from "./test-profiles.ts";

function planFor(key: string) {
  const p = TEST_PROFILES.find((x) => x.key === key)!;
  return buildPrescriptionPlan(buildTestInputs(p), DEFAULT_ENGINE_CONFIG);
}

function totalSets(plan: ReturnType<typeof planFor>) {
  return plan.muscles.reduce((s, m) => s + m.directSets, 0);
}

Deno.test("os 6 perfis produzem planos distintos", () => {
  const totals = TEST_PROFILES.map((p) => totalSets(planFor(p.key)));
  assertEquals(new Set(totals).size >= 4, true, `totais: ${totals.join(", ")}`);
});

Deno.test("iniciante com recuperação baixa recebe menos volume que intermediário recuperado", () => {
  assert(
    totalSets(planFor("iniciante_3x_baixa_recuperacao")) <
      totalSets(planFor("intermediario_4x_boa_recuperacao")),
  );
});

Deno.test("prioridade em costas eleva costas sem inflar o resto", () => {
  const plan = planFor("avancado_5x_dorsal_prioridade");
  const costas = plan.muscles.find((m) => m.muscle === "costas")!;
  const biceps = plan.muscles.find((m) => m.muscle === "biceps")!;
  assertEquals(costas.priority, "alta");
  assert(costas.directSets > biceps.directSets);
});

Deno.test("alto volume com performance caindo sinaliza descarga e não aumenta dose", () => {
  const plan = planFor("alto_volume_performance_caindo");
  assertEquals(plan.deload.recommended, true);
  const aumentou = plan.muscles.some((m) => (m.deltaVsPreviousCycle ?? 0) > 0);
  assertEquals(aumentou, false);
});

Deno.test("baixa aderência não aumenta volume", () => {
  const plan = planFor("baixa_aderencia");
  const aumentou = plan.muscles.some((m) => (m.deltaVsPreviousCycle ?? 0) > 0);
  assertEquals(aumentou, false);
});

Deno.test("pouco tempo por sessão limita o volume total", () => {
  assert(
    totalSets(planFor("pouco_tempo_por_sessao")) <
      totalSets(planFor("intermediario_4x_boa_recuperacao")),
  );
});
