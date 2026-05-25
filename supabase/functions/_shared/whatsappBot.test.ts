// Testes do parser de intents do bot WhatsApp.
// Foca no roteamento e validação — não mocka o cliente Supabase pra
// não acoplar à API. Usamos um fake client minimal pra cada caso.

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { HELP_TEXT, runBot } from "./whatsappBot.ts";

type Row = Record<string, unknown>;

function makeFakeClient(opts: {
  session?: Row | null;
  protocolo?: Row | null;
  completion?: Row | null;
  manualLog?: Row | null;
  streak?: Row | null;
} = {}) {
  const calls: Array<{ op: string; table: string; payload?: unknown }> = [];
  let session = opts.session ?? null;

  function builder(table: string) {
    let filters: Record<string, unknown> = {};
    const b: any = {
      select: () => b,
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return b;
      },
      order: () => b,
      limit: () => b,
      maybeSingle: async () => {
        if (table === "whatsapp_bot_sessions") return { data: session };
        if (table === "protocolos") return { data: opts.protocolo ?? null };
        if (table === "workout_completions") return { data: opts.completion ?? null };
        if (table === "manual_day_logs") return { data: opts.manualLog ?? null };
        if (table === "user_streaks") return { data: opts.streak ?? null };
        return { data: null };
      },
      insert: async (payload: unknown) => {
        calls.push({ op: "insert", table, payload });
        if (table === "whatsapp_bot_sessions") session = payload as Row;
        return { error: null };
      },
      update: (payload: unknown) => {
        calls.push({ op: "update", table, payload });
        return {
          eq: async () => ({ error: null }),
        };
      },
      upsert: async (payload: unknown) => {
        calls.push({ op: "upsert", table, payload });
        if (table === "whatsapp_bot_sessions") session = payload as Row;
        return { error: null };
      },
      delete: () => {
        calls.push({ op: "delete", table });
        if (table === "whatsapp_bot_sessions") session = null;
        return { eq: async () => ({ error: null }) };
      },
    };
    return b;
  }

  return {
    from: (table: string) => builder(table),
    _calls: calls,
    _getSession: () => session,
  } as any;
}

Deno.test("ajuda retorna texto de ajuda", async () => {
  const sb = makeFakeClient();
  const r = await runBot(sb, "u1", "ajuda");
  assertEquals(r, HELP_TEXT);
});

Deno.test("? também retorna ajuda", async () => {
  const sb = makeFakeClient();
  const r = await runBot(sb, "u1", "?");
  assertEquals(r, HELP_TEXT);
});

Deno.test("comando vazio retorna null (silêncio)", async () => {
  const sb = makeFakeClient();
  assertEquals(await runBot(sb, "u1", ""), null);
  assertEquals(await runBot(sb, "u1", null), null);
  assertEquals(await runBot(sb, "u1", "   "), null);
});

Deno.test("mensagem desconhecida retorna null (deixa admin tratar)", async () => {
  const sb = makeFakeClient();
  assertEquals(await runBot(sb, "u1", "oi tudo bem"), null);
  assertEquals(await runBot(sb, "u1", "quero cancelar minha assinatura"), null);
});

Deno.test("treino sem protocolo retorna mensagem amigável", async () => {
  const sb = makeFakeClient({ protocolo: null });
  const r = await runBot(sb, "u1", "treino");
  assertStringIncludes(r ?? "", "ainda não tem um treino");
});

Deno.test("treino com protocolo válido lista exercícios", async () => {
  const sb = makeFakeClient({
    protocolo: {
      conteudo: {
        treinos: [
          {
            letra: "A",
            foco: "Peito e Tríceps",
            exercicios: [
              { nome: "Supino", series: 4, repeticoes: "10-12", descanso: "60s" },
              { nome: "Crucifixo", series: 3, repeticoes: "12", descanso: "45s" },
            ],
          },
        ],
      },
    },
  });
  const r = await runBot(sb, "u1", "treino");
  assertStringIncludes(r ?? "", "Peito");
  assertStringIncludes(r ?? "", "Supino");
  assertStringIncludes(r ?? "", "4x10-12");
  assertStringIncludes(r ?? "", "feito");
});

Deno.test("feito sem completion existente insere e confirma", async () => {
  const sb = makeFakeClient({ completion: null });
  const r = await runBot(sb, "u1", "feito");
  assertStringIncludes(r ?? "", "registrado");
  const inserted = sb._calls.find((c: any) => c.op === "insert" && c.table === "workout_completions");
  assertEquals(!!inserted, true);
});

