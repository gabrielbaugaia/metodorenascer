// Bot conversacional do WhatsApp — Etapa 5
// Parser determinístico (sem LLM) de intents pt-BR.
// Usado pelo whatsapp-webhook após inbound identificado a um user_id.
//
// API pública:
//   runBot(supabase, userId, body) -> Promise<string | null>
//     - retorna texto a enviar de volta ao usuário, ou null para silêncio
//       (deixa o admin tratar manualmente no painel).
//
// Tudo aqui usa o service-role client passado por parâmetro.
// Não importa nem chama edge functions externas.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type SB = SupabaseClient<any, "public", any>;

// ---------- intents ----------

const RE_HELP = /^(ajuda|menu|comandos|\?|help)$/i;
const RE_CANCEL = /^cancelar$/i;
const RE_GET_WORKOUT = /^(treino|meu treino|treino de hoje|qual\s*(é|e|)\s*(o\s*)?meu treino|qual treino)$/i;
const RE_LOG_DONE = /^(feito|terminei|conclu[ií]|conclu[ií]do|fiz|✓|ok|done|finalizado|finalizei)$/i;
const RE_START_CHECKIN = /^(check[\s\-]?in|como\s+(t[ôo]|estou)|registrar|diario|diário|di[áa]rio)$/i;
const RE_CHECKIN_VALUES = /^(\d{1,2})\s+(\d{1,2}(?:[.,]\d)?)\s+(\d{1,2})$/;

export const HELP_TEXT = [
  "Comandos disponíveis:",
  "",
  "• *treino* — ver o treino do dia",
  "• *feito* — registrar treino concluído",
  "• *check-in* — registrar energia / sono / estresse",
  "• *cancelar* — abortar fluxo em andamento",
  "• *ajuda* — esta mensagem",
  "",
  "Qualquer outra coisa cai pro Gabriel responder direto.",
].join("\n");

const CHECKIN_PROMPT = [
  "Bora. Manda 3 números separados por espaço:",
  "• energia (1-10)",
  "• sono (horas, pode ser decimal)",
  "• estresse (1-10)",
  "",
  "Ex: *7 8 4*",
].join("\n");

// ---------- helpers ----------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- session ----------

type BotSession = {
  user_id: string;
  flow: string;
  step: number;
  data: Record<string, unknown>;
  expires_at: string;
};

async function getActiveSession(sb: SB, userId: string): Promise<BotSession | null> {
  const { data } = await sb
    .from("whatsapp_bot_sessions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as BotSession;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sb.from("whatsapp_bot_sessions").delete().eq("user_id", userId);
    return null;
  }
  return row;
}

