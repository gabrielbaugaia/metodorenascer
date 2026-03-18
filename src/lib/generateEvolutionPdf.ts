import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CheckIn {
  id: string;
  created_at: string;
  peso_atual: number | null;
  notas: string | null;
  semana_numero: number | null;
  ai_analysis: string | null;
}

interface SignedPhotos {
  frente?: string | null;
  lado?: string | null;
  costas?: string | null;
  single?: string | null;
}

interface InitialPhotos {
  frente?: string | null;
  lado?: string | null;
  costas?: string | null;
}

interface EvolutionPdfData {
  clientName: string;
  initialWeight: number | null;
  checkins: CheckIn[];
  signedPhotos: Record<string, SignedPhotos>;
  initialPhotos?: InitialPhotos;
}

// ─── Color constants ───
const C = {
  black: [26, 26, 26] as [number, number, number],
  body: [40, 40, 40] as [number, number, number],
  label: [51, 51, 51] as [number, number, number],
  secondary: [136, 136, 136] as [number, number, number],
  orange: [255, 69, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lineSep: [210, 210, 210] as [number, number, number],
  bgLight: [245, 245, 245] as [number, number, number],
  borderLight: [220, 220, 220] as [number, number, number],
  chartGrid: [230, 230, 230] as [number, number, number],
  chartBg: [250, 250, 250] as [number, number, number],
};

// ─── Spacing constants ───
const LINE_H = 4.5;    // body line height
const LIST_H = 5;      // list/meta line height
const SECTION_GAP = 6; // gap after each section

function parseAnalysis(analysisStr: string | null): { structured: boolean; data: any } {
  if (!analysisStr) return { structured: false, data: null };
  try {
    const parsed = JSON.parse(analysisStr);
    if (parsed.resumoGeral || parsed.mudancasObservadas || parsed.ajustesTreino) {
      return { structured: true, data: parsed };
    }
    return { structured: false, data: analysisStr };
  } catch {
    return { structured: false, data: analysisStr };
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateEvolutionPdf(data: EvolutionPdfData): Promise<void> {
  const { clientName, initialWeight, checkins, signedPhotos, initialPhotos } = data;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const lastCheckin = sortedCheckins[sortedCheckins.length - 1];
  const lastAnalysis = lastCheckin ? parseAnalysis(lastCheckin.ai_analysis) : { structured: false, data: null };
  const lastCheckinPhotos = lastCheckin ? signedPhotos[lastCheckin.id] : null;

  // ─── Helpers ───

  const ensureSpace = (minHeight: number) => {
    if (yPos + minHeight > pageHeight - 15) {
      doc.addPage();
      addHeader();
      yPos = 30;
    }
  };

  const addHeader = () => {
    doc.setFillColor(...C.orange);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setTextColor(...C.white);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setCharSpace(0.3);
    doc.text("MÉTODO RENASCER", margin, 14);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setCharSpace(0.1);
    doc.text("Relatório de Evolução", pageWidth - margin, 14, { align: "right" });
    doc.setCharSpace(0);
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(16);
    yPos += 2;
    doc.setTextColor(...C.orange);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setCharSpace(0.3);
    doc.text(title.toUpperCase(), margin, yPos);
    doc.setCharSpace(0);
    yPos += 2;
    // thin grey separator line
    doc.setDrawColor(...C.lineSep);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 5;
  };

  const addCompactField = (label: string, value: string, xOffset: number = 0) => {
    doc.setTextColor(...C.secondary);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setCharSpace(0.1);
    doc.text(label, margin + xOffset, yPos);
    const labelWidth = doc.getTextWidth(label) + 2;
    doc.setTextColor(...C.black);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + xOffset + labelWidth, yPos);
    doc.setCharSpace(0);
  };

  const addTextParagraph = (text: string, isBold: boolean = false, maxLines: number = 4) => {
    ensureSpace(maxLines * LINE_H + 4);
    doc.setTextColor(...C.body);
    doc.setFontSize(8);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setCharSpace(0.15);
    const lines = doc.splitTextToSize(text, contentWidth);
    const linesToShow = lines.slice(0, maxLines);
    doc.text(linesToShow, margin, yPos);
    yPos += linesToShow.length * LINE_H + 2;
    doc.setCharSpace(0);
  };

  // ==================== PAGE 1: Summary & Weight ====================
  addHeader();
  yPos = 32;

  // Title
  doc.setTextColor(...C.black);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setCharSpace(0.2);
  doc.text(`Evolução de ${clientName}`, margin, yPos);
  doc.setCharSpace(0);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.secondary);
  doc.text(format(new Date(), "dd/MM/yyyy", { locale: ptBR }), pageWidth - margin, yPos, { align: "right" });
  yPos += 12;

  // Summary stats
  addSectionTitle("Resumo da Evolução");

  const rightCol = contentWidth / 2;

  addCompactField("Total Check-ins:", String(checkins.length), 0);
  if (sortedCheckins.length > 0) {
    const period = `${format(new Date(sortedCheckins[0].created_at), "dd/MM/yy")} — ${format(new Date(sortedCheckins[sortedCheckins.length - 1].created_at), "dd/MM/yy")}`;
    addCompactField("Período:", period, rightCol);
  }
  yPos += 6;

  addCompactField("Peso Inicial:", initialWeight ? `${initialWeight} kg` : "—", 0);
  addCompactField("Peso Atual:", lastCheckin?.peso_atual ? `${lastCheckin.peso_atual} kg` : "—", rightCol);
  yPos += 6;

  if (initialWeight && lastCheckin?.peso_atual) {
    const diff = lastCheckin.peso_atual - initialWeight;
    const sign = diff > 0 ? "+" : "";
    addCompactField("Variação Total:", `${sign}${diff.toFixed(1)} kg`, 0);
  }
  yPos += SECTION_GAP;

  // Weight Chart
  const weightData = sortedCheckins
    .filter(c => c.peso_atual !== null)
    .map(c => ({ date: c.created_at, weight: c.peso_atual as number }));

  if (weightData.length >= 2) {
    addSectionTitle("Gráfico de Peso");

    const chartWidth = contentWidth - 15;
    const chartHeight = 35;
    const chartX = margin + 12;
    const chartY = yPos;

    doc.setFillColor(...C.chartBg);
    doc.rect(chartX, chartY, chartWidth, chartHeight, "F");

    doc.setDrawColor(...C.chartGrid);
    doc.setLineWidth(0.15);
    for (let i = 0; i <= 3; i++) {
      const lineY = chartY + (chartHeight / 3) * i;
      doc.line(chartX, lineY, chartX + chartWidth, lineY);
    }

    const weights = weightData.map(d => d.weight);
    const minWeight = Math.floor(Math.min(...weights) - 1);
    const maxWeight = Math.ceil(Math.max(...weights) + 1);
    const weightRange = maxWeight - minWeight || 1;

    doc.setFontSize(7);
    doc.setTextColor(...C.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${maxWeight}`, margin + 2, chartY + 3);
    doc.text(`${minWeight}`, margin + 2, chartY + chartHeight);

    doc.setDrawColor(...C.orange);
    doc.setLineWidth(0.8);

    const points = weightData.map((d, i) => {
      const x = chartX + (i / Math.max(weightData.length - 1, 1)) * chartWidth;
      const y = chartY + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight;
      return { x, y };
    });

    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }

    doc.setFillColor(...C.orange);
    points.forEach(p => doc.circle(p.x, p.y, 1.2, "F"));

    yPos = chartY + chartHeight + SECTION_GAP + 2;
  }

  // Client notes
  if (lastCheckin?.notas) {
    addSectionTitle("Observações do Cliente");
    addTextParagraph(truncateText(lastCheckin.notas, 300), false, 3);
    yPos += SECTION_GAP;
  }

  // ==================== PAGE 2: Photo Comparisons ====================
  const hasInitialPhotos = initialPhotos?.frente || initialPhotos?.lado || initialPhotos?.costas;
  const hasCurrentPhotos = lastCheckinPhotos?.frente || lastCheckinPhotos?.lado || lastCheckinPhotos?.costas;

  if (hasInitialPhotos && hasCurrentPhotos) {
    doc.addPage();
    addHeader();
    yPos = 30;

    addSectionTitle("Comparação Visual com Análise por Posição");

    const photoWidth = 38;
    const photoHeight = 50;
    const gapBetweenPhotos = 8;
    const analysisWidth = contentWidth - (photoWidth * 2) - gapBetweenPhotos - 10;

    const [
      initialFrenteBase64, initialLadoBase64, initialCostasBase64,
      currentFrenteBase64, currentLadoBase64, currentCostasBase64,
    ] = await Promise.all([
      initialPhotos?.frente ? loadImage(initialPhotos.frente) : Promise.resolve(null),
      initialPhotos?.lado ? loadImage(initialPhotos.lado) : Promise.resolve(null),
      initialPhotos?.costas ? loadImage(initialPhotos.costas) : Promise.resolve(null),
      lastCheckinPhotos?.frente ? loadImage(lastCheckinPhotos.frente) : Promise.resolve(null),
      lastCheckinPhotos?.lado ? loadImage(lastCheckinPhotos.lado) : Promise.resolve(null),
      lastCheckinPhotos?.costas ? loadImage(lastCheckinPhotos.costas) : Promise.resolve(null),
    ]);

    const drawComparisonWithAnalysis = (
      label: string,
      initialImg: string | null,
      currentImg: string | null,
      analysisText: string
    ) => {
      const rowHeight = photoHeight + 14;
      ensureSpace(rowHeight);

      // Label — bold black, no arrow symbol
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.black);
      doc.text(label, margin, yPos);
      yPos += 5;

      const leftX = margin;
      const rightX = margin + photoWidth + gapBetweenPhotos;
      const analysisX = rightX + photoWidth + 8;

      // Column headers
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.secondary);
      doc.text("INÍCIO", leftX + 12, yPos);
      doc.text("ATUAL", rightX + 14, yPos);
      doc.text("ANÁLISE", analysisX, yPos);
      yPos += 3;

      const photoY = yPos;

      // Initial photo
      if (initialImg) {
        doc.addImage(initialImg, "JPEG", leftX, photoY, photoWidth, photoHeight);
      } else {
        doc.setFillColor(...C.bgLight);
        doc.rect(leftX, photoY, photoWidth, photoHeight, "F");
      }

      // Arrow
      doc.setDrawColor(...C.secondary);
      doc.setLineWidth(0.4);
      const arrowY = photoY + photoHeight / 2;
      doc.line(leftX + photoWidth + 1, arrowY, rightX - 1, arrowY);
      doc.line(rightX - 3, arrowY - 1.5, rightX - 1, arrowY);
      doc.line(rightX - 3, arrowY + 1.5, rightX - 1, arrowY);

      // Current photo
      if (currentImg) {
        doc.addImage(currentImg, "JPEG", rightX, photoY, photoWidth, photoHeight);
      } else {
        doc.setFillColor(...C.bgLight);
        doc.rect(rightX, photoY, photoWidth, photoHeight, "F");
      }

      // Analysis text
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.body);
      doc.setCharSpace(0.1);
      const analysisLines = doc.splitTextToSize(truncateText(analysisText, 350), analysisWidth);
      doc.text(analysisLines.slice(0, 10), analysisX, photoY + 4);
      doc.setCharSpace(0);

      yPos = photoY + photoHeight + SECTION_GAP;
    };

    // Extract analysis per position
    let frenteAnalysis = "Análise não disponível para esta posição.";
    let ladoAnalysis = "Análise não disponível para esta posição.";
    let costasAnalysis = "Análise não disponível para esta posição.";

    if (lastAnalysis.structured && lastAnalysis.data) {
      const a = lastAnalysis.data;
      if (a.mudancasObservadas) {
        const parts: string[] = [];
        if (a.mudancasObservadas.composicaoCorporal) parts.push(a.mudancasObservadas.composicaoCorporal);
        if (a.mudancasObservadas.definicaoMuscular) parts.push(a.mudancasObservadas.definicaoMuscular);
        if (parts.length > 0) {
          frenteAnalysis = parts.join(" ");
          ladoAnalysis = a.mudancasObservadas.postura || parts[0] || frenteAnalysis;
          costasAnalysis = a.mudancasObservadas.areasDestaque?.join(", ") || parts[0] || frenteAnalysis;
        }
      }
      if (a.analiseFronte || a.analiseFrontal) frenteAnalysis = a.analiseFronte || a.analiseFrontal;
      if (a.analiseLateral) ladoAnalysis = a.analiseLateral;
      if (a.analisePosterior || a.analiseCostas) costasAnalysis = a.analisePosterior || a.analiseCostas;
    } else if (lastAnalysis.data && typeof lastAnalysis.data === 'string') {
      const t = truncateText(lastAnalysis.data, 200);
      frenteAnalysis = t;
      ladoAnalysis = t;
      costasAnalysis = t;
    }

    if (initialFrenteBase64 || currentFrenteBase64) {
      drawComparisonWithAnalysis("VISTA FRONTAL", initialFrenteBase64, currentFrenteBase64, frenteAnalysis);
    }
    if (initialLadoBase64 || currentLadoBase64) {
      drawComparisonWithAnalysis("VISTA LATERAL", initialLadoBase64, currentLadoBase64, ladoAnalysis);
    }
    if (initialCostasBase64 || currentCostasBase64) {
      drawComparisonWithAnalysis("VISTA POSTERIOR", initialCostasBase64, currentCostasBase64, costasAnalysis);
    }

    // Date info
    doc.setFontSize(7);
    doc.setTextColor(...C.secondary);
    const lastDate = lastCheckin?.created_at ? format(new Date(lastCheckin.created_at), "dd/MM/yyyy", { locale: ptBR }) : "";
    doc.text(`Comparação: Anamnese inicial → Check-in ${lastDate}`, margin, yPos + 2);
  }

  // ==================== PAGE 3: General Summary & Recommendations ====================
  doc.addPage();
  addHeader();
  yPos = 30;

  if (lastAnalysis.structured && lastAnalysis.data) {
    const a = lastAnalysis.data;

    // General Summary
    if (a.resumoGeral) {
      addSectionTitle("Resumo Geral da Evolução");
      addTextParagraph(a.resumoGeral, false, 6);
      yPos += SECTION_GAP;
    }

    // Weight Analysis
    if (a.analisePeso) {
      ensureSpace(20);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.label);
      doc.text("Análise de Peso:", margin, yPos);
      yPos += LINE_H;

      if (a.analisePeso.interpretacao) {
        addTextParagraph(a.analisePeso.interpretacao, false, 3);
      }
      yPos += SECTION_GAP;
    }

    // Training Adjustments
    if (a.ajustesTreino) {
      addSectionTitle("Orientações de Treino");
      const t = a.ajustesTreino;

      const renderList = (label: string, items: string[]) => {
        if (!items?.length) return;
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.label);
        doc.text(`${label}: `, margin, yPos);
        const labelW = doc.getTextWidth(`${label}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.body);
        doc.setCharSpace(0.1);
        const itemText = doc.splitTextToSize(items.join(", "), contentWidth - labelW);
        doc.text(itemText.slice(0, 2), margin + labelW, yPos);
        yPos += itemText.slice(0, 2).length * LINE_H + 1;
        doc.setCharSpace(0);
      };

      renderList("Intensificar", t.intensificar);
      renderList("Adicionar", t.adicionar);
      renderList("Manutenção", t.manutencao);

      if (t.observacoes) {
        yPos += 2;
        addTextParagraph(t.observacoes, false, 3);
      }
      yPos += SECTION_GAP;
    }

    // Diet Adjustments
    if (a.ajustesDieta) {
      addSectionTitle("Orientações Nutricionais");
      const d = a.ajustesDieta;

      const macros: string[] = [];
      if (d.calorias) macros.push(`Calorias: ${d.calorias}`);
      if (d.proteina) macros.push(`Proteína: ${d.proteina}`);
      if (d.carboidratos) macros.push(`Carboidratos: ${d.carboidratos}`);

      if (macros.length > 0) {
        ensureSpace(8);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.black);
        doc.text(macros.join("  |  "), margin, yPos);
        yPos += LINE_H + 1;
      }

      if (d.sugestoes?.length > 0) {
        doc.setFont("helvetica", "normal");
        addTextParagraph(d.sugestoes.join("; "), false, 3);
      }
      if (d.observacoes) {
        addTextParagraph(d.observacoes, false, 2);
      }
      yPos += SECTION_GAP;
    }

    // Goals for next 30 days
    if (a.metasProximos30Dias?.length > 0) {
      addSectionTitle("Metas para os Próximos 30 Dias");

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.body);
      doc.setCharSpace(0.1);

      a.metasProximos30Dias.slice(0, 5).forEach((meta: string, idx: number) => {
        ensureSpace(6);
        doc.text(`${idx + 1}. ${truncateText(meta, 100)}`, margin, yPos);
        yPos += LIST_H;
      });
      doc.setCharSpace(0);
      yPos += SECTION_GAP;
    }

    // Motivational message — light grey box
    if (a.mensagemMotivacional) {
      const msgLines = doc.splitTextToSize(a.mensagemMotivacional, contentWidth - 10);
      const boxHeight = Math.min(msgLines.length * LINE_H + 8, 28);
      ensureSpace(boxHeight + 8);

      yPos += 2;
      doc.setFillColor(...C.bgLight);
      doc.setDrawColor(...C.borderLight);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPos, contentWidth, boxHeight, "FD");

      doc.setTextColor(...C.body);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setCharSpace(0.1);
      doc.text(msgLines.slice(0, 4), margin + 5, yPos + 6);
      doc.setCharSpace(0);
      yPos += boxHeight + 4;
    }
  } else if (lastAnalysis.data) {
    addSectionTitle("Análise Geral");
    addTextParagraph(String(lastAnalysis.data), false, 15);
  } else {
    addSectionTitle("Análise");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.secondary);
    doc.text("Nenhuma análise disponível para este período.", margin, yPos);
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...C.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // Save
  const fileName = `evolucao_${clientName.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
