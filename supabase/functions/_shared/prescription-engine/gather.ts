// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Coleta de entradas: só reutiliza dados que JÁ existem no banco.
// Nada é inventado; ausência vira null e derruba a confiança.
// ============================================================================

import { mergeEngineConfig, type EngineConfig } from "./config.ts";
import { realizedVolumeFromLogs } from "./enforce.ts";
import { computeReadiness } from "./readiness.ts";
import { aggregateVolume } from "./muscles.ts";
import { loadOverrides } from "./overrides.ts";
import type {
  EffortSignal,
  EngineInputs,
  ExperienceLevel,
  MuscleKey,
  MusclePriority,
  Objective,
  StructuredCoverage,
} from "./types.ts";

const VALID_PRIORITIES: MusclePriority[] = ["alta", "desenvolvimento", "manutencao", "reduzir"];

/** Prioridades vindas do campo estruturado da anamnese (jsonb muscle -> priority). */
export function structuredPriorities(raw: unknown): Partial<Record<MuscleKey, MusclePriority>> {
  const out: Partial<Record<MuscleKey, MusclePriority>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const priority = String(v) as MusclePriority;
    if (VALID_PRIORITIES.includes(priority) && priority !== "desenvolvimento") {
      out[k as MuscleKey] = priority;
    }
  }
  return out;
}

/** Leitura do esforço real a partir do RIR registrado pelo aluno. */
export function readEffort(
  rows: { rir: number | null }[],
  cfg: { minSamples: number; highEffortRirMax: number; lowEffortRirMin: number },
): EffortSignal {
  const withRir = rows.map((r) => (r.rir === null || r.rir === undefined ? null : Number(r.rir)))
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  const totalSets = rows.length;
  const setsWithRir = withRir.length;
  const coveragePct = totalSets > 0 ? Math.round((setsWithRir / totalSets) * 100) : 0;
  if (setsWithRir < cfg.minSamples) {
    return { avgRir: setsWithRir ? withRir.reduce((a, b) => a + b, 0) / setsWithRir : null, setsWithRir, totalSets, coveragePct, reading: "desconhecido" };
  }
  const avgRir = withRir.reduce((a, b) => a + b, 0) / setsWithRir;
  const reading: EffortSignal["reading"] = avgRir <= cfg.highEffortRirMax
    ? "muito_alto"
    : avgRir >= cfg.lowEffortRirMin
    ? "baixo"
    : "adequado";
  return { avgRir, setsWithRir, totalSets, coveragePct, reading };
}

// deno-lint-ignore no-explicit-any
type Client = any;

const MUSCLE_ALIASES: { key: MuscleKey; words: string[] }[] = [
  { key: "peito", words: ["peito", "peitoral"] },
  { key: "costas", words: ["costas", "dorsal", "dorsais"] },
  { key: "deltoide_anterior", words: ["ombro anterior", "deltoide anterior"] },
  { key: "deltoide_lateral", words: ["ombro", "ombros", "deltoide", "lateral de ombro"] },
  { key: "deltoide_posterior", words: ["posterior de ombro", "deltoide posterior"] },
  { key: "biceps", words: ["biceps", "bíceps", "braco", "braço", "bracos", "braços"] },
  { key: "triceps", words: ["triceps", "tríceps"] },
  { key: "quadriceps", words: ["quadriceps", "quadríceps", "perna", "pernas", "coxa"] },
  { key: "posterior_coxa", words: ["posterior de coxa", "isquiotibiais", "posteriores"] },
  { key: "gluteos", words: ["gluteo", "glúteo", "gluteos", "glúteos"] },
  { key: "panturrilhas", words: ["panturrilha", "panturrilhas", "gemeos", "gêmeos"] },
  { key: "abdomen", words: ["abdomen", "abdômen", "abdominal", "core", "barriga"] },
];

