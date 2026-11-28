import { test } from "node:test";
import { strict as assert } from "node:assert";
const url = process.env.HYROX_TEST_URL;
const token = process.env.HYROX_TEST_TOKEN;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const program = process.env.HYROX_TEST_PROGRAM;
const otherProgram = process.env.HYROX_TEST_OTHER_PROGRAM;
const activity = process.env.HYROX_TEST_ACTIVITY;
const ready = !!(url && token && key && program && otherProgram && activity);
const opts = { skip: !ready };
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  anonymous = false,
) {
  return fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key ?? "",
      ...(!anonymous ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test(
  "aluno lê somente seu protocolo aprovado, sem acesso ao rascunho de outro cliente",
  opts,
  async () => {
    let r = await request(`hyrox_programs?id=eq.${program}&select=id,status`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), [{ id: program, status: "published" }]);
    r = await request(`hyrox_programs?id=eq.${otherProgram}&select=id`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), []);
  },
);
test(
  "anotações internas e documentos de outro aluno não são lidos pelo aluno",
  opts,
  async () => {
    for (const table of ["hyrox_coach_notes", "hyrox_documents"]) {
      const r = await request(
        `${table}?program_id=eq.${otherProgram}&select=id`,
      );
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), []);
    }
  },
);
test(
  "sem login não há leitura de protocolos ou documentos privados",
  opts,
  async () => {
    for (const table of ["hyrox_programs", "hyrox_documents"]) {
      const r = await request(`${table}?select=id`, "GET", undefined, true);
      if (r.status === 200) assert.deepEqual(await r.json(), []);
      else assert.ok(r.status === 401 || r.status === 403);
    }
  },
);
test(
  "aluno não altera prescrição aprovada nem aprova protocolo",
  opts,
  async () => {
    const r = await request(`hyrox_programs?id=eq.${program}`, "PATCH", {
      title: "Mudança não autorizada",
    });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), []);
    const read = await request(`hyrox_programs?id=eq.${program}&select=title`);
    assert.equal((await read.json())[0].title, "Validação isolada — 90 dias");
  },
);
test("aluno não pode escrever devolutiva do treinador", opts, async () => {
  const r = await request("hyrox_reviews", "POST", {
    program_id: program,
    checkpoint: 60,
    feedback: "Revisão indevida",
  });
  assert.ok(r.status >= 400);
});
test("registro rejeita carga negativa e RIR acima de 10", opts, async () => {
  for (const entry of [
    { weight: -1, reps: 8, rir: 3 },
    { weight: 20, reps: 8, rir: 11 },
  ]) {
    const r = await request(`hyrox_activities?id=eq.${activity}`, "PATCH", {
      set_entries: [entry],
    });
    assert.ok(r.status >= 400);
  }
});
test(
  "não permite mover sessão para fora dos 90 dias nem trocar seu protocolo",
  opts,
  async () => {
    let r = await request(`hyrox_activities?id=eq.${activity}`, "PATCH", {
      planned_date: "2027-02-01",
    });
    assert.ok(r.status >= 400);
    r = await request(`hyrox_activities?id=eq.${activity}`, "PATCH", {
      program_id: otherProgram,
    });
    assert.ok(r.status >= 400);
  },
);
test(
  "registro mantém valores por série e histórico após alterações",
  opts,
  async () => {
    const r = await request(
      `hyrox_activities?id=eq.${activity}&select=status,set_entries,rpe`,
    );
    assert.equal(r.status, 200);
    const rows = await r.json();
    assert.equal(rows[0].status, "completed");
    assert.equal(rows[0].rpe, 6);
    assert.equal(rows[0].set_entries[0].weight, 24);
    assert.equal(rows[0].set_entries[0].rir, 3);
    const audit = await request(
      `hyrox_activity_audit?activity_id=eq.${activity}&select=id`,
    );
    assert.equal(audit.status, 200);
    assert.ok((await audit.json()).length >= 2);
  },
);