Deno.test("feito com completion já existente não duplica", async () => {
  const sb = makeFakeClient({ completion: { id: "x" } });
  await runBot(sb, "u1", "feito");
  const inserted = sb._calls.find((c: any) => c.op === "insert" && c.table === "workout_completions");
  assertEquals(inserted, undefined);
});

Deno.test("check-in inicia fluxo e cria session", async () => {
  const sb = makeFakeClient();
  const r = await runBot(sb, "u1", "check-in");
  assertStringIncludes(r ?? "", "energia");
  assertStringIncludes(r ?? "", "7 8 4");
  const upsert = sb._calls.find((c: any) => c.op === "upsert" && c.table === "whatsapp_bot_sessions");
  assertEquals((upsert?.payload as any)?.flow, "checkin");
});

Deno.test("durante check-in, valores numéricos são salvos e session limpa", async () => {
  const sb = makeFakeClient({
    session: { user_id: "u1", flow: "checkin", step: 1, data: {}, expires_at: new Date(Date.now() + 60000).toISOString() },
    manualLog: null,
  });
  const r = await runBot(sb, "u1", "7 8 4");
  assertStringIncludes(r ?? "", "Energia 7");
  assertStringIncludes(r ?? "", "Sono 8h");
  assertStringIncludes(r ?? "", "Estresse 4");
  const inserted = sb._calls.find((c: any) => c.op === "insert" && c.table === "manual_day_logs");
  assertEquals((inserted?.payload as any)?.energy_focus, 7);
  assertEquals((inserted?.payload as any)?.sleep_hours, 8);
  assertEquals((inserted?.payload as any)?.stress_level, 4);
  const del = sb._calls.find((c: any) => c.op === "delete" && c.table === "whatsapp_bot_sessions");
  assertEquals(!!del, true);
});

Deno.test("durante check-in, mensagem inválida pede formato correto", async () => {
  const sb = makeFakeClient({
    session: { user_id: "u1", flow: "checkin", step: 1, data: {}, expires_at: new Date(Date.now() + 60000).toISOString() },
  });
  const r = await runBot(sb, "u1", "oi");
  assertStringIncludes(r ?? "", "energia sono estresse");
  assertStringIncludes(r ?? "", "cancelar");
});

Deno.test("cancelar limpa session", async () => {
  const sb = makeFakeClient({
    session: { user_id: "u1", flow: "checkin", step: 1, data: {}, expires_at: new Date(Date.now() + 60000).toISOString() },
  });
  const r = await runBot(sb, "u1", "cancelar");
  assertStringIncludes(r ?? "", "cancelado");
});

Deno.test("session expirada é ignorada", async () => {
  const sb = makeFakeClient({
    session: { user_id: "u1", flow: "checkin", step: 1, data: {}, expires_at: new Date(Date.now() - 60000).toISOString() },
  });
  // Como expirou, "oi" não está em fluxo, deve devolver null (silêncio)
  const r = await runBot(sb, "u1", "oi");
  assertEquals(r, null);
});

Deno.test("valores de check-in fora do range são clampados", async () => {
  const sb = makeFakeClient({
    session: { user_id: "u1", flow: "checkin", step: 1, data: {}, expires_at: new Date(Date.now() + 60000).toISOString() },
    manualLog: null,
  });
  const r = await runBot(sb, "u1", "99 25 99");
  assertStringIncludes(r ?? "", "Energia 10");
  assertStringIncludes(r ?? "", "Sono 24h");
  assertStringIncludes(r ?? "", "Estresse 10");
});

Deno.test("variações de comando treino", async () => {
  for (const cmd of ["treino", "meu treino", "treino de hoje", "TREINO", "Qual meu treino"]) {
    const sb = makeFakeClient({ protocolo: null });
    const r = await runBot(sb, "u1", cmd);
    assertStringIncludes(r ?? "", "treino", `falhou para "${cmd}"`);
  }
});

Deno.test("variações de feito", async () => {
  for (const cmd of ["feito", "FEITO", "terminei", "concluí", "fiz", "ok"]) {
    const sb = makeFakeClient({ completion: { id: "x" } });
    const r = await runBot(sb, "u1", cmd);
    assertStringIncludes(r ?? "", "registrado", `falhou para "${cmd}"`);
  }
});