function normalize(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function parsePriorities(text: string | null): Partial<Record<MuscleKey, MusclePriority>> {
  const out: Partial<Record<MuscleKey, MusclePriority>> = {};
  if (!text) return out;
  const n = normalize(text);
  for (const { key, words } of MUSCLE_ALIASES) {
    for (const w of words) {
      if (!n.includes(normalize(w))) continue;
      const idx = n.indexOf(normalize(w));
      const around = n.slice(Math.max(0, idx - 40), idx + 40);
      if (/(evitar|nao treinar|não treinar|dor|lesao|lesão|parar)/.test(around)) out[key] = "reduzir";
      else if (/(manter|manutencao|manutenção)/.test(around)) out[key] = "manutencao";
      else out[key] = "alta";
      break;
    }
  }
  return out;
}

export function parseLevel(profile: Record<string, unknown>): ExperienceLevel {
  const raw = normalize(
    String(profile.nivel_experiencia || profile.training_level || profile.nivel_condicionamento || ""),
  );
  if (raw.includes("avanc")) return "avancado";
  if (raw.includes("interm")) return "intermediario";
  if (raw.includes("inici") || raw.includes("nunca")) return "iniciante";
  const treinou = normalize(String(profile.ja_treinou_antes || ""));
  if (treinou.includes("nao") || treinou === "false") return "iniciante";
  return "iniciante";
}

export function parseObjective(profile: Record<string, unknown>): Objective {
  const raw = normalize(String(profile.objetivo_principal || profile.objective_primary || profile.goals || ""));
  if (raw.includes("emagre") || raw.includes("perder") || raw.includes("gordura")) return "emagrecimento";
  if (raw.includes("forca") || raw.includes("força")) return "forca";
  if (raw.includes("saude") || raw.includes("saúde") || raw.includes("condicion")) return "saude";
  return "hipertrofia";
}

/** Frequência semanal: campo estruturado primeiro, texto livre como fallback. */
export function resolveWeeklyFrequency(profile: Record<string, unknown>): { value: number; structured: boolean } {
  const direct = Number(profile.treino_frequencia_semanal);
  if (Number.isFinite(direct) && direct >= 1 && direct <= 7) return { value: direct, structured: true };
  const days = profile.treino_dias_semana;
  if (Array.isArray(days) && days.length >= 1) return { value: Math.min(7, days.length), structured: true };
  return { value: parseWeeklyFrequency(profile), structured: false };
}

/** Duração por sessão: campo estruturado primeiro, texto livre como fallback. */
export function resolveSessionMinutes(profile: Record<string, unknown>): { value: number; structured: boolean } {
  const direct = Number(profile.treino_duracao_sessao_min);
  if (Number.isFinite(direct) && direct >= 20 && direct <= 150) return { value: direct, structured: true };
  return { value: parseSessionMinutes(profile), structured: false };
}

export function parseWeeklyFrequency(profile: Record<string, unknown>): number {
  const raw = String(profile.dias_disponiveis || profile.availability || "");
  const m = raw.match(/(\d+)/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 7) return n;
  }
  const days = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
  const n = normalize(raw);
  const count = days.filter((d) => n.includes(d)).length;
  return count >= 1 ? count : 3;
}

export function parseSessionMinutes(profile: Record<string, unknown>): number {
  const raw = String(profile.preferencias_treino || profile.availability || "");
  const m = raw.match(/(\d{2,3})\s*(min|minutos)/i);
  if (m) {
    const n = Number(m[1]);
    if (n >= 20 && n <= 150) return n;
  }
  const h = raw.match(/(\d)\s*(h|hora)/i);
  if (h) return Math.min(120, Number(h[1]) * 60);
  return 60;
}

export interface GatherResult {
  inputs: EngineInputs;
  config: EngineConfig;
  notes: string[];
}

