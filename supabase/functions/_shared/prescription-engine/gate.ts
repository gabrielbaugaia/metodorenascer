// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Gate de segurança: classifica cada execução do motor em
// APROVADO / REQUER_REVISAO / BLOQUEADO. O treinador sempre pode revisar
// manualmente; o gate nunca altera a dose, apenas sinaliza.
// ============================================================================

import type { EngineInputs, GateResult, GateStatus, PrescriptionPlan } from "./types.ts";

const CLINICAL_ALERT = "Relato compatível com condição clínica";

export function evaluateGate(plan: PrescriptionPlan, inputs: EngineInputs): GateResult {
  const blocking: string[] = [];
  const review: string[] = [];

  // ---------- Bloqueios: inconsistência séria ----------
  if (plan.safetyAlerts.some((a) => a.includes(CLINICAL_ALERT))) {
    blocking.push("Relato clínico que exige avaliação profissional antes de progredir carga.");
  }
  if (plan.muscles.length === 0 || plan.totalDirectSets < 8) {
    blocking.push("Volume total calculado é baixo demais para ser um treino seguro e útil.");
  }
  // Falta de dados não bloqueia: o motor cai para a dose conservadora e o
  // treinador revisa. Bloqueio fica reservado a inconsistência séria.
  if (
    plan.confidence === "baixa" &&
    Object.keys(inputs.previousWeeklyVolume).length === 0 &&
    inputs.readiness.confidence === "baixa" &&
    !inputs.structured.weeklyFrequency
  ) {
    review.push(
      "Dados insuficientes: sem histórico de treino, sem recuperação e sem disponibilidade estruturada. Dose conservadora aplicada.",
    );
  }
  if (
    inputs.structured.availableDays &&
    inputs.availableDays.length > 0 &&
    plan.weeklyFrequency > inputs.availableDays.length
  ) {
    blocking.push(
      `Conflito de agenda: plano com ${plan.weeklyFrequency} sessões e apenas ${inputs.availableDays.length} dia(s) disponível(is).`,
    );
  }

  // ---------- Revisões ----------
  if (plan.confidence === "baixa") review.push("Confiança baixa nos dados de entrada.");
  if (plan.safetyAlerts.length > 0) review.push("Há limitações ou dores registradas no cadastro.");
  if (inputs.adherencePct !== null && inputs.adherencePct < 70) {
    review.push(`Aderência baixa (${Math.round(inputs.adherencePct)}%) no último ciclo.`);
  }
  if (inputs.readiness.confidence === "baixa") {
    review.push("Dados de recuperação escassos ou inconsistentes (sono, VFC, check-in).");
  }
  if (inputs.effort.reading === "desconhecido" && inputs.effort.totalSets >= 20) {
    review.push("Aluno treina, mas não registra RIR: esforço real desconhecido por período prolongado.");
  }
  if (plan.deload.recommended) review.push("Motor sugeriu semana de descarga.");

  // Aumentos relevantes vs ciclo anterior.
  const increases = plan.muscles.filter((m) => (m.deltaVsPreviousCycle ?? 0) >= 2);
  if (increases.length >= 2) {
    review.push(`Aumento relevante de volume em ${increases.length} grupos musculares.`);
  }
  const prevTotal = Object.values(inputs.previousPlannedVolume).reduce((a, b) => a + (b || 0), 0);
  if (prevTotal > 0) {
    const ratio = Math.abs(plan.totalDirectSets - prevTotal) / prevTotal;
    if (ratio > 0.25) {
      review.push(
        `Plano muito diferente do ciclo anterior (${prevTotal} para ${plan.totalDirectSets} séries semanais).`,
      );
    }
  }
  if (inputs.manualProtocol) {
    review.push("Existe prescrição manual do treinador: ela tem prioridade absoluta.");
  }

  const status: GateStatus = blocking.length > 0
    ? "BLOQUEADO"
    : review.length > 0
    ? "REQUER_REVISAO"
    : "APROVADO";

  return { status, reasons: blocking.length > 0 ? blocking : review };
}
