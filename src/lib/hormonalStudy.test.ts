import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createStudyNotes } from "./hormonalStudy";

test("trocar de cliente inicia estudo sem dados do cliente anterior", () => {
  const previous = createStudyNotes();
  previous.notes = "Observação privada do cliente anterior";
  previous.substance = "Testosterona enantato";
  const next = createStudyNotes();
  assert.equal(next.notes, "");
  assert.equal(next.substance, "");
  assert.notEqual(previous, next);
});