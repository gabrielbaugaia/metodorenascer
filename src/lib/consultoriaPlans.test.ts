/// <reference types="node" />
import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { CONSULTORIA_PLANS, getConsultoriaPlan } from "./consultoriaPlans";

describe("Planos vigentes de consultoria", () => {
  test("Start mantém R$197 e somente cartão recorrente", () => {
    const plan = getConsultoriaPlan("start");
    assert.equal(plan.price, 197);
    assert.deepEqual(plan.modes, ["subscription"]);
  });
  test("Evolution mantém ID mensal, R$297 e Pix/cartão avulsos", () => {
    const plan = getConsultoriaPlan("mensal");
    assert.equal(plan.slug, "mensal");
    assert.equal(plan.price, 297);
    assert.deepEqual(plan.modes, ["pix", "card"]);
  });
  test("Premium mantém R$697 e Pix/cartão avulsos", () => {
    const plan = getConsultoriaPlan("premium");
    assert.equal(plan.price, 697);
    assert.deepEqual(plan.modes, ["pix", "card"]);
  });
  test("Link antigo elite continua selecionando Premium", () => {
    assert.equal(getConsultoriaPlan("elite").slug, "premium");
  });
  test("R$97 não é vendido", () => {
    assert.equal(CONSULTORIA_PLANS.some((plan) => plan.price === 97), false);
  });
  test("Start inclui dieta personalizada sem ajuste alimentar", () => {
    assert.deepEqual(getConsultoriaPlan("start").nutrition, { personalizedDiet: true, monthlyAdjustments: 0 });
  });
  test("Evolution inclui dieta personalizada e 1 ajuste alimentar mensal", () => {
    assert.deepEqual(getConsultoriaPlan("mensal").nutrition, { personalizedDiet: true, monthlyAdjustments: 1 });
  });
  test("Premium inclui dieta personalizada e 1 ajuste alimentar mensal", () => {
    assert.deepEqual(getConsultoriaPlan("premium").nutrition, { personalizedDiet: true, monthlyAdjustments: 1 });
  });
});