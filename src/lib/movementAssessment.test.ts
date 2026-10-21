import { test } from "node:test";
import { strict as assert } from "node:assert";
import { angleFromPoints, VIDEO_POSITIONS } from "./movementAssessment";

test("Rosca Scott não é oferecida como teste", () => assert.equal(VIDEO_POSITIONS.some(p => String(p.key) === "rosca_scott"), false));
test("Desenvolvimento não é oferecido como teste", () => assert.equal(VIDEO_POSITIONS.some(p => String(p.key) === "desenvolvimento_maquina"), false));
test("três pontos perpendiculares medem 90 graus", () => assert.equal(angleFromPoints([{x:0,y:0.5},{x:0.5,y:0.5},{x:0.5,y:0}], 0.5), 90));
test("três pontos alinhados medem 180 graus", () => assert.equal(angleFromPoints([{x:0,y:0.5},{x:0.5,y:0.5},{x:1,y:0.5}], 2), 180));
test("proporção da imagem corrige coordenadas normalizadas", () => assert.ok(Math.abs((angleFromPoints([{x:0,y:0},{x:0.5,y:0.5},{x:1,y:0.5}], 2) ?? 0) - 153.4349488) < 0.0001));
test("pontos coincidentes não produzem medida", () => assert.equal(angleFromPoints([{x:0,y:0},{x:0,y:0},{x:1,y:1}], 1), null));