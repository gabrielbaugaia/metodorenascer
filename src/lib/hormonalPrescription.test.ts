import { test } from "node:test";
import { strict as assert } from "node:assert";
import { addPrescriptionMedication, addPrescriptionWeek, createPrescriptionTable, removePrescriptionMedication, setPrescriptionEntry, resizePrescriptionWeeks } from "./hormonalPrescription";

test("adicionar medicamento e semana não gera doses nem instruções", () => {
  const table = addPrescriptionWeek(addPrescriptionMedication(createPrescriptionTable(), "Medicamento do documento"));
  assert.equal(table.medications[0].instructions, "");
  assert.deepEqual(table.weeks[0].entries, {});
});

test("registro conserva a transcrição sem calcular ou propagar para outra semana", () => {
  let table = addPrescriptionWeek(addPrescriptionMedication(createPrescriptionTable(), "Medicamento do documento"));
  const medication = table.medications[0];
  const week = table.weeks[0];
  table = setPrescriptionEntry(table, week.id, medication.id, "Somente conforme prescrição anexada");
  table = addPrescriptionWeek(table);
  assert.equal(table.weeks[0].entries[medication.id], "Somente conforme prescrição anexada");
  assert.deepEqual(table.weeks[1].entries, {});
});

test("novo rascunho de cliente não herda medicamentos e tabela do anterior", () => {
  const previous = addPrescriptionWeek(addPrescriptionMedication(createPrescriptionTable(), "Registro privado"));
  const next = createPrescriptionTable();
  assert.deepEqual(next, { medications: [], weeks: [] });
  assert.notEqual(previous, next);
});

test("remover medicamento remove também os registros associados na tabela", () => {
  let table = addPrescriptionWeek(addPrescriptionMedication(createPrescriptionTable(), "Registro privado"));
  const id = table.medications[0].id;
  table = setPrescriptionEntry(table, table.weeks[0].id, id, "Registro para remoção");
  table = removePrescriptionMedication(table, id);
  assert.deepEqual(table.medications, []);
  assert.deepEqual(table.weeks[0].entries, {});
});

test("grade de 12 semanas mantém todas as células sem doses automáticas", () => {
  const table = resizePrescriptionWeeks(addPrescriptionMedication(createPrescriptionTable(), "Registro do documento"), 12);
  assert.equal(table.weeks.length, 12);
  assert.ok(table.weeks.every((week) => Object.keys(week.entries).length === 0));
  assert.equal(table.medications[0].instructions, "");
});

test("aumento das semanas preserva transcrição sem copiar para as novas", () => {
  let table = resizePrescriptionWeeks(addPrescriptionMedication(createPrescriptionTable(), "Registro"), 8);
  table = setPrescriptionEntry(table, table.weeks[0].id, table.medications[0].id, "Transcrição literal");
  const next = resizePrescriptionWeeks(table, 10);
  assert.equal(next.weeks[0].entries[table.medications[0].id], "Transcrição literal");
  assert.deepEqual(next.weeks[8].entries, {});
  assert.deepEqual(next.weeks[9].entries, {});
});