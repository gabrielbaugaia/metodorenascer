import { describe, test, expect } from "bun:test";
import { CONSULTORIA_PLANS, getConsultoriaPlan } from "./consultoriaPlans";

describe("Planos vigentes de consultoria", () => {
  test("Start mantém R$197 e somente cartão recorrente", () => {
    const plan = getConsultoriaPlan("start");
    expect(plan.price).toBe(197);
    expect(plan.modes).toEqual(["subscription"]);
  });
  test("Evolution mantém ID mensal, R$297 e Pix/cartão avulsos", () => {
    const plan = getConsultoriaPlan("mensal");
    expect(plan.slug).toBe("mensal");
    expect(plan.price).toBe(297);
    expect(plan.modes).toEqual(["pix", "card"]);
  });
  test("Premium mantém R$697 e Pix/cartão avulsos", () => {
    const plan = getConsultoriaPlan("premium");
    expect(plan.price).toBe(697);
    expect(plan.modes).toEqual(["pix", "card"]);
  });
  test("Link antigo elite continua selecionando Premium", () => {
    expect(getConsultoriaPlan("elite").slug).toBe("premium");
  });
  test("R$97 não é vendido", () => {
    expect(CONSULTORIA_PLANS.some((plan) => plan.price === 97)).toBe(false);
  });
});