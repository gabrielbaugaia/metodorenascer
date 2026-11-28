export const documentProfileFields = [
  { key: "weight", label: "Peso (kg)", match: /^peso (atual|corporal)$|^peso$/, units: ["kg"] },
  { key: "height", label: "Altura (cm)", match: /^altura$/, units: ["cm", "m"] },
  { key: "age", label: "Idade (anos)", match: /^idade( declarada)?$/, units: ["anos"] },
  { key: "body_fat_pct", label: "Gordura corporal (%)", match: /^(gordura corporal|percentual de gordura)$/, units: ["%"] },
  { key: "fat_mass_kg", label: "Massa gorda (kg)", match: /^(peso gordo|massa gorda)$/, units: ["kg"] },
  { key: "lean_mass_kg", label: "Massa magra (kg)", match: /^(peso magro|massa magra)$/, units: ["kg"] },
  { key: "waist_cm", label: "Cintura (cm)", match: /^cintura$/, units: ["cm"] },
  { key: "abdomen_cm", label: "Abdômen (cm)", match: /^abdome(n)?$/, units: ["cm"] },
  { key: "hip_cm", label: "Quadril (cm)", match: /^quadril$/, units: ["cm"] },
  { key: "thigh_right_cm", label: "Coxa direita (cm)", match: /^coxa direita$/, units: ["cm"] },
  { key: "thigh_left_cm", label: "Coxa esquerda (cm)", match: /^coxa esquerda$/, units: ["cm"] },
] as const;
export type ProfileField = typeof documentProfileFields[number]["key"];
export type ExtractedValue = { name: string; value: string; unit: string };
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function extractedValues(data: unknown): ExtractedValue[] {
  if (!data || typeof data !== "object" || !("key_values" in data) || !Array.isArray(data.key_values)) return [];
  return data.key_values.filter((v): v is ExtractedValue => !!v && typeof v.name === "string" && typeof v.value === "string" && typeof v.unit === "string");
}

export function documentDates(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g), m => `${m[3]}-${m[2]}-${m[1]}`))]
    .filter(d => !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d).sort();
}

export function profileSuggestions(data: unknown, date: string): Partial<Record<ProfileField, string>> {
  const result: Partial<Record<ProfileField, string>> = {};
  for (const item of extractedValues(data)) {
    const name = normalized(item.name.split(/[—–]/)[0]);
    const spec = documentProfileFields.find(f => f.match.test(name));
    if (!spec || !spec.units.some(u => u === normalized(item.unit))) continue;
    const dates = documentDates(item.name);
    const parts = item.value.split(";").map(v => v.trim());
    // Dates in the source's original order must stay aligned with values.
    const ordered = Array.from(item.name.matchAll(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g), m => `${m[3]}-${m[2]}-${m[1]}`);
    const index = ordered.indexOf(date);
    if (dates.length && (index < 0 || parts.length !== ordered.length)) continue;
    const raw = dates.length ? parts[index] : parts.length === 1 ? parts[0] : "";
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) continue;
    let value = Number(raw.replace(",", "."));
    if (spec.key === "height" && normalized(item.unit) === "m") value *= 100;
    if (value <= 0 || (spec.key === "height" && (value < 50 || value > 250))) continue;
    // Duplicate measurements require explicit review instead of choosing one.
    if (result[spec.key] !== undefined && result[spec.key] !== String(value)) { result[spec.key] = ""; continue; }
    result[spec.key] = String(value);
  }
  return result;
}

export function profilePatch(values: Partial<Record<ProfileField, string>>): Record<string, number> {
  const patch: Record<string, number> = {};
  for (const f of documentProfileFields) {
    const raw = values[f.key]?.trim();
    if (!raw) continue;
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) throw new Error(`Confira ${f.label}`);
    const n = Number(raw.replace(",", "."));
    if (n <= 0 || n > 600 || (f.key === "height" && (n < 50 || n > 250)) || (f.key === "age" && (!Number.isInteger(n) || n > 120)) || (f.key === "body_fat_pct" && n >= 100)) throw new Error(`Confira ${f.label}`);
    patch[f.key] = n;
  }
  return patch;
}

export function reviewedProfileValues(data: unknown): Partial<Record<ProfileField, string>> {
  if (!data || typeof data !== "object") return {};
  const result: Partial<Record<ProfileField, string>> = {};
  for (const f of documentProfileFields) {
    const value = (data as Record<string, unknown>)[f.key];
    if (typeof value === "number" && Number.isFinite(value)) result[f.key] = String(value);
  }
  return result;
}