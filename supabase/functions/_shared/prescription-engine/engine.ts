// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Núcleo determinístico: calcula a DOSE individual de treino por grupo
// muscular. A IA não decide volume, frequência nem limites — só interpreta
// contexto, escolhe exercícios dentro das vagas e escreve as explicações.
// ============================================================================

import { DEFAULT_ENGINE_CONFIG, MUSCLE_LABELS, type EngineConfig } from "./config.ts";
import type {
  Confidence,
  EngineInputs,
  ExperienceLevel,
  MuscleKey,
  MusclePrescription,
  MusclePriority,
  MuscleStatus,
  PrescriptionPlan,
} from "./types.ts";

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleKey[];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Capacidade de séries efetivas por sessão a partir do tempo disponível. */
export function sessionSetCapacity(sessionMinutes: number, cfg: EngineConfig): number {
  const d = cfg.defaults;
  const usable = Math.max(0, (sessionMinutes || 60) - d.sessionOverheadMinutes);
  return clamp(Math.floor(usable / d.minutesPerSet), d.minSetsPerSession, d.maxSetsPerSession);
}

function levelAnchorSets(level: ExperienceLevel, range: { min: number; defaultLow: number }, cfg: EngineConfig): number {
  const anchor = cfg.defaults.levelAnchor[level] || "min";
  if (anchor === "min") return range.min;
  if (anchor === "default_low") return range.defaultLow;
  return Math.round((range.min + range.defaultLow) / 2);
}

function frequencyFor(sets: number, weeklyFrequency: number, cfg: EngineConfig): number {
  const band = cfg.defaults.frequencyBands.find((b) => sets <= b.upTo);
  const wanted = band ? band.frequency : 2;
  return Math.max(1, Math.min(wanted, Math.max(1, weeklyFrequency)));
}

function statusFor(
  planned: number,
  previousRealized: number | null,
  priority: MusclePriority,
  readinessScore: number,
  progression: EngineInputs["progressionSignal"],
  cfg: EngineConfig,
): MuscleStatus {
  if (priority === "manutencao" || priority === "reduzir") return "MANUTENCAO";
  if (readinessScore < cfg.defaults.readinessThresholds.low && progression === "piorando") return "ALERTA_FADIGA";
  if (priority === "alta") return "PRIORIDADE";
  if (previousRealized !== null && previousRealized > 0 && planned - previousRealized >= 2 && progression !== "melhorando") {
    return "SUBDOSE";
  }
  return "DOSE_PRODUTIVA";
}

