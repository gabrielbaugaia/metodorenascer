import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildComparison, daysBetween } from "./assessmentComparison";

const row = (id: string, date: string, bf: number, weight: number) => ({ id, assessed_at: date, weight_kg: weight, skinfolds: {}, circumferences: {}, results: { body_fat_pct: bf } } as any);

test("compara antes → depois pela data, mesmo se selecionadas fora de ordem", () => {
  const c = buildComparison(row("b", "2026-11-27", 17.96, 85), row("a", "2026-08-29", 20, 88));
  assert.equal(c.before.id, "a");
  assert.equal(c.days, 90);
  const bf = c.rows.find((r) => r.metric.key === "bf")!;
  assert.equal(Math.round(bf.abs! * 100) / 100, -2.04);
  assert.equal(bf.trend.tone, "good");
  assert.equal(c.rows.find((r) => r.metric.key === "weight")!.trend.tone, "neutral");
});

test("intervalo em dias atravessa mês e ano", () => {
  assert.equal(daysBetween("2025-12-31", "2026-01-30"), 30);
});
