export interface ReviewedDocument {
  id: string;
  category: string;
  title: string;
  document_date: string | null;
  reviewed_summary: string | null;
  reviewed_profile: unknown;
  extracted_data: unknown;
  profile_applied_at: string | null;
}
export function buildClientDocumentGuidance(docs: ReviewedDocument[]): string {
  const labels: Record<string, string> = { composicao_corporal: "Composição corporal", movimento: "Avaliação de movimento", exame_medico: "Exame médico" };
  return docs.filter(d => d.reviewed_summary?.trim()).map(d => {
    const data = d.extracted_data;
    const limitations = data && typeof data === "object" && "limitations" in data && typeof data.limitations === "string" ? data.limitations : "";
    const confirmed = d.profile_applied_at && d.reviewed_profile && typeof d.reviewed_profile === "object" ? JSON.stringify(d.reviewed_profile) : "";
    return `[${labels[d.category] ?? d.category}] ${d.title} | fonte ${d.id} | data ${d.document_date ?? "não confirmada"}\n${d.reviewed_summary?.trim()}${confirmed ? `\nValores confirmados no cadastro (kg, cm, anos ou % conforme o campo): ${confirmed}` : ""}${limitations ? `\nLimitações documentadas: ${limitations}` : ""}`;
  }).join("\n\n");
}