export function buildPrescriptionPlan(
  inputs: EngineInputs,
  configOverride?: EngineConfig,
): PrescriptionPlan {
  const cfg = configOverride || DEFAULT_ENGINE_CONFIG;
  const d = cfg.defaults;
  const decisionSummary: string[] = [];
  const safetyAlerts: string[] = [];

  const weeklyFrequency = clamp(Math.round(inputs.weeklyFrequency || 3), 1, 7);
  const sessionMinutes = clamp(Math.round(inputs.sessionMinutes || 60), 20, 150);
  const perSession = sessionSetCapacity(sessionMinutes, cfg);
  const weeklySetCapacity = perSession * weeklyFrequency;

  const readiness = inputs.readiness;
  const adherence = inputs.adherencePct;

  // ---------- Deload ----------
  const deloadReasons: string[] = [];
  if (readiness.score < d.deload.readinessFloor && readiness.confidence !== "baixa") {
    deloadReasons.push("prontidão consistentemente baixa");
  }
  if (inputs.progressionSignal === "piorando" && (adherence === null || adherence >= 70)) {
    deloadReasons.push("queda de performance com aderência mantida");
  }
  if (
    inputs.lastDeloadWeeksAgo !== null &&
    inputs.lastDeloadWeeksAgo >= d.deload.minWeeksBetween + 2 &&
    readiness.score < d.readinessThresholds.good
  ) {
    deloadReasons.push(`${inputs.lastDeloadWeeksAgo} semanas sem descarga`);
  }
  const deload = {
    recommended: deloadReasons.length >= (readiness.confidence === "alta" ? 1 : 2),
    reason: deloadReasons.length ? deloadReasons.join("; ") : null,
  };

  // ---------- Volume por músculo ----------
  const muscles: MusclePrescription[] = [];

  for (const muscle of ALL_MUSCLES) {
    const range = cfg.ranges[muscle];
    const priority: MusclePriority = inputs.priorities[muscle] || "desenvolvimento";
    const rationale: string[] = [];

    // 1) Base: volume previamente tolerado (dado real) ou âncora por nível.
    const prevRealized = inputs.previousWeeklyVolume[muscle] ?? null;
    let sets: number;
    if (prevRealized !== null && prevRealized > 0) {
      sets = prevRealized;
      rationale.push(`base: ${prevRealized} séries/sem já toleradas no ciclo anterior`);
    } else {
      sets = levelAnchorSets(inputs.level, range, cfg);
      rationale.push(`base: âncora de nível ${inputs.level} (${sets} séries/sem)`);
    }

    // 2) Prioridade muscular.
    const prioAdj = d.priorityAdjust[priority] ?? 0;
    if (prioAdj !== 0) {
      sets += prioAdj;
      rationale.push(`prioridade ${priority}: ${prioAdj > 0 ? "+" : ""}${prioAdj}`);
    }

    // 3) Recuperação (tendência, nunca uma noite isolada).
    let recAdj = d.readinessAdjust.neutral;
    if (readiness.score >= d.readinessThresholds.good) recAdj = d.readinessAdjust.good;
    else if (readiness.score < d.readinessThresholds.low) recAdj = d.readinessAdjust.low;
    if (recAdj !== 0 && readiness.confidence !== "baixa") {
      sets += recAdj;
      rationale.push(`recuperação ${readiness.score}/100: ${recAdj > 0 ? "+" : ""}${recAdj}`);
    }

    // 4) Aderência.
    if (adherence !== null && adherence < d.adherenceReduceBelow) {
      sets += d.adherenceReduceSets;
      rationale.push(`aderência ${Math.round(adherence)}%: ${d.adherenceReduceSets}`);
    }

    // 5) Retorno decrescente: sem justificativa, não passa do topo do default.
    const canExceedDefault =
      priority === "alta" &&
      readiness.score >= d.readinessThresholds.good &&
      (adherence === null || adherence >= 80) &&
      inputs.level === "avancado";
    const softCap = canExceedDefault ? range.max : range.defaultHigh;
    if (sets > softCap) {
      rationale.push(`retorno decrescente: teto em ${softCap}`);
      sets = softCap;
    }

    // 6) Piso por prioridade.
    const floor = priority === "reduzir" ? 0 : priority === "manutencao" ? Math.max(4, Math.round(range.min * 0.6)) : range.min;
    if (sets < floor) {
      sets = floor;
      rationale.push(`piso de ${priority}: ${floor}`);
    }

    // 7) Progressão conservadora vs ciclo anterior.
    const prevPlanned = inputs.previousPlannedVolume[muscle] ?? null;
    if (prevPlanned !== null && prevPlanned > 0) {
      const delta = sets - prevPlanned;
      const blockedByAdherence = adherence !== null && adherence < d.adherenceBlockProgressionBelow && delta > 0;
      if (blockedByAdherence) {
        sets = prevPlanned;
        rationale.push(`aderência < ${d.adherenceBlockProgressionBelow}%: sem aumento de volume`);
      } else if (Math.abs(delta) > d.maxWeeklyDelta) {
        sets = prevPlanned + Math.sign(delta) * d.maxWeeklyDelta;
        rationale.push(`ajuste limitado a ${d.maxWeeklyDelta} séries por ciclo`);
      }
    }

    // 8) Deload reduz dose sem zerar estímulo.
    if (deload.recommended) {
      sets = Math.max(range.min - 2, Math.round(sets * 0.6));
      rationale.push("semana de descarga sugerida: volume reduzido");
    }

    sets = Math.max(0, Math.round(clamp(sets, 0, range.max)));

    muscles.push({
      muscle,
      label: MUSCLE_LABELS[muscle],
      directSets: sets,
      indirectEquivalentSets: 0,
      totalEquivalentSets: sets,
      frequency: frequencyFor(sets, weeklyFrequency, cfg),
      maxSetsPerSession: Math.min(
        d.maxSetsPerMusclePerSession,
        Math.max(2, Math.ceil(sets / Math.max(1, frequencyFor(sets, weeklyFrequency, cfg)))),
      ),
      repRange: "",
      targetRir: "",
      priority,
      status: statusFor(sets, prevRealized, priority, readiness.score, inputs.progressionSignal, cfg),
      previousSets: prevPlanned ?? prevRealized,
      deltaVsPreviousCycle: prevPlanned !== null ? sets - prevPlanned : null,
      rationale,
    });
  }

  // ---------- Objetivo: escala global ----------
  const objMult = d.objectiveVolumeMultiplier[inputs.objective] ?? 1;
  if (objMult !== 1) {
    for (const m of muscles) {
      const range = cfg.ranges[m.muscle];
      m.directSets = Math.max(m.priority === "reduzir" ? 0 : range.min, Math.round(m.directSets * objMult));
      m.rationale.push(`objetivo ${inputs.objective}: volume x${objMult}`);
    }
    decisionSummary.push(`Objetivo ${inputs.objective} aplica fator ${objMult} sobre o volume total.`);
  }

  // ---------- Capacidade semanal real (tempo x frequência) ----------
  let totalDirect = muscles.reduce((a, m) => a + m.directSets, 0);
  if (totalDirect > weeklySetCapacity) {
    const factor = weeklySetCapacity / totalDirect;
    for (const m of muscles) {
      const range = cfg.ranges[m.muscle];
      const scaled = Math.round(m.directSets * factor);
      const floor = m.priority === "alta" ? range.min : m.priority === "reduzir" ? 0 : Math.max(2, Math.round(range.min * 0.5));
      m.directSets = Math.max(floor, scaled);
      m.rationale.push(`agenda real (${weeklyFrequency}x de ${sessionMinutes} min): volume ajustado à capacidade`);
    }
    totalDirect = muscles.reduce((a, m) => a + m.directSets, 0);

    // Se ainda não cabe, cortar 1 série por vez do maior volume,
    // preservando primeiro os grupos marcados como prioridade alta.
    const priorityRank: Record<MusclePriority, number> = { reduzir: 0, manutencao: 1, desenvolvimento: 2, alta: 3 };
    let guard = 500;
    while (totalDirect > weeklySetCapacity && guard-- > 0) {
      const candidates = muscles.filter((m) => m.directSets > 0);
      if (candidates.length === 0) break;
      candidates.sort((a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] || b.directSets - a.directSets
      );
      candidates[0].directSets -= 1;
      totalDirect -= 1;
    }
    for (const m of muscles) {
      if (m.directSets > 0 && m.directSets < 4 && m.priority !== "reduzir") {
        m.rationale.push("volume mínimo de manutenção pela agenda disponível");
      }
    }

    decisionSummary.push(
      `Capacidade semanal de ~${weeklySetCapacity} séries efetivas (${weeklyFrequency} sessões x ${perSession} séries): volume total ajustado.`,
    );
  }

  // ---------- Frequência, RIR e faixas de repetição finais ----------
  const rirCfg = deload.recommended
    ? { composto: d.deloadRir, isolador: d.deloadRir }
    : d.rir[inputs.level];
  const reps = d.repRanges[inputs.objective] || d.repRanges.hipertrofia;

  for (const m of muscles) {
    m.frequency = frequencyFor(m.directSets, weeklyFrequency, cfg);
    m.maxSetsPerSession = Math.min(
      d.maxSetsPerMusclePerSession,
      Math.max(2, Math.ceil(m.directSets / Math.max(1, m.frequency))),
    );
    if (m.maxSetsPerSession > d.preferredSetsPerMusclePerSession && m.frequency < weeklyFrequency) {
      m.frequency = Math.min(weeklyFrequency, m.frequency + 1);
      m.maxSetsPerSession = Math.max(2, Math.ceil(m.directSets / m.frequency));
      m.rationale.push("volume dividido em mais exposições para preservar qualidade por sessão");
    }
    const isSmall = ["biceps", "triceps", "deltoide_lateral", "deltoide_posterior", "panturrilhas", "abdomen"].includes(
      m.muscle,
    );
    m.repRange = isSmall ? reps.isolador : reps.composto;
    m.targetRir = isSmall ? rirCfg.isolador : rirCfg.composto;
    m.totalEquivalentSets = m.directSets;
  }

  // ---------- Segurança ----------
  const painText = [inputs.injuries, inputs.medicalRestrictions, ...inputs.painReports].filter(Boolean).join(" ").toLowerCase();
  if (painText.trim()) {
    safetyAlerts.push(
      "Há limitações/dores registradas. O motor reduz risco na seleção de exercícios, mas não substitui avaliação clínica.",
    );
  }
  if (/hernia|cirurg|fratura|lesao grave|lesão grave|dor aguda|tendinite|ruptura/.test(painText)) {
    safetyAlerts.push(
      "Relato compatível com condição clínica: encaminhar para avaliação profissional antes de progredir carga.",
    );
  }
  if (inputs.manualProtocol) {
    safetyAlerts.push("Existe prescrição manual do treinador: ela tem prioridade absoluta sobre este plano.");
  }

  // ---------- Confiança ----------
  const confidenceReasons: string[] = [];
  let points = 0;
  if (inputs.age) points++; else confidenceReasons.push("idade ausente");
  if (inputs.weightKg && inputs.heightCm) points++; else confidenceReasons.push("peso/altura ausentes");
  if (inputs.objective) points++;
  if (inputs.level) points++;
  if (inputs.weeklyFrequency) points++; else confidenceReasons.push("frequência semanal não informada");
  if (Object.keys(inputs.previousWeeklyVolume).length > 0) points += 2;
  else confidenceReasons.push("sem histórico de volume realizado");
  if (adherence !== null) points++; else confidenceReasons.push("aderência desconhecida");
  if (readiness.confidence === "alta") points += 2;
  else if (readiness.confidence === "media") points += 1;
  else confidenceReasons.push("poucos dados de recuperação (sono/VFC/check-in)");

  const confidence: Confidence = points >= 9 ? "alta" : points >= 6 ? "media" : "baixa";

  decisionSummary.unshift(
    `Nível ${inputs.level}, ${weeklyFrequency}x/semana, ${sessionMinutes} min por sessão, prontidão ${readiness.score}/100 (confiança ${readiness.confidence}).`,
  );
  if (deload.recommended) decisionSummary.push(`Descarga sugerida: ${deload.reason}.`);
  decisionSummary.push(`Total de ${totalDirect} séries efetivas diretas por semana.`);

  return {
    engineVersion: cfg.version,
    generatedAt: new Date().toISOString(),
    level: inputs.level,
    objective: inputs.objective,
    weeklyFrequency,
    sessionMinutes,
    weeklySetCapacity,
    totalDirectSets: totalDirect,
    muscles: muscles.filter((m) => m.directSets > 0),
    readiness,
    deload,
    confidence,
    confidenceReasons,
    safetyAlerts,
    inputsSnapshot: {
      level: inputs.level,
      objective: inputs.objective,
      age: inputs.age,
      weightKg: inputs.weightKg,
      heightCm: inputs.heightCm,
      weeklyFrequency,
      sessionMinutes,
      adherencePct: adherence,
      sessionsLast4Weeks: inputs.sessionsLast4Weeks,
      progressionSignal: inputs.progressionSignal,
      priorities: inputs.priorities,
      previousWeeklyVolume: inputs.previousWeeklyVolume,
      readinessScore: readiness.score,
      readinessConfidence: readiness.confidence,
      hasTrainerDirectives: !!inputs.trainerDirectives,
      equipment: inputs.equipment,
    },
    decisionSummary,
  };
}

