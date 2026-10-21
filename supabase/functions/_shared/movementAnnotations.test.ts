import { test } from "node:test";
import { strict as assert } from "node:assert";
import { sanitizePostureAnnotations, type PostureAnnotation } from "./movementAnnotations.ts";
const valid: PostureAnnotation = { id: "suggestion", media_id: "photo-1", label: "Ombros", points: [{ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.3 }], observation: "Linha visível", explanation: "Observação do alinhamento na foto", confidence: "moderada" };
test("sugestões mantêm coordenadas sem produzir graus", () => {
  const result = sanitizePostureAnnotations([valid], ["photo-1"]);
  assert.deepEqual(result[0].points, valid.points);
  assert.equal("degrees" in result[0], false);
});
test("marcações só pertencem às fotos da avaliação", () => assert.equal(sanitizePostureAnnotations([valid], ["other-photo"]).length, 0));
test("pontos fora da imagem são descartados", () => assert.equal(sanitizePostureAnnotations([{ ...valid, points: [{ x: -0.2, y: 0.3 }, { x: 0.8, y: 0.3 }] }], ["photo-1"]).length, 0));
test("linhas exigem dois pontos distintos", () => assert.equal(sanitizePostureAnnotations([{ ...valid, points: [valid.points[0], valid.points[0]] }], ["photo-1"]).length, 0));