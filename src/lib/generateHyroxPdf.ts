import { jsPDF } from "jspdf";
import {
  drawHeader,
  drawContinuationHeader,
  drawFooters,
  PDF_COLORS,
  setText,
} from "./pdfTheme";
import { checkpoints, dateBR, kindLabel } from "./hyrox90";
import type { Program, Activity, Review } from "@/hooks/useHyrox90";
export function generateHyroxPdf(
  program: Program,
  activities: Activity[],
  reviews: Review[],
) {
  const doc = new jsPDF();
  let y = drawHeader(doc, {
    title: "Protocolo de 90 dias",
    subtitle:
      program.status === "published"
        ? "Aprovado pelo treinador"
        : "Rascunho para revisão",
  });
  const width = 178;
  const write = (text: string, bold = false) => {
    if (bold && y > 250) {
      doc.addPage();
      y = drawContinuationHeader(doc, "Acompanhamento de 90 dias");
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    setText(doc, bold ? PDF_COLORS.bronze : PDF_COLORS.text);
    const lines = doc.splitTextToSize(text, width);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = drawContinuationHeader(doc, "Acompanhamento de 90 dias");
      }
      doc.text(line, 16, y);
      y += 5;
    }
    y += 3;
  };
  write(program.title, true);
  write(
    `Início: ${dateBR(program.start_date)} | Revisões: ${checkpoints(
      program.start_date,
    )
      .map((c) => dateBR(c.date))
      .join(" / ")}`,
  );
  write(program.config.goal);
  program.config.phases.forEach((p, i) => {
    write(
      `Fase ${i + 1} | dias ${i * 30 + 1}–${(i + 1) * 30}: ${p.name}`,
      true,
    );
    write(p.guidance);
  });
  program.config.workouts.forEach((w) => {
    write(w.name, true);
    write(w.instructions);
    w.exercises.forEach((ex) =>
      write(
        `${ex.name} | ${ex.sets} x ${ex.reps} | RIR ${ex.rir} | pausa ${ex.rest}`,
      ),
    );
  });
  write("Orientações externas e cuidados", true);
  write(program.config.external_notes);
  write(program.config.safety);
  if (program.config.baseline.length) {
    write("Avaliações de terceiros — valores documentados", true);
    program.config.baseline.forEach((b) =>
      write(
        `${dateBR(b.date)} | ${b.weight ?? "—"} kg | gordura ${b.fat ?? "—"}% | massa magra estimada ${b.lean ?? "—"} kg | cintura ${b.waist ?? "—"} cm | altura ${b.height ?? "—"} cm. Fonte: ${b.source}`,
      ),
    );
    write(
      "Variações de massa magra estimada não equivalem automaticamente a hipertrofia muscular.",
    );
  }
  const done = activities.filter((a) => a.status === "completed");
  if (done.length) {
    write("Registros realizados — declarados pelo aluno", true);
    done.forEach((a) =>
      write(
        `${dateBR(a.actual_date ?? a.planned_date)} | ${kindLabel[a.kind]} | duração ${a.duration_min ?? "—"} min | RPE ${a.rpe ?? "—"} | distância ${a.distance_km ?? "—"} km | pace ${a.pace ?? "—"}. ${a.notes}`,
      ),
    );
  }
  reviews
    .filter((r) => r.submitted_at)
    .forEach((r) => {
      write(`Revisão de ${r.checkpoint} dias`, true);
      Object.entries(r.responses as Record<string, string>).forEach(
        ([k, v]) => {
          if (v) write(`${k}: ${v}`);
        },
      );
      if (r.feedback) write(`Devolutiva do treinador: ${r.feedback}`);
    });
  write(
    "Equipe GB · Documentos externos preservam a autoria do profissional responsável. O plano alimentar original não é substituído por este resumo.",
  );
  drawFooters(doc);
  return doc;
}
