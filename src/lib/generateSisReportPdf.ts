import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { classify, safeMean, type SisScoreRow } from "./sisScoreCalc";

interface SisReportData {
  userName: string;
  scores30d: SisScoreRow[];
  avg7: number;
  avg14: number;
  avg30: number;
  delta7vs30: number;
  currentStreak: number;
  bestStreak: number;
}

export function generateSisReportPdf(data: SisReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const addHeader = () => {
    doc.setFillColor(255, 69, 0);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SHAPE INTELLIGENCE SYSTEM™", margin, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Método Renascer — Relatório Executivo", margin, 25);
    yPos = 42;
  };

  const addFooter = (pageNum: number) => {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} · Página ${pageNum}`, margin, pageHeight - 8);
    doc.text("Método Renascer · Shape Intelligence System™", pageWidth - margin, pageHeight - 8, { align: "right" });
  };

  const addSectionBar = (title: string) => {
    doc.setFillColor(255, 69, 0);
    doc.rect(margin, yPos - 4, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 3, yPos + 1);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  };

  const ensureSpace = (needed: number) => {
    if (yPos + needed > pageHeight - 20) {
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      yPos = 20;
    }
  };

  // Sort scores by date
  const sorted = [...data.scores30d].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const latestScore = latest?.shape_intelligence_score ?? 0;
  const latestClass = classify(latestScore);

  // ======= PAGE 1 — RESUMO EXECUTIVO =======
  addHeader();

  // Student name + date
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Aluno: ${data.userName}`, margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: últimos 30 dias · ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, margin, yPos);
  yPos += 12;

  // Main score
  addSectionBar("Shape Intelligence Score™");

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 69, 0);
  doc.text(`${Math.round(latestScore)}`, margin + 5, yPos + 12);

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(`/ 100`, margin + 35, yPos + 12);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const classColor = latestClass.classification === "ELITE" ? [0, 150, 0] :
    latestClass.classification === "ALTA_PERFORMANCE" ? [0, 150, 80] :
    latestClass.classification === "MODERADO" ? [200, 150, 0] : [200, 50, 50];
  doc.setTextColor(classColor[0], classColor[1], classColor[2]);
  doc.text(latestClass.label, margin + 65, yPos + 12);

  // Delta
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const delta = data.delta7vs30;
  const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  doc.setTextColor(delta >= 0 ? 0 : 200, delta >= 0 ? 130 : 50, delta >= 0 ? 0 : 50);
  doc.text(`Tendência 7d vs 30d: ${deltaStr}`, margin + 65, yPos + 18);
  yPos += 28;

  // Streak
  if (data.currentStreak > 0) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`🔥 Streak: ${data.currentStreak} dias consecutivos (recorde: ${data.bestStreak})`, margin, yPos);
    yPos += 8;
  }

  // Sub-scores grid
  addSectionBar("Sub-scores");

  const subScores = [
    { label: "Performance Mecânica", value: latest?.mechanical_score, weight: "25%" },
    { label: "Recuperação", value: latest?.recovery_score, weight: "20%" },
    { label: "Estrutura/Postura", value: latest?.structural_score, weight: "15%" },
    { label: "Composição Corporal", value: latest?.body_comp_score, weight: "15%" },
    { label: "Cognitivo", value: latest?.cognitive_score, weight: "15%" },
    { label: "Consistência", value: latest?.consistency_score, weight: "10%" },
  ];

  const colWidth = contentWidth / 3;
  subScores.forEach((sub, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colWidth;
    const y = yPos + row * 18;

    // Background box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y - 4, colWidth - 4, 15, 2, 2, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${sub.label} (${sub.weight})`, x + 3, y + 2);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const val = sub.value !== null && sub.value !== undefined ? Math.round(sub.value) : "—";
    doc.setTextColor(0, 0, 0);
    doc.text(`${val}`, x + 3, y + 9);
  });
  yPos += 42;

  // Averages
  addSectionBar("Médias");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Média 7 dias: ${data.avg7.toFixed(1)}   |   Média 14 dias: ${data.avg14.toFixed(1)}   |   Média 30 dias: ${data.avg30.toFixed(1)}`, margin, yPos);
  yPos += 10;

  // Alerts
  const alerts = latest?.alerts || [];
  if (alerts.length > 0) {
    addSectionBar("Alertas Ativos");
    for (const alert of alerts) {
      ensureSpace(12);
      const priorityColor = alert.priority === "alta" ? [220, 50, 50] : [200, 150, 0];
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      doc.text(`[${alert.priority.toUpperCase()}]`, margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`${alert.message} — ${alert.action}`, margin + 18, yPos);
      yPos += 6;
    }
  }

  addFooter(1);

  // ======= PAGE 2 — TENDÊNCIAS (30 DIAS) =======
  doc.addPage();
  yPos = 20;
  addSectionBar("Tendência Diária — Últimos 30 Dias");

  // Table header
  const cols = [
    { label: "Data", width: 25 },
    { label: "SIS", width: 18 },
    { label: "Mecânico", width: 22 },
    { label: "Recuperação", width: 25 },
    { label: "Cognitivo", width: 22 },
    { label: "Consistência", width: 25 },
    { label: "Classe", width: 35 },
  ];

  doc.setFillColor(255, 69, 0);
  doc.rect(margin, yPos - 4, contentWidth, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  let xPos = margin + 2;
  for (const col of cols) {
    doc.text(col.label, xPos, yPos);
    xPos += col.width;
  }
  yPos += 6;

  // Table rows
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < sorted.length; i++) {
    ensureSpace(6);
    const row = sorted[i];
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, yPos - 3.5, contentWidth, 5, "F");
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    xPos = margin + 2;

    const fmtDate = format(new Date(row.date + "T12:00:00"), "dd/MM", { locale: ptBR });
    const fmtVal = (v: number | null) => v !== null && v !== undefined ? Math.round(v).toString() : "—";

    doc.text(fmtDate, xPos, yPos); xPos += cols[0].width;
    doc.text(fmtVal(row.shape_intelligence_score), xPos, yPos); xPos += cols[1].width;
    doc.text(fmtVal(row.mechanical_score), xPos, yPos); xPos += cols[2].width;
    doc.text(fmtVal(row.recovery_score), xPos, yPos); xPos += cols[3].width;
    doc.text(fmtVal(row.cognitive_score), xPos, yPos); xPos += cols[4].width;
    doc.text(fmtVal(row.consistency_score), xPos, yPos); xPos += cols[5].width;
    doc.text(row.classification || "—", xPos, yPos);
    yPos += 5;
  }

  if (sorted.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Nenhum dado disponível para o período.", margin, yPos);
    yPos += 8;
  }

  addFooter(2);

  // ======= PAGE 3 — MÓDULOS DETALHADOS =======
  doc.addPage();
  yPos = 20;
  addSectionBar("Detalhamento por Módulo");

  const moduleDetails = [
    {
      name: "Performance Mecânica",
      score: latest?.mechanical_score,
      desc: "Volume de treino, densidade (volume/tempo) e percepção de esforço (RPE).",
      insight: (s: number | null) => s === null ? "Sem treinos registrados no período." :
        s >= 70 ? "Performance mecânica sólida. Continue progredindo cargas." :
        s >= 50 ? "Performance moderada. Revise progressão de cargas." :
        "Performance abaixo do esperado. Foque em técnica e recuperação.",
    },
    {
      name: "Recuperação",
      score: latest?.recovery_score,
      desc: "Sono, estresse, fadiga, HRV e frequência cardíaca de repouso.",
      insight: (s: number | null) => s === null ? "Sem dados de recuperação registrados." :
        s >= 70 ? "Boa recuperação. Corpo preparado para carga." :
        s >= 50 ? "Recuperação moderada. Monitore sono e estresse." :
        "Recuperação comprometida. Priorize descanso.",
    },
    {
      name: "Estrutura/Postura",
      score: latest?.structural_score,
      desc: "Avaliação de padrões de movimento: agachamento, dobradiça, overhead e mobilidade.",
      insight: (s: number | null) => s !== null && s >= 70 ? "Boa qualidade de movimento." :
        "Avaliação estrutural pendente ou com pontos de atenção.",
    },
    {
      name: "Composição Corporal",
      score: latest?.body_comp_score,
      desc: "Percentual de gordura, circunferência de cintura e tendência de peso.",
      insight: (s: number | null) => s !== null && s >= 70 ? "Composição corporal favorável." :
        s !== null && s >= 50 ? "Composição corporal moderada. Foque em nutrição." :
        "Dados insuficientes ou composição corporal requer atenção.",
    },
    {
      name: "Cognitivo",
      score: latest?.cognitive_score,
      desc: "Energia mental, clareza, foco, irritabilidade e disciplina alimentar.",
      insight: (s: number | null) => s === null ? "Sem check-in cognitivo registrado." :
        s >= 70 ? "Estado cognitivo positivo." :
        "Estado cognitivo requer atenção. Monitore estresse e sono.",
    },
    {
      name: "Consistência",
      score: latest?.consistency_score,
      desc: "Frequência de registros nos últimos 14 dias (treinos, check-ins, cognitivo).",
      insight: (s: number | null) => s !== null && s >= 70 ? "Excelente consistência de registros." :
        s !== null && s >= 50 ? "Consistência moderada. Registre dados diariamente." :
        "Baixa consistência. Crie o hábito de registrar diariamente.",
    },
  ];

  for (const mod of moduleDetails) {
    ensureSpace(28);

    // Module header
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos - 3, contentWidth, 24, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const scoreVal = mod.score !== null && mod.score !== undefined ? Math.round(mod.score) : "—";
    doc.text(`${mod.name}: ${scoreVal}/100`, margin + 3, yPos + 3);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(mod.desc, contentWidth - 10);
    doc.text(descLines, margin + 3, yPos + 9);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(255, 69, 0);
    const insight = mod.insight(mod.score ?? null);
    doc.text(insight, margin + 3, yPos + 17);

    yPos += 28;
  }

  // How to read
  ensureSpace(30);
  yPos += 4;
  addSectionBar("Como Ler Seu Score");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const guideLines = [
    "85–100 Elite: Todos os pilares em alto nível. Você está otimizado.",
    "70–84 Alta Performance: Maioria dos pilares acima da média. Ajuste fino nos pontos fracos.",
    "50–69 Moderado: Há pilares que precisam de atenção. Foque nos sub-scores mais baixos.",
    "0–49 Risco: Ação urgente necessária. Priorize recuperação e consistência.",
  ];
  for (const line of guideLines) {
    ensureSpace(6);
    doc.text(`• ${line}`, margin, yPos);
    yPos += 6;
  }

  addFooter(3);

  // Save
  const fileName = `SIS_Report_${data.userName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
