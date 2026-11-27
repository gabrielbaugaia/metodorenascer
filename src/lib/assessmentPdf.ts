import jsPDF from "jspdf";
import { format } from "date-fns";
import { CIRCUMFERENCES, METHOD_NOTE, PHOTO_POSITIONS, SKINFOLDS, fmt } from "@/lib/physicalAssessment";
import { PDF_COLORS, drawFooters, setDraw, setFill, setText } from "@/lib/pdfTheme";
import { HIGHLIGHT_KEYS, buildComparison } from "@/lib/assessmentComparison";
import type { AssessmentPhoto, AssessmentRow } from "@/hooks/usePhysicalAssessments";

/**
 * Carrega a foto já com a orientação correta.
 * O arquivo original pode trazer a rotação apenas no metadado EXIF (comum em
 * fotos de celular); ao redesenhar em canvas o navegador aplica essa rotação,
 * então a imagem embutida no PDF fica em pé e sem distorção.
 */
export async function loadImageOriented(url: string): Promise<{ data: string; w: number; h: number } | null> {
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
      const img = await loadImageOriented(photo!.url!);
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

/** PDF de comparação entre duas avaliações (antes → depois), no padrão Gabriel Baú. */
export async function exportComparisonPdf(before: AssessmentRow, after: AssessmentRow, photosBefore: AssessmentPhoto[], photosAfter: AssessmentPhoto[], studentName: string) {
  const cmp = buildComparison(before, after);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 15, CW = W - M * 2;
  let y = 18;
  const signed = (n: number | null, d: number) => (n == null ? "—" : `${n > 0 ? "+" : ""}${fmt(n, d)}`);
  const ensure = (h: number) => { if (y + h > 275) { doc.addPage(); y = 18; } };
  const heading = (t: string) => { ensure(14); setText(doc, PDF_COLORS.bronze); doc.setFont("helvetica", "bold").setFontSize(9).text(t.toUpperCase(), M, y); y += 6; };

  doc.setFont("times", "bold").setFontSize(18); setText(doc, PDF_COLORS.text); doc.text("Comparação de Avaliações Físicas", M, y);
  setText(doc, PDF_COLORS.bronze); doc.setFont("helvetica", "normal").setFontSize(9).text("GABRIEL BAÚ | ENGENHARIA DO MOVIMENTO", M, y + 6);
  setText(doc, PDF_COLORS.text); doc.setFontSize(10).text(`${studentName}  ·  ${dateBR(cmp.before.assessed_at)} a ${dateBR(cmp.after.assessed_at)}  ·  ${cmp.days} dias`, M, y + 12);
  y += 18; setDraw(doc, PDF_COLORS.bronze); doc.line(M, y, W - M, y); y += 8;

  // Quadro resumo
  heading("Resumo da evolução");
  const hl = HIGHLIGHT_KEYS.map((k) => cmp.rows.find((r) => r.metric.key === k)).filter(Boolean) as typeof cmp.rows;
  const cols = 4, gap = 3, bw = (CW - gap * (cols - 1)) / cols, bh = 22;
  hl.forEach((r, i) => {
    const cx = M + (i % cols) * (bw + gap), cy = y + Math.floor(i / cols) * (bh + gap);
    setFill(doc, PDF_COLORS.surface); doc.roundedRect(cx, cy, bw, bh, 2, 2, "F");
    setText(doc, PDF_COLORS.muted); doc.setFont("helvetica", "normal").setFontSize(7).text(r.metric.label.toUpperCase(), cx + 3, cy + 5, { maxWidth: bw - 6 });
    setText(doc, PDF_COLORS.text); doc.setFont("times", "bold").setFontSize(13).text(`${fmt(r.after, r.metric.digits)} ${r.metric.unit}`, cx + 3, cy + 12.5);
    setText(doc, r.trend.tone === "good" ? PDF_COLORS.bronze : PDF_COLORS.muted); doc.setFont("helvetica", "normal").setFontSize(7.5)
      .text(`${signed(r.abs, r.metric.digits)} ${r.metric.unit}  (antes ${fmt(r.before, r.metric.digits)})`, cx + 3, cy + 18.5, { maxWidth: bw - 6 });
  });
  y += Math.ceil(hl.length / cols) * (bh + gap) + 6;

  // Tabela completa
  heading("Tabela completa");
  const cx = [M, M + 70, M + 98, M + 126, M + 152];
  const head = () => {
    setFill(doc, PDF_COLORS.graphite); doc.rect(M, y - 4, CW, 7, "F");
    setText(doc, PDF_COLORS.offWhite); doc.setFont("helvetica", "bold").setFontSize(8);
    ["Indicador", dateBR(cmp.before.assessed_at), dateBR(cmp.after.assessed_at), "Diferença", "%"].forEach((t, i) => doc.text(t, cx[i] + (i ? 0 : 2), y + 0.5));
    y += 7;
  };
  head();
  cmp.rows.forEach((r, i) => {
    if (y > 272) { doc.addPage(); y = 22; head(); }
    if (i % 2 === 0) { setFill(doc, PDF_COLORS.offWhite); doc.rect(M, y - 4, CW, 6, "F"); }
    setText(doc, PDF_COLORS.text); doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text(`${r.metric.label}${r.metric.unit ? ` (${r.metric.unit})` : ""}`, cx[0] + 2, y);
    doc.text(fmt(r.before, r.metric.digits), cx[1], y); doc.text(fmt(r.after, r.metric.digits), cx[2], y);
    setText(doc, r.trend.tone === "good" ? PDF_COLORS.bronze : PDF_COLORS.text);
    doc.text(signed(r.abs, r.metric.digits), cx[3], y); doc.text(r.pct == null ? "—" : `${signed(r.pct, 1)}%`, cx[4], y);
    y += 6;
  });
  y += 4;
  setText(doc, PDF_COLORS.muted); doc.setFontSize(7.5).text(doc.splitTextToSize("Peso, IMC, dobras isoladas e circunferências são variações neutras: dependem do objetivo e são interpretadas no acompanhamento.", CW), M, y);
  y += 10;

  // Barras antes/depois
  const dual = (title: string, rows: typeof cmp.rows) => {
    if (!rows.length) return;
    doc.addPage(); y = 18;
    heading(title);
    setFill(doc, PDF_COLORS.hairline); doc.rect(M, y - 2.5, 4, 2, "F"); setText(doc, PDF_COLORS.muted); doc.setFontSize(7.5).text(`Antes (${dateBR(cmp.before.assessed_at)})`, M + 6, y - 0.8);
    setFill(doc, PDF_COLORS.bronze); doc.rect(M + 55, y - 2.5, 4, 2, "F"); doc.text(`Depois (${dateBR(cmp.after.assessed_at)})`, M + 61, y - 0.8);
    y += 6;
    const max = Math.max(...rows.flatMap((r) => [r.before ?? 0, r.after ?? 0]), 1e-9);
    const lw = 38, vw = 34, bm = CW - lw - vw - 4;
    for (const r of rows) {
      ensure(12);
      setText(doc, PDF_COLORS.text); doc.setFont("helvetica", "normal").setFontSize(8).text(r.metric.label.replace(/^Dobra /, ""), M, y + 3, { maxWidth: lw });
      setFill(doc, PDF_COLORS.hairline); doc.roundedRect(M + lw, y, Math.max(((r.before ?? 0) / max) * bm, 1), 3, 1, 1, "F");
      setFill(doc, PDF_COLORS.bronze); doc.roundedRect(M + lw, y + 4, Math.max(((r.after ?? 0) / max) * bm, 1), 3, 1, 1, "F");
      setText(doc, PDF_COLORS.muted); doc.text(`${fmt(r.before, 1)} > ${fmt(r.after, 1)} (${signed(r.abs, 1)})`, M + lw + bm + 3, y + 5);
      y += 11;
    }
  };
  dual("Dobras cutâneas (mm)", cmp.rows.filter((r) => r.metric.key.startsWith("sf_")));
  dual("Circunferências (cm)", cmp.rows.filter((r) => r.metric.key.startsWith("c_") || r.metric.key === "waist"));

  // Fotos lado a lado por posição
  const pairs = PHOTO_POSITIONS.map((p) => ({ p, a: photosBefore.find((x) => x.position === p.key), b: photosAfter.find((x) => x.position === p.key) })).filter((x) => x.a?.url || x.b?.url);
  if (pairs.length) {
    const cellW = (CW - 6) / 2, cellH = 105;
    let row = 0;
    for (const { p, a, b } of pairs) {
      if (row % 2 === 0) { doc.addPage(); y = 18; setText(doc, PDF_COLORS.text); doc.setFont("times", "bold").setFontSize(14).text("Registro fotográfico", M, y); y += 8; }
      setText(doc, PDF_COLORS.bronze); doc.setFont("helvetica", "bold").setFontSize(8).text(p.label.toUpperCase(), M, y);
      const items = [{ ph: a, d: cmp.before.assessed_at }, { ph: b, d: cmp.after.assessed_at }];
      for (let i = 0; i < 2; i++) {
        const x0 = M + i * (cellW + 6);
        setText(doc, PDF_COLORS.muted); doc.setFont("helvetica", "normal").setFontSize(7.5).text(dateBR(items[i].d), x0, y + 5);
        const img = items[i].ph?.url ? await loadImageOriented(items[i].ph!.url!) : null;
        if (img) { const r = Math.min(cellW / img.w, (cellH - 10) / img.h); const w = img.w * r, h = img.h * r; doc.addImage(img.data, "JPEG", x0 + (cellW - w) / 2, y + 8, w, h); }
        else { setDraw(doc, PDF_COLORS.hairline); doc.rect(x0, y + 8, cellW, cellH - 10); doc.text("Sem foto", x0 + cellW / 2, y + cellH / 2, { align: "center" }); }
      }
      y += cellH + 8; row++;
    }
  }

  doc.addPage(); y = 20;
  const para = (title: string, text: string | null) => {
    if (!text) return;
    heading(title);
    setText(doc, PDF_COLORS.text); doc.setFont("helvetica", "normal").setFontSize(9);
    const lines = doc.splitTextToSize(text, CW); ensure(lines.length * 4.4); doc.text(lines, M, y); y += lines.length * 4.4 + 5;
  };
  para(`Observações (${dateBR(cmp.after.assessed_at)})`, cmp.after.notes);
  para(`Recomendações (${dateBR(cmp.after.assessed_at)})`, cmp.after.recommendations);
  para("Nota metodológica", METHOD_NOTE);
  setText(doc, PDF_COLORS.muted); doc.setFontSize(8).text("Equipe GB · Gabriel Baú Consultoria", M, 285);

  drawFooters(doc);
  doc.save(`comparacao-${cmp.before.assessed_at}-${cmp.after.assessed_at}.pdf`);
}
