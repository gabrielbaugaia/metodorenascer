// Converte a última avaliação física publicada em orientações para treino e dieta.
// Faixas de referência gerais (ACE para % gordura; OMS para IMC). Ajustáveis pelo treinador.
// Prescrições manuais e limites do motor de prescrição sempre prevalecem.

export type AssessmentInput = {
  assessed_at: string;
  sex: "male" | "female" | null;
  weight_kg: number | null;
  results: { body_fat_pct?: number; bmi?: number; lean_mass_kg?: number; fat_mass_kg?: number } | null;
};

export type BfBand = "baixo" | "atleta" | "adequado" | "elevado" | "muito_elevado";
export type BmiBand = "abaixo" | "normal" | "sobrepeso" | "obesidade";

export function bodyFatBand(pct: number, sex: "male" | "female" | null): BfBand {
  const f = sex === "female";
  if (pct < (f ? 14 : 6)) return "baixo";
  if (pct < (f ? 21 : 14)) return "atleta";
  if (pct < (f ? 32 : 25)) return "adequado";
  if (pct < (f ? 38 : 30)) return "elevado";
  return "muito_elevado";
}

export function bmiBand(bmi: number): BmiBand {
  if (bmi < 18.5) return "abaixo";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "sobrepeso";
  return "obesidade";
}

export function buildAssessmentGuidance(a: AssessmentInput | null, tipo: "treino" | "nutricao"): string {
  const bf = a?.results?.body_fat_pct;
  const bmi = a?.results?.bmi;
  if (!a || bf == null || bmi == null) return "";
  const bfb = bodyFatBand(bf, a.sex);
  const bmb = bmiBand(bmi);
  const lines = [
    `AVALIAÇÃO FÍSICA PUBLICADA (${a.assessed_at}): gordura ${bf.toFixed(1)}% (${bfb}), IMC ${bmi.toFixed(1)} (${bmb})` +
      (a.results?.lean_mass_kg != null ? `, massa livre de gordura ${a.results.lean_mass_kg.toFixed(1)} kg` : "") + ".",
    "Use estes dados para ajustar a prescrição. O % de gordura tem prioridade sobre o IMC quando divergirem.",
  ];
  const highFat = bfb === "elevado" || bfb === "muito_elevado";
  const lowFat = bfb === "baixo";
  if (tipo === "treino") {
    if (highFat) lines.push("Treino: priorizar força com densidade maior (descansos mais curtos dentro dos limites) e incluir trabalho aeróbio regular.");
    if (bmb === "obesidade") lines.push("Treino: preferir exercícios de baixo impacto articular; evitar saltos e corrida de alto impacto no início.");
    if (lowFat) lines.push("Treino: foco em hipertrofia e recuperação; limitar aeróbio extra.");
    if (!highFat && !lowFat && bmb !== "obesidade") lines.push("Treino: composição adequada; seguir objetivo do aluno com progressão de carga.");
  } else {
    if (highFat) lines.push("Dieta: déficit calórico moderado (cerca de 15 a 20%), proteína alta preservando massa magra.");
    if (lowFat || bmb === "abaixo") lines.push("Dieta: não aplicar déficit; manutenção ou leve superávit, proteína alta.");
    if (!highFat && !lowFat && bmb !== "abaixo") lines.push("Dieta: calorias alinhadas ao objetivo declarado, proteína adequada.");
    if (a.results?.lean_mass_kg != null) lines.push(`Dieta: calcule a proteína sobre a massa livre de gordura (${a.results.lean_mass_kg.toFixed(1)} kg).`);
  }
  return lines.join("\n");
}
