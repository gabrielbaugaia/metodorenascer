import jsPDF from "jspdf";
import { format } from "date-fns";
import { CIRCUMFERENCES, METHOD_NOTE, PHOTO_POSITIONS, SKINFOLDS, fmt } from "@/lib/physicalAssessment";
import { PDF_COLORS, drawFooters, setDraw, setFill, setText } from "@/lib/pdfTheme";
import type { AssessmentPhoto, AssessmentRow } from "@/hooks/usePhysicalAssessments";

/**
 * Carrega a foto já com a orientação correta.
 * O arquivo original pode trazer a rotação apenas no metadado EXIF (comum em
 * fotos de celular); ao redesenhar em canvas o navegador aplica essa rotação,
 * então a imagem embutida no PDF fica em pé e sem distorção.
 */
async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return { data: canvas.toDataURL("image/jpeg", 0.92), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

const dateBR = (d: string) => format(new Date(d + "T12:00:00"), "dd/MM/yyyy");

/** Barra horizontal rotulada, escala proporcional ao maior valor do conjunto. */
function barChart(
  doc: jsPDF,
  title: string,
  items: { label: string; value: number; display: string }[],
  x: number,
  startY: number,
  width: number,
): number {
  let y = startY;
  setText(doc, PDF_COLORS.bronze);
  doc.setFont("helvetica", "bold").setFontSize(9).text(title.toUpperCase(), x, y);
  y += 6;
  const max = Math.max(...items.map((i) => i.value), 1e-9);
  const labelW = 34;
  const valueW = 20;
  const barMax = width - labelW - valueW - 4;
  for (const item of items) {
    setText(doc, PDF_COLORS.text);
    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text(item.label, x, y + 2.6, { maxWidth: labelW });
    setFill(doc, PDF_COLORS.hairline);
    doc.roundedRect(x + labelW + 2, y, barMax, 3.4, 1.2, 1.2, "F");
    setFill(doc, PDF_COLORS.bronze);
    const w = Math.max((item.value / max) * barMax, 1.2);
    doc.roundedRect(x + labelW + 2, y, w, 3.4, 1.2, 1.2, "F");
    setText(doc, PDF_COLORS.muted);
    doc.text(item.display, x + labelW + 2 + barMax + 3, y + 2.6);
    y += 6.4;
  }
  return y + 3;
}

export async function exportAssessmentPdf(a: AssessmentRow, photos: AssessmentPhoto[], studentName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const bronze = PDF_COLORS.bronze;
  const W = 210;
  let y = 18;

  doc.setFont("times", "bold").setFontSize(18).text("Avaliação Física", 15, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...bronze)
    .text("GABRIEL BAÚ | ENGENHARIA DO MOVIMENTO", 15, y + 6);
  doc.setTextColor(30, 30, 30).setFontSize(10)
    .text(`${studentName}  ·  ${dateBR(a.assessed_at)}  ·  versão ${a.version}`, 15, y + 12);
  y += 20;
  doc.setDrawColor(...bronze).line(15, y, W - 15, y);
  y += 7;

  const r = a.results;
  const rows: [string, string][] = [
    ["Idade na avaliação", a.age_years != null ? `${a.age_years} anos` : "—"],
    ["Sexo (equação)", a.sex === "male" ? "Masculino" : a.sex === "female" ? "Feminino" : "—"],
    ["Peso", `${fmt(a.weight_kg)} kg`],
    ["Altura", `${fmt(a.height_cm, 0)} cm`],
    ["Gordura corporal estimada", `${fmt(r?.body_fat_pct, 2)} %`],
    ["Massa gorda", `${fmt(r?.fat_mass_kg, 2)} kg`],
    ["Massa livre de gordura", `${fmt(r?.lean_mass_kg, 2)} kg`],
    ["IMC", fmt(r?.bmi, 2)],
    ["RCQ (cintura/quadril)", fmt(r?.whr, 3)],
    ["RCE (cintura/estatura)", fmt(r?.whtr, 3)],
    ["Soma das 7 dobras", `${fmt(r?.skinfold_sum, 1)} mm`],
  ];
  const col = (title: string, items: [string, string][], x: number, startY: number) => {
    let yy = startY;
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...bronze).text(title.toUpperCase(), x, yy);
    yy += 5;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(30, 30, 30);
    for (const [k, v] of items) {
      doc.text(k, x, yy);
      doc.text(v, x + 82, yy, { align: "right" });
      yy += 5;
    }
    return yy;
  };
  const y1 = col("Resultados", rows, 15, y);
  const sf = SKINFOLDS.map((s) => [s.label, `${fmt(a.skinfolds?.[s.key])} mm`] as [string, string]);
  const y2 = col("Dobras cutâneas", sf, 112, y);
  y = Math.max(y1, y2) + 4;
  const circ = CIRCUMFERENCES.filter((c) => a.circumferences?.[c.key] != null)
    .map((c) => [c.label, `${fmt(a.circumferences[c.key])} cm`] as [string, string]);
  if (circ.length) {
    const half = Math.ceil(circ.length / 2);
    const ya = col("Circunferências", circ.slice(0, half), 15, y);
    const yb = col(" ", circ.slice(half), 112, y);
    y = Math.max(ya, yb) + 4;
  }
  const para = (title: string, text: string | null) => {
    if (!text) return;
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...bronze).text(title.toUpperCase(), 15, y);
    y += 5;
    const lines = doc.setFont("helvetica", "normal").setTextColor(30, 30, 30).splitTextToSize(text, W - 30);
    doc.text(lines, 15, y);
    y += lines.length * 4.4 + 3;
  };
  para("Observações", a.notes);
  para("Recomendações", a.recommendations);

  // Página visual: gráficos de fácil leitura para o cliente
  doc.addPage();
  y = 18;
  doc.setFont("times", "bold").setFontSize(14).setTextColor(30, 30, 30).text("Seus resultados em gráficos", 15, y);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...PDF_COLORS.muted)
    .text("Barras proporcionais ao maior valor de cada grupo, para facilitar a comparação entre regiões.", 15, y + 5);
  y += 12;

  // Composição corporal: barra empilhada massa gorda x massa livre de gordura
  if (r?.fat_mass_kg != null && r?.lean_mass_kg != null && a.weight_kg) {
    setText(doc, PDF_COLORS.bronze);
    doc.setFont("helvetica", "bold").setFontSize(9).text("COMPOSIÇÃO CORPORAL", 15, y);
    y += 6;
    const total = r.fat_mass_kg + r.lean_mass_kg;
    const barW = W - 30;
    const fatW = total > 0 ? (r.fat_mass_kg / total) * barW : 0;
    setFill(doc, PDF_COLORS.bronze);
    doc.roundedRect(15, y, Math.max(fatW, 2), 8, 1.5, 1.5, "F");
    setFill(doc, PDF_COLORS.graphite);
    doc.roundedRect(15 + fatW, y, Math.max(barW - fatW, 2), 8, 1.5, 1.5, "F");
    y += 12;
    setText(doc, PDF_COLORS.text);
    doc.setFont("helvetica", "normal").setFontSize(8);
    setFill(doc, PDF_COLORS.bronze);
    doc.rect(15, y - 2.4, 2.6, 2.6, "F");
    doc.text(`Massa gorda: ${fmt(r.fat_mass_kg, 1)} kg (${fmt(r.body_fat_pct, 1)}%)`, 19, y);
    setFill(doc, PDF_COLORS.graphite);
    doc.rect(95, y - 2.4, 2.6, 2.6, "F");
    doc.text(`Massa livre de gordura: ${fmt(r.lean_mass_kg, 1)} kg`, 99, y);
    y += 10;
  }

  const sfItems = SKINFOLDS.filter((s) => a.skinfolds?.[s.key] != null)
    .map((s) => ({ label: s.label, value: a.skinfolds[s.key] as number, display: `${fmt(a.skinfolds[s.key])} mm` }));
  if (sfItems.length) y = barChart(doc, "Dobras cutâneas (mm)", sfItems, 15, y, W - 30);

  const circItems = CIRCUMFERENCES.filter((c) => a.circumferences?.[c.key] != null)
    .map((c) => ({ label: c.label, value: a.circumferences[c.key] as number, display: `${fmt(a.circumferences[c.key])} cm` }));
  if (circItems.length) {
    if (y > 200) { doc.addPage(); y = 18; }
    y = barChart(doc, "Circunferências (cm)", circItems, 15, y, W - 30);
  }

  // Fotos (originais, sem filtros), orientação do celular aplicada e proporção preservada
  const withUrl = PHOTO_POSITIONS.map((p) => ({ p, photo: photos.find((x) => x.position === p.key) }))
    .filter((x) => x.photo?.url);
  if (withUrl.length) {
    doc.addPage();
    y = 18;
    doc.setFont("times", "bold").setFontSize(14).setTextColor(30, 30, 30).text("Registro fotográfico", 15, y);
    y += 6;
    const cellW = (W - 30 - 6) / 2;
    const cellH = 120;
    let i = 0;
    for (const { p, photo } of withUrl) {
      const img = await loadImage(photo!.url!);
      const cx = 15 + (i % 2) * (cellW + 6);
      const cy = y + Math.floor(i / 2) * (cellH + 10);
      doc.setFontSize(8).setTextColor(...bronze).text(p.label.toUpperCase(), cx, cy + 3);
      if (img) {
        const ratio = Math.min(cellW / img.w, (cellH - 6) / img.h);
        const w = img.w * ratio, h = img.h * ratio;
        doc.addImage(img.data, "JPEG", cx + (cellW - w) / 2, cy + 5, w, h);
      }
      i++;
    }
  }

  doc.addPage();
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...bronze).text("NOTA METODOLÓGICA", 15, 20);
  doc.setFont("helvetica", "normal").setTextColor(30, 30, 30)
    .text(doc.splitTextToSize(`${METHOD_NOTE} Versão do cálculo: ${a.calc_version ?? r?.version ?? "—"}.`, W - 30), 15, 26);
  doc.setFontSize(8).setTextColor(120, 120, 120).text("Equipe GB · Gabriel Baú Consultoria", 15, 285);

  drawFooters(doc);
  doc.save(`avaliacao-${a.assessed_at}.pdf`);
}
