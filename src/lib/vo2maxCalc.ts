// VO2 Máx — fórmulas e classificação por idade/sexo (tabelas ACSM/Cooper Institute)

export type Vo2Protocol = "cooper" | "bruce" | "astrand";
export type Sex = "M" | "F";

export function calcCooper(distanciaMetros: number): number {
  return (distanciaMetros - 504.9) / 44.73;
}

export function calcBruce(totalMinutes: number, sex: Sex): number {
  const T = totalMinutes;
  if (sex === "M") {
    return 14.8 - 1.379 * T + 0.451 * T * T - 0.012 * T * T * T;
  }
  return 4.38 * T - 3.9;
}

// ACSM simplificada para bike
export function calcAstrand(watts: number, pesoKg: number): number {
  return (watts * 10.8) / pesoKg + 7;
}

export interface Classification {
  label: "Muito Fraco" | "Fraco" | "Regular" | "Bom" | "Excelente" | "Superior";
  color: "destructive" | "warning" | "success";
}

// Tabela: idx 0 = Muito Fraco threshold (max), idx 1..4 = upper bounds, idx 5 = Superior min
// Estrutura: faixas [muitoFracoMax, fracoMax, regularMax, bomMax, excelenteMax]
const TABLE_M: Record<string, number[]> = {
  "20-29": [37, 41, 47, 52, 59],
  "30-39": [33, 37, 42, 48, 55],
  "40-49": [29, 33, 38, 44, 51],
  "50-59": [24, 28, 33, 39, 46],
  "60+":   [20, 24, 28, 34, 41],
};
const TABLE_F: Record<string, number[]> = {
  "20-29": [28, 34, 39, 44, 49],
  "30-39": [26, 31, 36, 41, 46],
  "40-49": [23, 28, 32, 37, 42],
  "50-59": [20, 24, 28, 33, 38],
  "60+":   [17, 22, 26, 31, 36],
};

function ageBracket(age: number): string {
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  return "60+";
}

export function classify(vo2: number, age: number, sex: Sex): Classification {
  const table = sex === "M" ? TABLE_M : TABLE_F;
  const row = table[ageBracket(age)];
  const [mf, f, r, b, e] = row;
  if (vo2 <= mf) return { label: "Muito Fraco", color: "destructive" };
  if (vo2 <= f)  return { label: "Fraco",       color: "destructive" };
  if (vo2 <= r)  return { label: "Regular",     color: "warning" };
  if (vo2 <= b)  return { label: "Bom",         color: "warning" };
  if (vo2 <= e)  return { label: "Excelente",   color: "success" };
  return { label: "Superior", color: "success" };
}

export const PROTOCOL_LABEL: Record<Vo2Protocol, string> = {
  cooper: "Teste de Cooper (12 min)",
  bruce: "Protocolo Bruce (Esteira)",
  astrand: "Astrand-Rhyming (Bike)",
};
