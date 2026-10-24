/// <reference types="node" />
import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { isInOfferWindow } from "./inviteOffer";

// Oferta 5 dias antes do fim do acesso (26/10 a 31/10)
const start = "2026-10-26T00:00:00Z";
const end = "2026-10-31T00:00:00Z";

describe("oferta de ativação do convite", () => {
  test("não aparece antes da janela", () => assert.equal(isInOfferWindow(start, end, new Date("2026-10-25T23:00:00Z")), false));
  test("aparece dentro da janela", () => assert.equal(isInOfferWindow(start, end, new Date("2026-10-28T12:00:00Z")), true));
  test("não aparece depois do fim do acesso", () => assert.equal(isInOfferWindow(start, end, new Date("2026-10-31T01:00:00Z")), false));
});
