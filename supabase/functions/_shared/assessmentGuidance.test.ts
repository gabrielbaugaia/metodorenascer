import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { bmiBand, bodyFatBand, buildAssessmentGuidance } from "./assessmentGuidance.ts";

Deno.test("faixa de gordura masculina elevada a partir de 25%", () => {
  assertEquals(bodyFatBand(24.9, "male"), "adequado");
  assertEquals(bodyFatBand(25, "male"), "elevado");
});
Deno.test("faixa de gordura feminina elevada a partir de 32%", () => {
  assertEquals(bodyFatBand(31.9, "female"), "adequado");
  assertEquals(bodyFatBand(32, "female"), "elevado");
});
Deno.test("IMC 30 é obesidade", () => {
  assertEquals(bmiBand(29.9), "sobrepeso");
  assertEquals(bmiBand(30), "obesidade");
});
Deno.test("gordura elevada gera déficit na dieta", () => {
  const g = buildAssessmentGuidance({ assessed_at: "2026-10-01", sex: "male", weight_kg: 90, results: { body_fat_pct: 28, bmi: 29 } }, "nutricao");
  assertStringIncludes(g, "déficit calórico moderado");
});
Deno.test("sem avaliação não gera orientação", () => {
  assertEquals(buildAssessmentGuidance(null, "treino"), "");
});
