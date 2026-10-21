import jsPDF from "jspdf";
import { format } from "date-fns";
import { CIRCUMFERENCES, METHOD_NOTE, PHOTO_POSITIONS, SKINFOLDS, fmt } from "@/lib/physicalAssessment";
import type { AssessmentPhoto, AssessmentRow } from "@/hooks/usePhysicalAssessments";

async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const data: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
    const dims: { w: number; h: number } = await new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res({ w: 3, h: 4 });
      img.src = data;
    });
    return { data, ...dims };
  } catch {
    return null;
  }
}

const dateBR = (d: string) => format(new Date(d + "T12:00:00"), "dd/MM/yyyy");

export async function exportAssessmentPdf(a: AssessmentRow, photos: AssessmentPhoto[], studentName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const bronze: [number, number, number] = [176, 138, 87];
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

  // Fotos (originais, sem filtros), proporção preservada
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
        const fmtImg = img.data.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(img.data, fmtImg, cx + (cellW - w) / 2, cy + 5, w, h);
      }
      i++;
    }
  }

  doc.addPage();
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...bronze).text("NOTA METODOLÓGICA", 15, 20);
  doc.setFont("helvetica", "normal").setTextColor(30, 30, 30)
    .text(doc.splitTextToSize(`${METHOD_NOTE} Versão do cálculo: ${a.calc_version ?? r?.version ?? "—"}.`, W - 30), 15, 26);
  doc.setFontSize(8).setTextColor(120, 120, 120).text("Equipe GB · Gabriel Baú Consultoria", 15, 285);

  doc.save(`avaliacao-${a.assessed_at}.pdf`);
}
