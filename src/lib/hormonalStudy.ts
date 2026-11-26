export type StudyNotes = { topic: string; substance: string; notes: string; references: string };

// A fresh object for each client: study notes must never follow a client switch.
export function createStudyNotes(): StudyNotes {
  return { topic: "", substance: "", notes: "", references: "" };
}

export const studySubstances = [
  "Testosterona enantato", "Testosterona cipionato", "Testosterona propionato",
  "Mistura de ésteres de testosterona", "Oxandrolona", "Metenolona",
  "Drostanolona", "Estanozolol", "Nandrolona", "Trembolona",
  "Anastrozol", "Tamoxifeno", "Clomifeno",
];