/** Bloco de restrições duras que vai ao LLM. O modelo não pode ultrapassar isto. */
export function planToPromptConstraints(plan: PrescriptionPlan): string {
  const lines = plan.muscles.map(
    (m) =>
      `- ${m.label}: ${m.directSets} séries efetivas/semana, em ${m.frequency} sessão(ões), no máximo ${m.maxSetsPerSession} séries por sessão, repetições ${m.repRange}, RIR alvo ${m.targetRir}${
        m.priority === "alta" ? " [PRIORIDADE]" : m.priority === "manutencao" ? " [manutenção]" : ""
      }`,
  );

  return `### DOSE CALCULADA PELO MOTOR DE PRESCRIÇÃO (${plan.engineVersion}) ###
Estes números são OBRIGATÓRIOS. Você NÃO pode aumentar, reduzir ou inventar volume.
Sua função é escolher os exercícios e organizar a rotina DENTRO destes limites.

Frequência: ${plan.weeklyFrequency} sessões por semana, ~${plan.sessionMinutes} minutos cada.
Capacidade total: ~${plan.weeklySetCapacity} séries efetivas por semana.

VOLUME SEMANAL POR GRUPO MUSCULAR (séries efetivas diretas):
${lines.join("\n")}

REGRAS DURAS:
1. A soma das séries dos exercícios de cada grupo deve bater EXATAMENTE com o volume acima (tolerância de 1 série).
2. Nunca ultrapasse o máximo de séries por sessão indicado para cada grupo.
3. Use 2 a 4 exercícios por grupo ao longo da semana; não repita exercícios praticamente idênticos.
4. Respeite a faixa de repetições e o RIR alvo de cada grupo.
5. Não inclua grupos musculares que não estão na lista acima.
${plan.deload.recommended ? "6. Esta é uma fase de DESCARGA: reduza exigência, mantenha técnica, sem falha concêntrica.\n" : ""}${
    plan.safetyAlerts.length ? `\nALERTAS DE SEGURANÇA:\n${plan.safetyAlerts.map((a) => `- ${a}`).join("\n")}\n` : ""
  }### FIM DAS RESTRIÇÕES DO MOTOR ###`;
}
