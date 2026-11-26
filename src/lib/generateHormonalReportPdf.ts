import { jsPDF } from "jspdf";
import type { PrescriptionTable } from "./hormonalPrescription";
import type { StudyNotes } from "./hormonalStudy";
import { drawContinuationHeader, drawFooters, drawHeader, PDF_COLORS, PDF_MARGIN, setDraw, setFill, setText } from "./pdfTheme";

export type HormonalProfile = { reference: string; doctor: string; date: string; history: string; prescription: string; symptoms: string; questions: string };
export type HormonalExam = { id: string; name: string; date: string; done: boolean };
type ReportClient = { full_name: string; age: number | null; weight: number | null; sexo: string | null; restricoes_medicas: string | null; injuries: string | null };
type Report = { profile: HormonalProfile; client: ReportClient | null; study: StudyNotes; exams: HormonalExam[]; table: PrescriptionTable };

export function generateHormonalReportPdf({ profile, client, study, exams, table }: Report): jsPDF {
  const pdf = new jsPDF();
  const width = pdf.internal.pageSize.getWidth() - PDF_MARGIN * 2;
  const bottom = pdf.internal.pageSize.getHeight() - 22;
  let y = drawHeader(pdf, { title: "Registro de prescrição médica", subtitle: "Admin · Registro informativo" });
  function newPage() {
    pdf.addPage();
    y = drawContinuationHeader(pdf, "Acompanhamento hormonal");
  }
  function text(content: string, size = 9, bold = false) {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size); setText(pdf, PDF_COLORS.text);
    const lines: string[] = pdf.splitTextToSize(content || "Não informado", width);
    for (const line of lines) {
      if (y + 5 > bottom) { newPage(); pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); setText(pdf, PDF_COLORS.text); }
      pdf.text(line, PDF_MARGIN, y); y += size * 0.5;
    }
    y += 3;
  }
  function section(title: string) {
    if (y + 18 > bottom) newPage();
    y += 3; setDraw(pdf, PDF_COLORS.bronze); pdf.line(PDF_MARGIN, y, PDF_MARGIN + width, y); y += 7;
    pdf.setFont("times", "normal"); pdf.setFontSize(14); setText(pdf, PDF_COLORS.bronze);
    pdf.text(title, PDF_MARGIN, y); y += 9;
  }
  text(`Data do relatório: ${new Date().toLocaleDateString("pt-BR")}`);
  text("Transcrição informativa de prescrição médica existente. Não constitui prescrição, diagnóstico, recomendação de doses ou validação de ciclos e TPC.");
  section("Cliente e documento médico");
  text(`Cliente / referência: ${client?.full_name || profile.reference || "Não informado"}`, 10, true);
  if (client) {
    text(`Idade cadastrada: ${client.age ?? "Não informada"} · Peso cadastrado: ${client.weight == null ? "Não informado" : `${client.weight} kg`} · Sexo: ${client.sexo || "Não informado"}`);
    text(`Restrições médicas: ${client.restricoes_medicas || "Não informadas"}`);
    text(`Lesões informadas: ${client.injuries || "Não informadas"}`);
  }
  text(`Médico responsável / CRM: ${profile.doctor || "Não informado"}`);
  text(`Data da consulta: ${profile.date || "Não informada"}`);
  if (profile.history.trim()) { text("Histórico informado", 10, true); text(profile.history); }
  if (profile.prescription.trim()) { section("Prescrição médica existente — transcrição"); text(profile.prescription); }

  if (table.medications.length) {
    section("Medicamentos e orientações transcritas");
    for (const medication of table.medications) {
      text(medication.name || "Medicamento sem nome", 10, true);
      text(medication.instructions || "Orientações não transcritas.");
    }
  }
  if (table.weeks.length && table.medications.length) {
    // Split wide tables, repeat every week in each group; never truncate data.
    for (let start = 0; start < table.medications.length; start += 3) {
      const medications = table.medications.slice(start, start + 3);
      newPage(); section(`Tabela semanal transcrita${table.medications.length > 3 ? ` · Parte ${Math.floor(start / 3) + 1}` : ""}`);
      const weekWidth = 19;
      const cellWidth = (width - weekWidth) / medications.length;
      function tableHeader() {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(8);
        const names: string[][] = medications.map((medication) => pdf.splitTextToSize(medication.name || "Sem nome", cellWidth - 6));
        const height = Math.max(1, ...names.map((lines) => lines.length)) * 4 + 7;
        setFill(pdf, PDF_COLORS.graphite); pdf.rect(PDF_MARGIN, y, width, height, "F");
        setText(pdf, PDF_COLORS.offWhite); pdf.text("Semana", PDF_MARGIN + 3, y + 6);
        setText(pdf, PDF_COLORS.bronzeLight);
        names.forEach((lines, index) => lines.forEach((line, lineIndex) => pdf.text(line, PDF_MARGIN + weekWidth + index * cellWidth + 3, y + 6 + lineIndex * 4)));
        y += height;
      }
      tableHeader();
      table.weeks.forEach((week, weekIndex) => {
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
        const cells: string[][] = medications.map((medication) => pdf.splitTextToSize(week.entries[medication.id]?.trim() || "Não transcrito", cellWidth - 6));
        const totalLines = Math.max(...cells.map((lines) => lines.length));
        let offset = 0;
        while (offset < totalLines) {
          if (y + 12 > bottom) { newPage(); tableHeader(); }
          const lineCount = Math.min(totalLines - offset, Math.max(1, Math.floor((bottom - y - 7) / 4)));
          const height = lineCount * 4 + 7;
          setFill(pdf, weekIndex % 2 === 0 ? PDF_COLORS.surface : PDF_COLORS.offWhite); pdf.rect(PDF_MARGIN, y, width, height, "F");
          pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
          setText(pdf, PDF_COLORS.bronze); pdf.text(`S${weekIndex + 1}${offset > 0 ? " (cont.)" : ""}`, PDF_MARGIN + 2, y + 6);
          setText(pdf, PDF_COLORS.text);
          cells.forEach((lines, index) => lines.slice(offset, offset + lineCount).forEach((line, lineIndex) => pdf.text(line, PDF_MARGIN + weekWidth + index * cellWidth + 3, y + 6 + lineIndex * 4)));
          y += height; setDraw(pdf, PDF_COLORS.hairline); pdf.line(PDF_MARGIN, y, PDF_MARGIN + width, y);
          offset += lineCount;
        }
      });
      y += 8;
    }
  }
  if (profile.symptoms.trim() || profile.questions.trim()) {
    section("Acompanhamento");
    text("Sintomas e observações", 10, true); text(profile.symptoms);
    text("Questões para a próxima consulta", 10, true); text(profile.questions);
  }
  if (exams.length) {
    section("Exames solicitados pelo médico");
    exams.forEach((exam) => text(`${exam.done ? "Realizado" : "Pendente"} — ${exam.name}${exam.date ? ` — ${exam.date}` : ""}`));
  }
  if (Object.values(study).some((value) => value.trim())) {
    section("Base de estudo e referências");
    for (const [title, value] of [["Tema", study.topic], ["Substância de referência (não é indicação)", study.substance], ["Notas de estudo", study.notes], ["Referências consultadas", study.references]]) {
      if (value.trim()) { text(title, 10, true); text(value); }
    }
  }
  section("Aviso e confidencialidade");
  text("Documento restrito ao Admin. As informações foram registradas manualmente e não são validadas pelo sistema. Dados do cadastro não determinam doses, frequências, associações, ciclos ou TPC.");
  text("Este registro não substitui orientação médica. Consulte um profissional de saúde habilitado antes de iniciar ou alterar qualquer tratamento. O uso de anabolizantes sem prescrição pode ser ilegal conforme a legislação aplicável.");
  drawFooters(pdf);
  return pdf;
}