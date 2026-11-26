export type PrescriptionMedication = { id: string; name: string; instructions: string };
export type PrescriptionWeek = { id: string; entries: Record<string, string> };
export type PrescriptionTable = { medications: PrescriptionMedication[]; weeks: PrescriptionWeek[] };

// Only verbatim manual records. Client data must never populate medication entries.
export function createPrescriptionTable(): PrescriptionTable {
  return { medications: [], weeks: [] };
}

export function addPrescriptionMedication(table: PrescriptionTable, name: string): PrescriptionTable {
  return { ...table, medications: [...table.medications, { id: crypto.randomUUID(), name: name.trim(), instructions: "" }] };
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
    medications: table.medications.filter((medication) => medication.id !== medicationId),
    weeks: table.weeks.map((week) => ({ ...week, entries: Object.fromEntries(Object.entries(week.entries).filter(([id]) => id !== medicationId)) })),
  };
}

export function hasPrescriptionDraft(table: PrescriptionTable): boolean {
  return table.medications.length > 0 || table.weeks.length > 0;
}