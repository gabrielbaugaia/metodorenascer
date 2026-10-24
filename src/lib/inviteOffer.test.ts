import { describe, expect, it } from "vitest";
import { isInOfferWindow } from "./inviteOffer";

// Acesso 30 dias a partir de 01/10, oferta 5 dias antes do fim (26/10 a 31/10)
const start = "2026-10-26T00:00:00Z";
const end = "2026-10-31T00:00:00Z";

describe("oferta de ativação do convite", () => {
  it("não aparece antes da janela", () => expect(isInOfferWindow(start, end, new Date("2026-10-25T23:00:00Z"))).toBe(false));
  it("aparece dentro da janela", () => expect(isInOfferWindow(start, end, new Date("2026-10-28T12:00:00Z"))).toBe(true));
  it("não aparece depois do fim do acesso", () => expect(isInOfferWindow(start, end, new Date("2026-10-31T01:00:00Z"))).toBe(false));
});
