// Converte a última avaliação de movimento publicada em restrições/orientações de treino.
// Prescrições manuais e limites do motor de prescrição sempre prevalecem.

export type MovementFinding = {
  key: string;
  label: string;
  region: string;
  severity: "leve" | "moderada" | "importante";
};

export type MovementInput = {
  assessed_at: string;
  findings: MovementFinding[] | null;
  restrictions: string | null;
  notes: string | null;
};

const ORDER = { importante: 0, moderada: 1, leve: 2 } as const;

export function buildMovementGuidance(a: MovementInput | null): string {
  if (!a) return "";
  const findings = (a.findings ?? []).filter((f) => f && f.label && ORDER[f.severity] !== undefined)
    .sort((x, y) => ORDER[x.severity] - ORDER[y.severity]);
  const restrictions = a.restrictions?.trim();
  if (!findings.length && !restrictions) return "";
  const lines = [`AVALIAÇÃO DE MOVIMENTO PUBLICADA (${a.assessed_at}):`];
  for (const f of findings) lines.push(`- ${f.region}: ${f.label} (${f.severity})`);
  if (restrictions) lines.push(`Restrições definidas pelo treinador: ${restrictions}`);
  const severe = findings.filter((f) => f.severity === "importante");
  if (severe.length) {
    lines.push("Treino: para achados importantes, evitar carga axial alta e amplitudes que reproduzam a compensação; preferir variações estáveis (máquinas, apoio) e incluir exercícios corretivos no aquecimento.");
  }
  if (findings.some((f) => f.severity !== "importante")) {
    lines.push("Treino: para achados leves/moderados, manter os exercícios com controle de técnica e incluir mobilidade/ativação específica da região.");
  }
  lines.push("Respeite estas restrições junto com lesões e dores informadas na anamnese.");
  return lines.join("\n");
}