async function setSession(
  sb: SB,
  userId: string,
  flow: string,
  step: number,
  data: Record<string, unknown>,
) {
  await sb.from("whatsapp_bot_sessions").upsert({
    user_id: userId,
    flow,
    step,
    data,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function clearSession(sb: SB, userId: string) {
  await sb.from("whatsapp_bot_sessions").delete().eq("user_id", userId);
}

// ---------- handlers ----------

async function handleGetWorkout(sb: SB, userId: string): Promise<string> {
  const { data: protoRow } = await sb
    .from("protocolos")
    .select("conteudo, data_geracao")
    .eq("user_id", userId)
    .eq("tipo", "treino")
    .eq("ativo", true)
    .order("data_geracao", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!protoRow) {
    return "Você ainda não tem um treino ativo. Avisa o Gabriel.";
  }

  const conteudo = (protoRow as { conteudo: any }).conteudo ?? {};
  const treinos: any[] = Array.isArray(conteudo?.treinos) ? conteudo.treinos : [];
  if (treinos.length === 0) {
    return "Seu protocolo está cadastrado mas sem treinos. Avisa o Gabriel.";
  }

  // Rotação simples: dia da semana (1=seg) mod nº de treinos
  const dow = new Date().getDay(); // 0=dom
  const idx = ((dow === 0 ? 6 : dow - 1) % treinos.length);
  const t = treinos[idx];

  const lines: string[] = [];
  lines.push(`🏋️ Treino ${t.letra ?? String.fromCharCode(65 + idx)} — ${t.foco ?? "Treino do dia"}`);
  lines.push("");
  const exs = Array.isArray(t.exercicios) ? t.exercicios : [];
  exs.slice(0, 12).forEach((ex: any, i: number) => {
    const nome = ex?.nome ?? "Exercício";
    const series = ex?.series ?? "?";
    const reps = ex?.repeticoes ?? "?";
    const desc = ex?.descanso ? ` · ${ex.descanso}` : "";
    lines.push(`${i + 1}. ${nome} — ${series}x${reps}${desc}`);
  });
  if (exs.length > 12) lines.push(`...e mais ${exs.length - 12}`);
  lines.push("");
  lines.push("Quando terminar, manda *feito*.");
  return lines.join("\n");
}

async function handleLogDone(sb: SB, userId: string): Promise<string> {
  const today = todayIso();
  // Evita duplicar no mesmo dia
  const { data: existing } = await sb
    .from("workout_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("workout_date", today)
    .maybeSingle();

  if (!existing) {
    await sb.from("workout_completions").insert({
      user_id: userId,
      workout_date: today,
      workout_name: "Registrado via WhatsApp",
    });
  }

  // Streak (lookup simples)
  const { data: streakRow } = await sb
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .maybeSingle();
  const streak = (streakRow as { current_streak?: number } | null)?.current_streak ?? null;

  const suffix = streak ? ` Streak: ${streak} dias.` : "";
  return `✅ Treino de hoje registrado.${suffix}`;
}

async function handleStartCheckin(sb: SB, userId: string): Promise<string> {
  await setSession(sb, userId, "checkin", 1, {});
  return CHECKIN_PROMPT;
}

async function handleCheckinValues(
  sb: SB,
  userId: string,
  match: RegExpMatchArray,
): Promise<string> {
  const energia = clamp(parseInt(match[1], 10), 1, 10);
  const sono = clamp(parseFloat(match[2].replace(",", ".")), 0, 24);
  const estresse = clamp(parseInt(match[3], 10), 1, 10);
  const today = todayIso();

  // Upsert manual_day_logs do dia
  const { data: existing } = await sb
    .from("manual_day_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const payload = {
    user_id: userId,
    date: today,
    energy_focus: energia,
    sleep_hours: sono,
    stress_level: estresse,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await sb.from("manual_day_logs").update(payload).eq("id", (existing as { id: string }).id);
  } else {
    await sb.from("manual_day_logs").insert(payload);
  }

  await clearSession(sb, userId);
  return `✅ Registrado. Energia ${energia} · Sono ${sono}h · Estresse ${estresse}.`;
}

// ---------- router ----------

export async function runBot(
  sb: SB,
  userId: string,
  rawBody: string | null,
): Promise<string | null> {
  if (!rawBody) return null;
  const body = rawBody.trim();
  if (!body) return null;

  // 1. Comandos universais
  if (RE_HELP.test(body)) return HELP_TEXT;
  if (RE_CANCEL.test(body)) {
    await clearSession(sb, userId);
    return "Fluxo cancelado.";
  }

  // 2. Se tem session ativa, prioriza o fluxo dela
  const session = await getActiveSession(sb, userId);
  if (session?.flow === "checkin") {
    const m = body.match(RE_CHECKIN_VALUES);
    if (m) return handleCheckinValues(sb, userId, m);
    return "Esperando 3 números: energia sono estresse. Ex: *7 8 4*. Digite *cancelar* pra abortar.";
  }

  // 3. Comandos top-level
  if (RE_GET_WORKOUT.test(body)) return handleGetWorkout(sb, userId);
  if (RE_LOG_DONE.test(body)) return handleLogDone(sb, userId);
  if (RE_START_CHECKIN.test(body)) return handleStartCheckin(sb, userId);

  // 4. Nada bateu → silêncio (admin trata manualmente)
  return null;
}
