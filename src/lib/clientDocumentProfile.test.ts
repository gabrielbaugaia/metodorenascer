import { test } from "node:test";
import { strict as assert } from "node:assert";
import { documentDates, profileSuggestions, profilePatch, reviewedProfileValues } from "./clientDocumentProfile";

test("relaciona cada medida à data selecionada, não à ordem numérica", () => {
  const data = { key_values: [{ name: "Peso atual — 25/11/2026; 13/08/2026", value: "82,5; 80", unit: "kg" }] };
  assert.equal(profileSuggestions(data, "2026-11-25").weight, "82.5");
  assert.equal(profileSuggestions(data, "2026-08-13").weight, "80");
});
test("não inventa unidade ausente nem normaliza altura contraditória", () => {
  assert.deepEqual(profileSuggestions({ key_values: [{ name: "Peso", value: "82", unit: "não informada" }, { name: "Altura", value: "1,86", unit: "cm" }] }, "2026-11-25"), {});
});
test("converte metros explicitamente informados em centímetros", () => {
  assert.equal(profileSuggestions({ key_values: [{ name: "Altura", value: "1,80", unit: "m" }] }, "2026-11-25").height, "180");
});
test("não associa séries de valores sem correspondência exata de datas", () => {
  assert.deepEqual(profileSuggestions({ key_values: [{ name: "Peso — 13/08/2026; 25/11/2026", value: "80; 81; 82", unit: "kg" }] }, "2026-11-25"), {});
});
test("datas de avaliações reais não são reescritas e datas inválidas são omitidas", () => {
  assert.deepEqual(documentDates("22/11/2022, 25/11/2026, 31/02/2026"), ["2022-11-22", "2026-11-25"]);
});
test("campos vazios não apagam cadastro e valores inválidos são rejeitados", () => {
  assert.deepEqual(profilePatch({ weight: "82,5", height: "" }), { weight: 82.5 });
  assert.throws(() => profilePatch({ body_fat_pct: "100" }));
  assert.throws(() => profilePatch({ age: "37,5" }));
});
test("medidas confirmadas continuam disponíveis após recarga sem recuperar unidades ambíguas", () => {
  assert.deepEqual(reviewedProfileValues({ weight: 96.9, height: 185, waist_cm: 86.5, abdomen_cm: 94, hip_cm: 110 }), { weight: "96.9", height: "185", waist_cm: "86.5", abdomen_cm: "94", hip_cm: "110" });
});