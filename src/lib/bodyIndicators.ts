export interface DayLog {
  sleep_hours?: number | null;
  stress_level?: number | null;
  energy_focus?: number | null;
  trained_today?: boolean | null;
  steps?: number | null;
  active_calories?: number | null;
  resting_hr?: number | null;
  hrv_ms?: number | null;
}

export interface BodyIndicators {
  consistencyPercent: number | null;
  recoveryTrendLabel: string | null;
  recoveryTrendArrow: string;
  capacityLabel: string | null;
  hasEnoughData: boolean;
}

function hasAnyData(day: DayLog): boolean {
  return (
    (day.sleep_hours != null && day.sleep_hours > 0) ||
    (day.stress_level != null) ||
    (day.energy_focus != null) ||
    (day.trained_today != null) ||
    (day.steps != null && day.steps > 0) ||
    (day.active_calories != null && day.active_calories > 0) ||
    (day.resting_hr != null && day.resting_hr > 0) ||
    (day.hrv_ms != null && day.hrv_ms > 0)
  );
}

function normalizeSleep(hours: number): number {
  if (hours >= 7 && hours <= 9) return 100;
  if (hours > 9) return 80;
  if (hours >= 6) return 60;
  if (hours >= 5) return 40;
  return 20;
}

function normalizeStress(stress: number): number {
  // stress 0-100, lower is better
  return Math.max(0, Math.min(100, 100 - stress));
}

function normalizeEnergy(energy: number): number {
  // 1-5 mapped to 20-100
  return Math.max(20, Math.min(100, (energy - 1) * 20 + 20));
}

function normalizeRestingHr(hr: number): number {
  // generic: 50-60 = great, 60-70 = good, 70-80 = ok, >80 = poor
  if (hr <= 55) return 100;
  if (hr <= 65) return 80;
  if (hr <= 75) return 60;
  if (hr <= 85) return 40;
  return 20;
}

function normalizeHrv(hrv: number): number {
  // generic: >60 = great, 40-60 = good, 20-40 = ok, <20 = poor
  if (hrv >= 70) return 100;
  if (hrv >= 50) return 80;
  if (hrv >= 35) return 60;
  if (hrv >= 20) return 40;
  return 20;
}

function computeRecoveryScore(day: DayLog): number | null {
  const scores: number[] = [];

  if (day.sleep_hours != null && day.sleep_hours > 0) {
    scores.push(normalizeSleep(day.sleep_hours));
  }
  if (day.stress_level != null) {
    scores.push(normalizeStress(day.stress_level));
  }
  if (day.energy_focus != null) {
    scores.push(normalizeEnergy(day.energy_focus));
  }
  if (day.resting_hr != null && day.resting_hr > 0) {
    scores.push(normalizeRestingHr(day.resting_hr));
  }
  if (day.hrv_ms != null && day.hrv_ms > 0) {
    scores.push(normalizeHrv(day.hrv_ms));
  }

  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function computeBodyIndicators(days: DayLog[]): BodyIndicators {
  const daysWithData = days.filter(hasAnyData);
  const count = daysWithData.length;
  const hasEnoughData = count >= 3;

  if (!hasEnoughData) {
    return {
      consistencyPercent: null,
      recoveryTrendLabel: null,
      recoveryTrendArrow: "minus",
      capacityLabel: null,
      hasEnoughData: false,
    };
  }

  const consistencyPercent = Math.round((count / 7) * 100);

  // Recovery scores for all days (index 0 = oldest, 6 = newest)
  const recoveryScores = days.map(computeRecoveryScore);

  // Recent 3 and previous 3 (skip gaps)
  const validScores = recoveryScores
    .map((s, i) => ({ score: s, index: i }))
    .filter((x) => x.score != null) as { score: number; index: number }[];

  // Sort by index descending (most recent first)
  validScores.sort((a, b) => b.index - a.index);

  const recent3 = validScores.slice(0, 3).map((x) => x.score);
  const prev3 = validScores.slice(3, 6).map((x) => x.score);

  let recoveryTrendLabel: string | null = null;
  let recoveryTrendArrow = "minus";

  if (recent3.length >= 2) {
    const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
    const prevAvg =
      prev3.length > 0 ? prev3.reduce((a, b) => a + b, 0) / prev3.length : recentAvg;

    const delta = recentAvg - prevAvg;

    // Variance check
    const allRecent = recent3;
    const mean = allRecent.reduce((a, b) => a + b, 0) / allRecent.length;
    const variance =
      allRecent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / allRecent.length;

    if (variance > 400) {
      recoveryTrendLabel = "oscilando";
      recoveryTrendArrow = "activity";
    } else if (delta > 3) {
      recoveryTrendLabel = "em alta";
      recoveryTrendArrow = "arrow-up";
    } else if (delta < -3) {
      recoveryTrendLabel = "em queda";
      recoveryTrendArrow = "arrow-down";
    } else {
      recoveryTrendLabel = "estável";
      recoveryTrendArrow = "arrow-up";
    }

    // Capacity from recent 3 avg
    const capacityScore = recentAvg;
    const capacityLabel =
      capacityScore >= 75 ? "alta" : capacityScore >= 45 ? "moderada" : "baixa";

    return {
      consistencyPercent,
      recoveryTrendLabel,
      recoveryTrendArrow,
      capacityLabel,
      hasEnoughData: true,
    };
  }

  return {
    consistencyPercent,
    recoveryTrendLabel: null,
    recoveryTrendArrow: "minus",
    capacityLabel: null,
    hasEnoughData: true,
  };
}
