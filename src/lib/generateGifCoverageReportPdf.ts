import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string;
  status: "active" | "pending" | "missing";
}

interface MuscleGroupStats {
  group: string;
  total: number;
  active: number;
  pending: number;
  missing: number;
  coverage: number;
}

interface Stats {
  active: number;
  pending: number;
  missing: number;
  total: number;
}

export async function generateGifCoverageReportPdf(
  gifs: ExerciseGif[],
  stats: Stats,
  muscleGroups: string[]
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Calculate stats per muscle group
  const groupStats: MuscleGroupStats[] = muscleGroups.map((group) => {
    const groupGifs = gifs.filter((g) => g.muscle_group === group);
    const total = groupGifs.length;
    const active = groupGifs.filter((g) => g.status === "active").length;
    const pending = groupGifs.filter((g) => g.status === "pending").length;
    const missing = groupGifs.filter((g) => g.status === "missing").length;
    const coverage = total > 0 ? Math.round((active / total) * 100) : 0;
    return { group, total, active, pending, missing, coverage };
  }).filter((g) => g.total > 0).sort((a, b) => a.coverage - b.coverage);

  const overallCoverage = stats.total > 0 
    ? Math.round((stats.active / stats.total) * 100) 
    : 0;

  // Header
  doc.setFillColor(255, 107, 53); // Primary orange
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Cobertura de GIFs", margin, 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    margin,
    35
  );

  y = 60;

  // Summary Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", margin, y);
  y += 12;

  // Summary boxes
  const boxWidth = (contentWidth - 15) / 4;
  const boxHeight = 28;

  // Box 1 - Total
  doc.setFillColor(59, 130, 246); // Blue
  doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(String(stats.total), margin + boxWidth / 2, y + 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Total Exercícios", margin + boxWidth / 2, y + 20, { align: "center" });

  // Box 2 - Active
  doc.setFillColor(34, 197, 94); // Green
  doc.roundedRect(margin + boxWidth + 5, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(String(stats.active), margin + boxWidth + 5 + boxWidth / 2, y + 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Com GIF", margin + boxWidth + 5 + boxWidth / 2, y + 20, { align: "center" });

  // Box 3 - Pending
  doc.setFillColor(245, 158, 11); // Yellow
  doc.roundedRect(margin + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(String(stats.pending), margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Pendentes", margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 20, { align: "center" });

  // Box 4 - Coverage
  let coverageColor: [number, number, number] = [239, 68, 68]; // Red
  if (overallCoverage >= 80) {
    coverageColor = [34, 197, 94]; // Green
  } else if (overallCoverage >= 50) {
    coverageColor = [245, 158, 11]; // Yellow
  } else if (overallCoverage >= 25) {
    coverageColor = [249, 115, 22]; // Orange
  }
  doc.setFillColor(...coverageColor);
  doc.roundedRect(margin + (boxWidth + 5) * 3, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${overallCoverage}%`, margin + (boxWidth + 5) * 3 + boxWidth / 2, y + 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Cobertura Total", margin + (boxWidth + 5) * 3 + boxWidth / 2, y + 20, { align: "center" });

  y += boxHeight + 20;

  // Priority Analysis Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Análise de Prioridade", margin, y);
  y += 10;

  // Find groups that need attention
  const criticalGroups = groupStats.filter((g) => g.coverage < 25 && g.total > 0);
  const warningGroups = groupStats.filter((g) => g.coverage >= 25 && g.coverage < 50);
  const goodGroups = groupStats.filter((g) => g.coverage >= 50 && g.coverage < 80);
  const excellentGroups = groupStats.filter((g) => g.coverage >= 80);

  // Priority Cards
  if (criticalGroups.length > 0) {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "FD");
    
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(margin + 5, y + 4, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("CRÍTICO", margin + 20, y + 8.5, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${criticalGroups.length} grupo(s) com cobertura abaixo de 25%`, margin + 40, y + 9);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const criticalNames = criticalGroups.map((g) => `${g.group} (${g.coverage}%)`).join(", ");
    const criticalLines = doc.splitTextToSize(criticalNames, contentWidth - 15);
    doc.text(criticalLines, margin + 5, y + 18);

    y += 32;
  }

  if (warningGroups.length > 0 && y < 240) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "FD");
    
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(margin + 5, y + 4, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("ATENÇÃO", margin + 20, y + 8.5, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${warningGroups.length} grupo(s) com cobertura entre 25% e 50%`, margin + 40, y + 9);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const warningNames = warningGroups.map((g) => `${g.group} (${g.coverage}%)`).join(", ");
    const warningLines = doc.splitTextToSize(warningNames, contentWidth - 15);
    doc.text(warningLines, margin + 5, y + 18);

    y += 32;
  }

  if (excellentGroups.length > 0 && y < 240) {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "FD");
    
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(margin + 5, y + 4, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("ÓTIMO", margin + 20, y + 8.5, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${excellentGroups.length} grupo(s) com cobertura acima de 80%`, margin + 40, y + 9);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const excellentNames = excellentGroups.map((g) => `${g.group} (${g.coverage}%)`).join(", ");
    const excellentLines = doc.splitTextToSize(excellentNames, contentWidth - 15);
    doc.text(excellentLines, margin + 5, y + 18);

    y += 32;
  }

  // Muscle Groups Detail Section
  doc.addPage();
  y = 20;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Grupo Muscular", margin, y);
  y += 12;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, contentWidth, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Grupo Muscular", margin + 3, y + 7);
  doc.text("Total", margin + 70, y + 7);
  doc.text("Ativos", margin + 90, y + 7);
  doc.text("Pendentes", margin + 112, y + 7);
  doc.text("Faltando", margin + 140, y + 7);
  doc.text("Cobertura", margin + 165, y + 7);
  y += 12;

  groupStats.forEach((stat, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      
      // Repeat header on new page
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y, contentWidth, 10, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text("Grupo Muscular", margin + 3, y + 7);
      doc.text("Total", margin + 70, y + 7);
      doc.text("Ativos", margin + 90, y + 7);
      doc.text("Pendentes", margin + 112, y + 7);
      doc.text("Faltando", margin + 140, y + 7);
      doc.text("Cobertura", margin + 165, y + 7);
      y += 12;
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 2, contentWidth, 10, "F");
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(stat.group, margin + 3, y + 5);
    doc.text(String(stat.total), margin + 70, y + 5);
    
    doc.setTextColor(34, 197, 94);
    doc.text(String(stat.active), margin + 90, y + 5);
    
    doc.setTextColor(245, 158, 11);
    doc.text(String(stat.pending), margin + 112, y + 5);
    
    doc.setTextColor(239, 68, 68);
    doc.text(String(stat.missing), margin + 140, y + 5);

    // Coverage with color
    let coverageTextColor: [number, number, number] = [239, 68, 68];
    if (stat.coverage >= 80) {
      coverageTextColor = [34, 197, 94];
    } else if (stat.coverage >= 50) {
      coverageTextColor = [245, 158, 11];
    } else if (stat.coverage >= 25) {
      coverageTextColor = [249, 115, 22];
    }

    doc.setTextColor(...coverageTextColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${stat.coverage}%`, margin + 165, y + 5);

    y += 10;
  });

  // Missing Exercises List (if any)
  const missingExercises = gifs.filter((g) => g.status === "missing" || g.status === "pending");
  if (missingExercises.length > 0) {
    y += 15;
    
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Exercícios Pendentes/Faltando", margin, y);
    y += 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.text(`Total de ${missingExercises.length} exercícios precisam de atenção`, margin, y);
    y += 10;

    // Group by muscle group
    const groupedMissing: Record<string, ExerciseGif[]> = {};
    missingExercises.forEach((ex) => {
      if (!groupedMissing[ex.muscle_group]) {
        groupedMissing[ex.muscle_group] = [];
      }
      groupedMissing[ex.muscle_group].push(ex);
    });

    Object.entries(groupedMissing).forEach(([group, exercises]) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${group} (${exercises.length})`, margin, y);
      y += 6;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      
      const exerciseNames = exercises.map((e) => e.exercise_name_pt).slice(0, 10);
      const moreCount = exercises.length - 10;
      let listText = exerciseNames.join(", ");
      if (moreCount > 0) {
        listText += ` e mais ${moreCount}...`;
      }
      
      const lines = doc.splitTextToSize(listText, contentWidth - 5);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 6;
    });
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${totalPages} | Método Renascer - Relatório de Cobertura de GIFs`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `relatorio-cobertura-gifs-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
