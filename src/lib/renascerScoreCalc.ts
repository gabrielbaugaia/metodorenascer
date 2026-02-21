export interface DayLogInput {
  sleep_hours: number | null;
  stress_level: number | null;
  energy_focus: number | null;
  trained_today: boolean | null;
  rpe: number | null;
}

export interface ScoreResult {
  score: number;
  classification: "ELITE" | "ALTO" | "MODERADO" | "RISCO";
  statusText: string;
}

export function calcScore(log: DayLogInput, yesterdayLog: DayLogInput | null): number {
  let s = 100;
  const sleep = log.sleep_hours ?? 7;
  if (sleep < 5) s -= 35;
  else if (sleep < 6) s -= 20;
  else if (sleep < 7) s -= 10;

  const stress = log.stress_level ?? 30;
  if (stress > 80) s -= 20;
  else if (stress > 60) s -= 10;

  const energy = log.energy_focus ?? 3;
  if (energy === 1) s -= 25;
  else if (energy === 2) s -= 15;
  else if (energy === 3) s -= 5;
  else if (energy === 5) s += 5;

  if (yesterdayLog?.trained_today) {
    const rpe = yesterdayLog.rpe ?? 5;
    if (rpe >= 8) s -= 15;
    else if (rpe >= 5) s -= 10;
    else s -= 5;
  }

  return Math.max(0, Math.min(100, s));
}

export function classify(score: number): { classification: ScoreResult["classification"]; statusText: string } {
  if (score >= 85) return { classification: "ELITE", statusText: "PRONTO PARA EVOLUIR" };
  if (score >= 65) return { classification: "ALTO", statusText: "TREINAR COM CONTROLE" };
  if (score >= 40) return { classification: "MODERADO", statusText: "RECUPERAR" };
  return { classification: "RISCO", statusText: "REDUZIR CARGA" };
}

export function getRecommendation(classification: string): string[] {
  switch (classification) {
    case "ELITE":
      return ["Treino intenso", "Volume: 100% do programado", "RPE até 9 — pode buscar falha"];
    case "ALTO":
      return ["Treino moderado", "Volume: 80% do programado", "RPE até 7 — evitar falha"];
    case "MODERADO":
      return ["Treino leve + técnica", "Volume: 50-60%", "RPE até 5 — foco em execução"];
    default:
      return ["Recuperação ativa", "Mobilidade + caminhada leve", "Sem carga — priorize descanso"];
  }
}

export function calculateTrend(scores: { score: number }[]): { trend: "up" | "down" | "stable"; trendText: string } {
  if (scores.length < 4) return { trend: "stable", trendText: "Corpo estável" };

  const recent = scores.slice(-3);
  const older = scores.slice(-6, -3);
  if (older.length === 0) return { trend: "stable", trendText: "Corpo estável" };

  const avgRecent = recent.reduce((a, b) => a + b.score, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b.score, 0) / older.length;

  if (avgRecent - avgOlder >= 5) return { trend: "up", trendText: "Corpo melhorando" };
  if (avgOlder - avgRecent >= 5) return { trend: "down", trendText: "Pedindo recuperação" };
  return { trend: "stable", trendText: "Corpo estável" };
}
