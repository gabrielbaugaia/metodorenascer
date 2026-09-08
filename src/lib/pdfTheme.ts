import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Identidade visual premium dos PDFs client-facing — Gabriel Baú Consultoria.
 * Paleta única, sem laranja legado, sem gradientes.
 */
export const PDF_COLORS = {
  graphite: [8, 10, 13] as [number, number, number],
  darkSurface: [17, 21, 27] as [number, number, number],
  offWhite: [245, 242, 236] as [number, number, number],
  surface: [251, 249, 245] as [number, number, number],
  text: [17, 18, 20] as [number, number, number],
  muted: [111, 115, 121] as [number, number, number],
  bronze: [176, 138, 87] as [number, number, number],
  bronzeLight: [194, 155, 107] as [number, number, number],
  hairline: [226, 221, 212] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export const PDF_MARGIN = 16;

const set = (
  fn: (r: number, g: number, b: number) => void,
  c: [number, number, number]
) => fn(c[0], c[1], c[2]);

export function setText(doc: jsPDF, c: [number, number, number]) {
  set((r, g, b) => doc.setTextColor(r, g, b), c);
}
export function setFill(doc: jsPDF, c: [number, number, number]) {
  set((r, g, b) => doc.setFillColor(r, g, b), c);
}
export function setDraw(doc: jsPDF, c: [number, number, number]) {
  set((r, g, b) => doc.setDrawColor(r, g, b), c);
}

/** Pinta o fundo off-white da página atual. */
export function paintPageBackground(doc: jsPDF) {
  setFill(doc, PDF_COLORS.offWhite);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
}

interface HeaderOptions {
  title: string;
  subtitle?: string;
  meta?: string[];
}

/**
 * Cabeçalho premium discreto: bloco grafite fino com marca + título.
 * Retorna a posição Y inicial do conteúdo.
 */
export function drawHeader(doc: jsPDF, { title, subtitle, meta }: HeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  paintPageBackground(doc);

  setFill(doc, PDF_COLORS.graphite);
  doc.rect(0, 0, pageWidth, 34, "F");

  // Marca
  setText(doc, PDF_COLORS.offWhite);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GABRIEL BAÚ", PDF_MARGIN, 13);
  setText(doc, PDF_COLORS.bronzeLight);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("C O N S U L T O R I A", PDF_MARGIN, 17.5);

  // Título
  setText(doc, PDF_COLORS.white);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(title, PDF_MARGIN, 27.5);

  if (subtitle) {
    setText(doc, PDF_COLORS.bronzeLight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth - PDF_MARGIN, 13, { align: "right" });
  }

  if (meta && meta.length) {
    setText(doc, [168, 173, 181]);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(meta.join("   ·   "), pageWidth - PDF_MARGIN, 27.5, { align: "right" });
  }

  // Fio bronze
  setFill(doc, PDF_COLORS.bronze);
  doc.rect(0, 34, pageWidth, 0.8, "F");

  return 46;
}

/** Cabeçalho leve para páginas de continuação. */
export function drawContinuationHeader(doc: jsPDF, label: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  paintPageBackground(doc);
  setText(doc, PDF_COLORS.muted);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("GABRIEL BAÚ CONSULTORIA", PDF_MARGIN, 14);
  doc.setFont("helvetica", "normal");
  doc.text(label, pageWidth - PDF_MARGIN, 14, { align: "right" });
  setFill(doc, PDF_COLORS.hairline);
  doc.rect(PDF_MARGIN, 17, pageWidth - PDF_MARGIN * 2, 0.3, "F");
  return 26;
}

/** Rodapé minimalista aplicado em todas as páginas. */
export function drawFooters(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setFill(doc, PDF_COLORS.hairline);
    doc.rect(PDF_MARGIN, pageHeight - 14, pageWidth - PDF_MARGIN * 2, 0.3, "F");
    setText(doc, PDF_COLORS.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gabriel Baú Consultoria  ·  Página ${i} de ${total}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }
}

export function formatPtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}
