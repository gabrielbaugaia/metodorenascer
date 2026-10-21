import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildMovementGuidance, movementExerciseConflicts } from "./movementGuidance.ts";

Deno.test("sem avaliação ou sem achados não gera orientação", () => {
  assertEquals(buildMovementGuidance(null), "");
  assertEquals(buildMovementGuidance({ assessed_at: "2026-10-01", findings: [], restrictions: "", notes: null }), "");
});

Deno.test("achado importante gera restrição de carga axial", () => {
  const g = buildMovementGuidance({
    assessed_at: "2026-10-01",
    findings: [{ key: "valgo", label: "Valgo dinâmico", region: "Joelhos", severity: "importante" }],
    restrictions: "Sem agachamento livre",
    notes: null,
  });
  assert(g.includes("Joelhos: Valgo dinâmico (importante)"));
  assert(g.includes("evitar carga axial alta"));
  assert(g.includes("Sem agachamento livre"));
});

Deno.test("exercício vetado é detectado com acentos em qualquer semana", () => {
  const p = { semanas: [{ dias: [{ exercicios: [{ nome: "Supino máquina" }, { nome: "Rosca Scott" }] }] }] };
  assertEquals(movementExerciseConflicts(p, ["supino maquina"]), ["Supino máquina"]);
});
Deno.test("exercícios não vetados e ausência de veto não bloqueiam", () => {
  assertEquals(movementExerciseConflicts({ treinos: [{ exercicios: [{ nome: "Rosca Scott" }] }] }, ["Supino máquina"]), []);
  assertEquals(movementExerciseConflicts({ treinos: [{ exercicios: [{ nome: "Supino máquina" }] }] }), []);
});
