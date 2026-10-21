// Avaliação Física / Composição Corporal — cálculos puros (sem dependências de UI).
export const CALC_VERSION = "jp7-siri-v1";
export const CALC_METHOD = "Jackson & Pollock 7 dobras + equação de Siri";

export type Sex = "male" | "female";

export const SKINFOLDS = [
  { key: "chest", label: "Peitoral" },
  { key: "midaxillary", label: "Axilar média" },
  { key: "triceps", label: "Tríceps" },
  { key: "subscapular", label: "Subescapular" },
  { key: "abdominal", label: "Abdominal" },
  { key: "suprailiac", label: "Supra-ilíaca" },
  { key: "thigh", label: "Coxa" },
] as const;

export const CIRCUMFERENCES = [
  { key: "neck", label: "Pescoço" },
  { key: "shoulders", label: "Ombros" },
  { key: "chest", label: "Tórax" },
  { key: "arm_right", label: "Braço direito" },
  { key: "arm_left", label: "Braço esquerdo" },
  { key: "waist", label: "Cintura" },
  { key: "abdomen", label: "Abdômen" },
  { key: "hip", label: "Quadril" },
  { key: "thigh_right", label: "Coxa direita" },
  { key: "thigh_left", label: "Coxa esquerda" },
  { key: "calf_right", label: "Panturrilha direita" },
  { key: "calf_left", label: "Panturrilha esquerda" },
] as const;

export const PHOTO_POSITIONS = [
  { key: "front", label: "Frente" },
  { key: "right", label: "Perfil direito" },
  { key: "left", label: "Perfil esquerdo" },
  { key: "back", label: "Costas" },
] as const;
export type PhotoPosition = (typeof PHOTO_POSITIONS)[number]["key"];

export type SkinfoldKey = (typeof SKINFOLDS)[number]["key"];
export type CircKey = (typeof CIRCUMFERENCES)[number]["key"];

/** Limites físicos razoáveis para validação. */
export const LIMITS = {
  weight: [20, 350] as const,
  height: [100, 250] as const,
  skinfold: [1, 80] as const,
  circumference: [10, 250] as const,
  age: [10, 100] as const,
};