export async function gatherEngineInputs(
  supabase: Client,
  userId: string,
  profile: Record<string, unknown>,
): Promise<GatherResult> {
  const notes: string[] = [];

  // Configuração central (editável pelo admin) com fallback aos defaults.
  let config = mergeEngineConfig(null);
  try {
    const { data } = await supabase
      .from("prescription_engine_config")
      .select("config")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.config) {
      config = mergeEngineConfig(data.config);
      notes.push("configuração do motor carregada do banco");
    }
  } catch {
    notes.push("configuração do motor: usando defaults do código");
  }

  const since28 = new Date(Date.now() - 28 * 86400000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [logsRes, completionsRes, checkinsRes, healthRes, sisRes, prevProtocolRes] = await Promise.all([
    supabase.from("workout_set_logs").select("exercise_name, created_at, weight_kg, reps_done, rir").eq("user_id", userId)
      .gte("created_at", since28),
    supabase.from("workout_completions").select("workout_date, duration_minutes").eq("user_id", userId)
      .gte("workout_date", since30),
    supabase.from("weekly_checkins").select("energy_level, adherence_level, created_at").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(4),
    supabase.from("health_daily").select("date, sleep_minutes, resting_hr, hrv_ms, steps").eq("user_id", userId)
      .gte("date", since30).order("date", { ascending: true }),
    supabase.from("sis_scores_daily").select("shape_intelligence_score, recovery_score").eq("user_id", userId)
      .order("date", { ascending: false }).limit(1),
    supabase.from("protocolos").select("id, conteudo, prescription_meta, created_at").eq("user_id", userId)
      .eq("tipo", "treino").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const logs = (logsRes.data || []) as { exercise_name: string; created_at: string; weight_kg: number | null; reps_done: number | null; rir: number | null }[];
  const previousWeeklyVolume = realizedVolumeFromLogs(logs, 4);
  if (Object.keys(previousWeeklyVolume).length === 0) notes.push("sem histórico de séries nas últimas 4 semanas");

  // Volume planejado no ciclo anterior (do próprio motor, ou inferido do protocolo).
  const previousPlannedVolume: Partial<Record<MuscleKey, number>> = {};
  const prevMeta = prevProtocolRes.data?.prescription_meta as { plan?: { muscles?: { muscle: MuscleKey; directSets: number }[] } } | null;
  if (prevMeta?.plan?.muscles) {
    for (const m of prevMeta.plan.muscles) previousPlannedVolume[m.muscle] = m.directSets;
  } else if (prevProtocolRes.data?.conteudo) {
    const conteudo = prevProtocolRes.data.conteudo as Record<string, unknown>;
    const treinos = (conteudo.treinos as { exercicios?: { nome?: string; series?: number }[] }[]) || [];
    const entries: { name: string; sets: number }[] = [];
    for (const t of treinos) for (const e of t.exercicios || []) entries.push({ name: String(e.nome || ""), sets: Number(e.series) || 0 });
    const agg = aggregateVolume(entries);
    for (const [k, v] of Object.entries(agg.direct)) previousPlannedVolume[k as MuscleKey] = Math.round(v as number);
  }

  // Aderência: sessões realizadas vs frequência planejada nas últimas 4 semanas.
  const freqResolved = resolveWeeklyFrequency(profile);
  const weeklyFrequency = freqResolved.value;
  const completions = (completionsRes.data || []) as { workout_date: string }[];
  const expected = weeklyFrequency * 4;
  const adherencePct = completions.length > 0 || logs.length > 0
    ? Math.min(100, Math.round((completions.length / Math.max(1, expected)) * 100))
    : null;

  // Sinal de progressão: carga média das duas quinzenas.
  let progressionSignal: EngineInputs["progressionSignal"] = "desconhecido";
  if (logs.length >= 10) {
    const mid = Date.now() - 14 * 86400000;
    const older = logs.filter((l) => new Date(l.created_at).getTime() < mid);
    const newer = logs.filter((l) => new Date(l.created_at).getTime() >= mid);
    const load = (arr: typeof logs) =>
      arr.reduce((a, l) => a + (Number(l.weight_kg) || 0) * (Number(l.reps_done) || 0), 0) / Math.max(1, arr.length);
    if (older.length >= 5 && newer.length >= 5) {
      const delta = (load(newer) - load(older)) / Math.max(1, load(older));
      progressionSignal = delta > 0.04 ? "melhorando" : delta < -0.06 ? "piorando" : "estavel";
    }
  }

  const checkins = (checkinsRes.data || []) as { energy_level: number | null; adherence_level: number | null; created_at: string }[];
  const painReports = [profile.injuries, profile.restricoes_medicas, profile.condicoes_saude]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x && !/nenhum|nao|não|n\/a/i.test(x));

  const readiness = computeReadiness({
    health: (healthRes.data || []) as never,
    weeklyCheckins: checkins,
    sis: (sisRes.data || []) as never,
    painReports,
  });

  const level = parseLevel(profile);
  const objective = parseObjective(profile);

  // Prioridades: campo estruturado primeiro, texto livre como fallback.
  const structuredPrio = structuredPriorities(profile.treino_prioridades);
  const hasStructuredPrio = Object.keys(structuredPrio).length > 0;
  const priorities = hasStructuredPrio
    ? structuredPrio
    : parsePriorities(String(profile.preferencias_treino || profile.objetivos_detalhados || ""));
  if (!hasStructuredPrio) notes.push("prioridade muscular deduzida de texto livre");

  const sessionResolved = resolveSessionMinutes(profile);
  if (!freqResolved.structured) notes.push("frequência semanal deduzida de texto livre");
  if (!sessionResolved.structured) notes.push("duração por sessão deduzida de texto livre");

  const equipment = Array.isArray(profile.treino_equipamentos) ? (profile.treino_equipamentos as string[]) : [];
  const availableDays = Array.isArray(profile.treino_dias_semana) ? (profile.treino_dias_semana as string[]) : [];
  const allowsConsecutiveDays = typeof profile.treino_dias_consecutivos === "boolean"
    ? (profile.treino_dias_consecutivos as boolean)
    : null;
  const maxConsecutiveSessions = Number.isFinite(Number(profile.treino_max_sessoes_consecutivas))
    ? Number(profile.treino_max_sessoes_consecutivas)
    : null;

  const effort = readEffort(logs, config.defaults.effort);
  if (effort.reading === "desconhecido") notes.push("sem RIR registrado nas séries");

  const structured: StructuredCoverage = {
    weeklyFrequency: freqResolved.structured,
    sessionMinutes: sessionResolved.structured,
    availableDays: availableDays.length > 0,
    priorities: hasStructuredPrio,
    equipment: equipment.length > 0,
    consecutiveDays: allowsConsecutiveDays !== null,
  };

  const inputs: EngineInputs = {
    age: (profile.age as number) ?? null,
    sex: (profile.sexo as string) ?? null,
    weightKg: (profile.weight as number) ?? null,
    heightCm: (profile.height as number) ?? null,
    level,
    objective,
    secondaryObjectives: [],
    trainingLocation: (profile.local_treino as string) ?? (profile.training_location as string) ?? null,
    equipment,
    preferences: (profile.preferencias_treino as string) ?? null,
    weeklyFrequency,
    sessionMinutes: sessionResolved.value,
    availableDays,
    allowsConsecutiveDays,
    maxConsecutiveSessions,
    injuries: (profile.injuries as string) ?? null,
    medicalRestrictions: (profile.restricoes_medicas as string) ?? null,
    painReports,
    priorities,
    previousWeeklyVolume,
    previousPlannedVolume,
    adherencePct,
    sessionsLast4Weeks: completions.length,
    progressionSignal,
    lastDeloadWeeksAgo: null,
    readiness,
    effort,
    structured,
    trainerDirectives: null,
    manualProtocol: false,
  };

  return { inputs, config, notes };
}
