/// <reference types="node" />
import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { ageAt, calculateAssessment, diff, parseDecimal, validateForm } from "./physicalAssessment";

const close = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe("Avaliação física — caso de referência Esdras", () => {
  const age = ageAt("1972-09-30", "2026-10-20");
  const r = calculateAssessment({
    sex: "male", age, weightKg: 85, heightCm: 170,
    skinfolds: { chest: 13, midaxillary: 12, triceps: 7, subscapular: 25, abdominal: 17, suprailiac: 14, thigh: 14 },
    waistCm: 98, hipCm: 98.5,
  });
  test("idade na data é 54", () => assert.equal(age, 54));
  test("soma das dobras 102", () => assert.equal(r.skinfold_sum, 102));
  test("gordura ≈ 17,96%", () => close(r.body_fat_pct, 17.96, 0.02));
  test("massa gorda ≈ 15,26 kg", () => close(r.fat_mass_kg, 15.26, 0.02));
  test("massa livre ≈ 69,74 kg", () => close(r.lean_mass_kg, 69.74, 0.02));
  test("IMC ≈ 29,41", () => close(r.bmi, 29.41, 0.01));
  test("RCQ ≈ 0,995", () => close(r.whr!, 0.995, 0.001));
  test("RCE ≈ 0,576", () => close(r.whtr!, 0.576, 0.001));
});

describe("Regras de entrada", () => {
  test("aceita vírgula decimal", () => assert.equal(parseDecimal("12,5"), 12.5));
  test("rejeita texto", () => assert.ok(Number.isNaN(parseDecimal("12a"))));
  test("idade antes do aniversário não conta o ano", () => assert.equal(ageAt("1972-09-30", "2026-09-29"), 53));
  test("dobra ausente impede cálculo", () => {
    const v = validateForm({ assessed_at: "2026-10-20", birth_date: "1972-09-30", sex: "male", weight: "85", height: "170",
      skinfolds: { chest: "13" }, circumferences: {} });
    assert.equal(v.canCalculate, false);
    assert.ok(v.errors.sf_triceps);
  });
  test("peso fora do limite gera erro", () => {
    const v = validateForm({ assessed_at: "2026-10-20", birth_date: "1972-09-30", sex: "male", weight: "900", height: "170",
      skinfolds: {}, circumferences: {} });
    assert.ok(v.errors.weight);
  });
  test("mulher usa equação feminina", () => {
    const r = calculateAssessment({ sex: "female", age: 30, weightKg: 60, heightCm: 165,
      skinfolds: { chest: 10, midaxillary: 10, triceps: 10, subscapular: 10, abdominal: 10, suprailiac: 10, thigh: 10 } });
    const d = 1.097 - 0.00046971 * 70 + 0.00000056 * 4900 - 0.00012828 * 30;
    close(r.body_fat_pct, 495 / d - 450, 0.01);
  });
  test("diferença percentual correta", () => {
    const d = diff(80, 84);
    assert.equal(d.abs, 4);
    assert.equal(d.pct, 5);
  });
});