/** Aceita vírgula decimal pt-BR. Retorna null para vazio, NaN para inválido. */
export function parseDecimal(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : NaN;
  const s = input.trim().replace(/\s/g, "");
  if (!s) return null;
  const normalized = s.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function ageAt(birthDate: string, onDate: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [y, m, d] = onDate.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

export interface CalcInput {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  skinfolds: Partial<Record<SkinfoldKey, number>>;
  waistCm?: number | null;
  hipCm?: number | null;
}

export interface CalcResult {
  skinfold_sum: number;
  density: number;
  body_fat_pct: number;
  fat_mass_kg: number;
  lean_mass_kg: number;
  bmi: number;
  whr: number | null;
  whtr: number | null;
  method: string;
  version: string;
}

export function jp7Density(sex: Sex, sum: number, age: number): number {
  return sex === "male"
    ? 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age
    : 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
}

export function siriBodyFat(density: number): number {
  return 495 / density - 450;
}

export function calculateAssessment(i: CalcInput): CalcResult {
  const values = SKINFOLDS.map((s) => i.skinfolds[s.key]);
  if (values.some((v) => v == null || !Number.isFinite(v))) {
    throw new Error("As 7 dobras são obrigatórias para o cálculo.");
  }
  const sum = (values as number[]).reduce((a, b) => a + b, 0);
  const density = jp7Density(i.sex, sum, i.age);
  const bf = siriBodyFat(density);
  const fat = (i.weightKg * bf) / 100;
  const hM = i.heightCm / 100;
  return {
    skinfold_sum: round(sum, 1),
    density: round(density, 5),
    body_fat_pct: round(bf, 2),
    fat_mass_kg: round(fat, 2),
    lean_mass_kg: round(i.weightKg - fat, 2),
    bmi: round(i.weightKg / (hM * hM), 2),
    whr: i.waistCm && i.hipCm ? round(i.waistCm / i.hipCm, 3) : null,
    whtr: i.waistCm ? round(i.waistCm / i.heightCm, 3) : null,
    method: CALC_METHOD,
    version: CALC_VERSION,
  };
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export interface FormValues {
  assessed_at: string;
  birth_date: string;
  sex: Sex | "";
  weight: string;
  height: string;
  skinfolds: Record<string, string>;
  circumferences: Record<string, string>;
}

export interface ValidationOutput {
  errors: Record<string, string>;
  canCalculate: boolean;
  parsed?: {
    age: number;
    weight: number;
    height: number;
    skinfolds: Record<string, number>;
    circumferences: Record<string, number>;
  };
}

/** Valida o formulário. Campos de cálculo são obrigatórios apenas para calcular/publicar. */
export function validateForm(v: FormValues): ValidationOutput {
  const errors: Record<string, string> = {};
  const range = (key: string, label: string, raw: string, [min, max]: readonly [number, number], required: boolean) => {
    const n = parseDecimal(raw);
    if (n === null) {
      if (required) errors[key] = `${label}: obrigatório para o cálculo.`;
      return null;
    }
    if (Number.isNaN(n)) {
      errors[key] = `${label}: use apenas números (ex.: 12,5).`;
      return null;
    }
    if (n < min || n > max) {
      errors[key] = `${label}: valor fora do intervalo aceito (${min}–${max}).`;
      return null;
    }
    return n;
  };

  if (!v.assessed_at) errors.assessed_at = "Data da avaliação: obrigatória.";
  if (!v.birth_date) errors.birth_date = "Data de nascimento: obrigatória para calcular a idade.";
  if (!v.sex) errors.sex = "Sexo biológico: obrigatório para a equação.";
  let age = NaN;
  if (v.assessed_at && v.birth_date) {
    age = ageAt(v.birth_date, v.assessed_at);
    if (age < LIMITS.age[0] || age > LIMITS.age[1]) errors.birth_date = "Idade na data da avaliação fora do intervalo (10–100).";
  }
  const weight = range("weight", "Peso", v.weight, LIMITS.weight, true);
  const height = range("height", "Altura", v.height, LIMITS.height, true);
  const skinfolds: Record<string, number> = {};
  for (const s of SKINFOLDS) {
    const n = range(`sf_${s.key}`, `Dobra ${s.label}`, v.skinfolds[s.key] ?? "", LIMITS.skinfold, true);
    if (n !== null) skinfolds[s.key] = n;
  }
  const circumferences: Record<string, number> = {};
  for (const c of CIRCUMFERENCES) {
    const n = range(`c_${c.key}`, `Circunferência ${c.label}`, v.circumferences[c.key] ?? "", LIMITS.circumference, false);
    if (n !== null) circumferences[c.key] = n;
  }
  const canCalculate = Object.keys(errors).length === 0;
  return {
    errors,
    canCalculate,
    parsed: canCalculate ? { age, weight: weight!, height: height!, skinfolds, circumferences } : undefined,
  };
}

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function diff(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null) return { abs: null as number | null, pct: null as number | null };
  return { abs: b - a, pct: a !== 0 ? ((b - a) / a) * 100 : null };
}

export const METHOD_NOTE =
  "Percentual de gordura estimado pelo protocolo de Jackson & Pollock (7 dobras cutâneas) com conversão pela equação de Siri. " +
  "Massa livre de gordura = peso − massa gorda; inclui músculos, ossos, órgãos e água, e não representa massa muscular isolada. " +
  "IMC, relação cintura-quadril (RCQ) e relação cintura-estatura (RCE) são índices antropométricos. " +
  "Todos os valores são estimativas de campo, sujeitas a erro de medida, e não constituem diagnóstico.";
