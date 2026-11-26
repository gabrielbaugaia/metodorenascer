export type PrescriptionMedication = { id: string; name: string; instructions: string; dose?: DoseInput };
export type PrescriptionWeek = { id: string; entries: Record<string, string> };
export type PrescriptionTable = { medications: PrescriptionMedication[]; weeks: PrescriptionWeek[]; pct?: string; protectors?: string };

// Only verbatim manual records. Client data must never populate medication entries.
export function createPrescriptionTable(): PrescriptionTable {
  return { medications: [], weeks: [], pct: "", protectors: "" };
}

export function addPrescriptionMedication(table: PrescriptionTable, name: string, concentrationMgMl = ""): PrescriptionTable {
  return { ...table, medications: [...table.medications, { id: crypto.randomUUID(), name: name.trim(), instructions: "", dose: { ...emptyDose(), concentrationMgMl } }] };
}

export function addPrescriptionWeek(table: PrescriptionTable): PrescriptionTable {
  return { ...table, weeks: [...table.weeks, { id: crypto.randomUUID(), entries: {} }] };
}

export function resizePrescriptionWeeks(table: PrescriptionTable, count: number): PrescriptionTable {
  if (!Number.isInteger(count) || count < 1 || count > 104) return table;
  const weeks = table.weeks.slice(0, count);
  while (weeks.length < count) weeks.push({ id: crypto.randomUUID(), entries: {} });
  return { ...table, weeks };
}

export function setPrescriptionEntry(table: PrescriptionTable, weekId: string, medicationId: string, text: string): PrescriptionTable {
  if (!table.medications.some((medication) => medication.id === medicationId)) return table;
  return { ...table, weeks: table.weeks.map((week) => week.id === weekId ? { ...week, entries: { ...week.entries, [medicationId]: text } } : week) };
}

export function removePrescriptionMedication(table: PrescriptionTable, medicationId: string): PrescriptionTable {
  return {
    ...table,
    medications: table.medications.filter((medication) => medication.id !== medicationId),
    weeks: table.weeks.map((week) => ({ ...week, entries: Object.fromEntries(Object.entries(week.entries).filter(([id]) => id !== medicationId)) })),
  };
}

export function hasPrescriptionDraft(table: PrescriptionTable): boolean {
  return table.medications.length > 0 || table.weeks.length > 0 || Boolean(table.pct?.trim() || table.protectors?.trim());
}
// Manual dosing data typed from the medical prescription. The system only converts units; it never suggests values.
export type DoseInput = { weeklyMg: string; concentrationMgMl: string; applicationsPerWeek: string; applicationDays: string; vialMl: string };
export const emptyDose = (): DoseInput => ({ weeklyMg: "", concentrationMgMl: "", applicationsPerWeek: "", applicationDays: "", vialMl: "10" });

const num = (value: string) => { const n = Number(String(value).replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : null; };
const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString("pt-BR");

export function parseConcentration(reference: string | null | undefined): string {
  const match = (reference ?? "").match(/(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*ml/i);
  return match ? match[1].replace(",", ".") : "";
}

export type DoseSummary = { mlPerWeek: number | null; mlPerApplication: number | null; totalMl: number | null; vials: number | null; ampoules: number | null };

export function computeDose(dose: DoseInput | undefined, weeks: number): DoseSummary {
  const mg = num(dose?.weeklyMg ?? ""), conc = num(dose?.concentrationMgMl ?? ""), apps = num(dose?.applicationsPerWeek ?? ""), vial = num(dose?.vialMl ?? "");
  const mlPerWeek = mg && conc ? mg / conc : null;
  const totalMl = mlPerWeek && weeks > 0 ? mlPerWeek * weeks : null;
  return {
    mlPerWeek,
    mlPerApplication: mlPerWeek && apps ? mlPerWeek / apps : null,
    totalMl,
    vials: totalMl && vial ? Math.ceil(totalMl / vial - 1e-9) : null,
    ampoules: totalMl ? Math.ceil(totalMl - 1e-9) : null,
  };
}

export function weeklyEntryText(dose: DoseInput | undefined): string {
  const mg = num(dose?.weeklyMg ?? "");
  if (!mg) return "";
  const s = computeDose(dose, 1);
  return s.mlPerWeek ? `${fmt(mg)} mg (${fmt(s.mlPerWeek)} ml)` : `${fmt(mg)} mg`;
}

export function frequencyText(dose: DoseInput | undefined): string {
  const s = computeDose(dose, 1);
  if (!s.mlPerApplication) return "";
  const apps = num(dose!.applicationsPerWeek)!;
  return `${fmt(s.mlPerApplication)} ml por aplicação (${fmt(apps)}x por semana)${dose!.applicationDays.trim() ? ` · ${dose!.applicationDays.trim()}` : ""}`;
}

export function suppliesText(dose: DoseInput | undefined, weeks: number): string {
  const s = computeDose(dose, weeks);
  if (!s.totalMl) return "";
  return `${fmt(s.totalMl)} ml no período${s.vials ? ` · ${s.vials} frasco(s) de ${fmt(num(dose!.vialMl)!)} ml` : ""} ou ${s.ampoules} ampola(s) de 1 ml`;
}

export function setMedicationDose(table: PrescriptionTable, medicationId: string, dose: DoseInput): PrescriptionTable {
  return { ...table, medications: table.medications.map((m) => m.id === medicationId ? { ...m, dose } : m) };
}

// Copies only the dose the admin typed into every week; overwrites nothing already written.
export function fillWeeksFromDoses(table: PrescriptionTable): PrescriptionTable {
  return { ...table, weeks: table.weeks.map((week) => {
    const entries = { ...week.entries };
    for (const m of table.medications) { const text = weeklyEntryText(m.dose); if (text && !entries[m.id]?.trim()) entries[m.id] = text; }
    return { ...week, entries };
  }) };
}
