import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildClientDocumentGuidance, type ReviewedDocument } from "./clientDocumentGuidance.ts";
const document = (id: string): ReviewedDocument => ({ id, category: "exame_medico", title: "Exame", document_date: "2026-11-25", reviewed_summary: "Restrição médica explicitamente registrada", reviewed_profile: {}, extracted_data: { limitations: "Não constitui liberação médica" }, profile_applied_at: null });
test("todos os documentos revisados entram, incluindo o décimo terceiro", () => {
  const docs = Array.from({ length: 25 }, (_, i) => document(`document-${i}`));
  const result = buildClientDocumentGuidance(docs);
  for (const d of docs) assert.ok(result.includes(`fonte ${d.id} |`));
});
test("preserva data, valores confirmados e limitações para prescrição", () => {
  const d = { ...document("example"), reviewed_profile: { weight: 82.5 }, profile_applied_at: "2026-11-28" };
  const result = buildClientDocumentGuidance([d]);
  assert.ok(result.includes('"weight":82.5'));
  assert.ok(result.includes("2026-11-25"));
  assert.ok(result.includes("Não constitui liberação médica"));
});