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

export async function generateEvolutionPdf(data: EvolutionPdfData): Promise<void> {
  const { clientName, initialWeight, checkins, signedPhotos, initialPhotos } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Sort checkins by date
  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const lastCheckin = sortedCheckins[sortedCheckins.length - 1];
  const lastAnalysis = lastCheckin ? parseAnalysis(lastCheckin.ai_analysis) : { structured: false, data: null };
  const lastCheckinPhotos = lastCheckin ? signedPhotos[lastCheckin.id] : null;

  // Helper functions
  const addHeader = () => {
    doc.setFillColor(255, 69, 0);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("MÉTODO RENASCER", margin, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório de Evolução Comparativa", pageWidth - margin - 55, 14);
  };

  const addSectionTitle = (title: string) => {
    doc.setFillColor(255, 69, 0);
    doc.rect(margin, yPos - 3, contentWidth, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 2, yPos + 1);
    yPos += 9;
  };

  const addCompactField = (label: string, value: string, xOffset: number = 0, width: number = contentWidth) => {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + xOffset, yPos);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + xOffset + 35, yPos);
  };

  const addTextParagraph = (text: string, isBold: boolean = false, maxLines: number = 4) => {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    const linesToShow = lines.slice(0, maxLines);
    doc.text(linesToShow, margin, yPos);
    yPos += linesToShow.length * 3.5 + 2;
  };

  const loadImage = async (url: string): Promise<string | null> => {
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
  };

  // ==================== PAGE 1: Summary & Weight ====================
  addHeader();
  yPos = 30;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Evolução de ${clientName}`, margin, yPos);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(format(new Date(), "dd/MM/yyyy", { locale: ptBR }), pageWidth - margin - 20, yPos);
  yPos += 10;

  // Summary stats in columns
  addSectionTitle("Resumo da Evolução");
  
  const leftCol = 0;
  const rightCol = contentWidth / 2;
  
  addCompactField("Total Check-ins:", String(checkins.length), leftCol);
  if (sortedCheckins.length > 0) {
    const period = `${format(new Date(sortedCheckins[0].created_at), "dd/MM/yy")} - ${format(new Date(sortedCheckins[sortedCheckins.length - 1].created_at), "dd/MM/yy")}`;
    addCompactField("Período:", period, rightCol);
  }
  yPos += 5;

  addCompactField("Peso Inicial:", initialWeight ? `${initialWeight} kg` : "-", leftCol);
  addCompactField("Peso Atual:", lastCheckin?.peso_atual ? `${lastCheckin.peso_atual} kg` : "-", rightCol);
  yPos += 5;

  if (initialWeight && lastCheckin?.peso_atual) {
    const diff = lastCheckin.peso_atual - initialWeight;
    const sign = diff > 0 ? "+" : "";
    addCompactField("Variação Total:", `${sign}${diff.toFixed(1)} kg`, leftCol);
  }
  yPos += 8;

  // Weight Chart (compact)
  const weightData = sortedCheckins
    .filter(c => c.peso_atual !== null)
    .map(c => ({ date: c.created_at, weight: c.peso_atual as number }));

  if (weightData.length >= 2) {
    addSectionTitle("Gráfico de Peso");
    
    const chartWidth = contentWidth - 15;
    const chartHeight = 35;
    const chartX = margin + 12;
    const chartY = yPos;
    
    doc.setFillColor(250, 250, 250);
    doc.rect(chartX, chartY, chartWidth, chartHeight, "F");
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 3; i++) {
      const lineY = chartY + (chartHeight / 3) * i;
      doc.line(chartX, lineY, chartX + chartWidth, lineY);
    }
    
    const weights = weightData.map(d => d.weight);
    const minWeight = Math.floor(Math.min(...weights) - 1);
    const maxWeight = Math.ceil(Math.max(...weights) + 1);
    const weightRange = maxWeight - minWeight || 1;
    
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(`${maxWeight}`, margin + 2, chartY + 3);
    doc.text(`${minWeight}`, margin + 2, chartY + chartHeight);
    
    doc.setDrawColor(255, 69, 0);
    doc.setLineWidth(1);
    
    const points = weightData.map((d, i) => {
      const x = chartX + (i / Math.max(weightData.length - 1, 1)) * chartWidth;
      const y = chartY + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight;
      return { x, y };
    });
    
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
    
    doc.setFillColor(255, 69, 0);
    points.forEach(p => doc.circle(p.x, p.y, 1.5, "F"));
    
    yPos = chartY + chartHeight + 8;
  }

  // Client notes
  if (lastCheckin?.notas) {
    addSectionTitle("Observações do Cliente");
    addTextParagraph(truncateText(lastCheckin.notas, 300), false, 3);
  }

  // ==================== PAGE 2: Photo Comparisons with Analysis ====================
  const hasInitialPhotos = initialPhotos?.frente || initialPhotos?.lado || initialPhotos?.costas;
  const hasCurrentPhotos = lastCheckinPhotos?.frente || lastCheckinPhotos?.lado || lastCheckinPhotos?.costas;
  
  if (hasInitialPhotos && hasCurrentPhotos) {
    doc.addPage();
    addHeader();
    yPos = 28;

    addSectionTitle("Comparação Visual com Análise por Posição");

    const photoWidth = 38;
    const photoHeight = 50;
    const gapBetweenPhotos = 8;
    const analysisWidth = contentWidth - (photoWidth * 2) - gapBetweenPhotos - 10;
    
    // Load all photos
    const [
      initialFrenteBase64,
      initialLadoBase64,
      initialCostasBase64,
      currentFrenteBase64,
      currentLadoBase64,
      currentCostasBase64,
    ] = await Promise.all([
      initialPhotos?.frente ? loadImage(initialPhotos.frente) : Promise.resolve(null),
      initialPhotos?.lado ? loadImage(initialPhotos.lado) : Promise.resolve(null),
      initialPhotos?.costas ? loadImage(initialPhotos.costas) : Promise.resolve(null),
      lastCheckinPhotos?.frente ? loadImage(lastCheckinPhotos.frente) : Promise.resolve(null),
      lastCheckinPhotos?.lado ? loadImage(lastCheckinPhotos.lado) : Promise.resolve(null),
      lastCheckinPhotos?.costas ? loadImage(lastCheckinPhotos.costas) : Promise.resolve(null),
    ]);

    // Helper to draw a comparison row with analysis
    const drawComparisonWithAnalysis = (
      label: string,
      initialImg: string | null,
      currentImg: string | null,
      analysisText: string
    ) => {
      const rowHeight = photoHeight + 8;
      
      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 69, 0);
      doc.text(label, margin, yPos);
      yPos += 4;
      
      const leftX = margin;
      const rightX = margin + photoWidth + gapBetweenPhotos;
      const analysisX = rightX + photoWidth + 8;
      
      // Column headers
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("INÍCIO", leftX + 12, yPos);
      doc.text("ATUAL", rightX + 14, yPos);
      doc.text("ANÁLISE", analysisX, yPos);
      yPos += 3;

      const photoY = yPos;
      
      // Initial photo
      if (initialImg) {
        doc.addImage(initialImg, "JPEG", leftX, photoY, photoWidth, photoHeight);
      } else {
        doc.setFillColor(245, 245, 245);
        doc.rect(leftX, photoY, photoWidth, photoHeight, "F");
      }
      
      // Arrow
      doc.setDrawColor(255, 69, 0);
      doc.setLineWidth(0.5);
      const arrowY = photoY + photoHeight / 2;
      doc.line(leftX + photoWidth + 1, arrowY, rightX - 1, arrowY);
      doc.line(rightX - 4, arrowY - 2, rightX - 1, arrowY);
      doc.line(rightX - 4, arrowY + 2, rightX - 1, arrowY);
      
      // Current photo
      if (currentImg) {
        doc.addImage(currentImg, "JPEG", rightX, photoY, photoWidth, photoHeight);
      } else {
        doc.setFillColor(245, 245, 245);
        doc.rect(rightX, photoY, photoWidth, photoHeight, "F");
      }
      
      // Analysis text
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const analysisLines = doc.splitTextToSize(truncateText(analysisText, 350), analysisWidth);
      doc.text(analysisLines.slice(0, 10), analysisX, photoY + 3);
      
      yPos = photoY + photoHeight + 6;
    };

    // Extract analysis per position from structured data
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
      if (a.analiseFronte || a.analiseFrontal) {
        frenteAnalysis = a.analiseFronte || a.analiseFrontal;
      }
      if (a.analiseLateral) {
        ladoAnalysis = a.analiseLateral;
      }
      if (a.analisePosterior || a.analiseCostas) {
        costasAnalysis = a.analisePosterior || a.analiseCostas;
      }
    } else if (lastAnalysis.data && typeof lastAnalysis.data === 'string') {
      const analysisText = lastAnalysis.data;
      frenteAnalysis = truncateText(analysisText, 200);
      ladoAnalysis = frenteAnalysis;
      costasAnalysis = frenteAnalysis;
    }

    // Draw all three comparisons
    if (initialFrenteBase64 || currentFrenteBase64) {
      drawComparisonWithAnalysis("▸ VISTA FRONTAL", initialFrenteBase64, currentFrenteBase64, frenteAnalysis);
    }
    
    if (initialLadoBase64 || currentLadoBase64) {
      drawComparisonWithAnalysis("▸ VISTA LATERAL", initialLadoBase64, currentLadoBase64, ladoAnalysis);
    }
    
    if (initialCostasBase64 || currentCostasBase64) {
      drawComparisonWithAnalysis("▸ VISTA POSTERIOR", initialCostasBase64, currentCostasBase64, costasAnalysis);
    }

    // Date info
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const lastDate = lastCheckin?.created_at ? format(new Date(lastCheckin.created_at), "dd/MM/yyyy", { locale: ptBR }) : "";
    doc.text(`Comparação: Anamnese inicial → Check-in ${lastDate}`, margin, yPos + 2);
  }

  // ==================== PAGE 3: General Summary & Recommendations ====================
  doc.addPage();
  addHeader();
  yPos = 28;

  if (lastAnalysis.structured && lastAnalysis.data) {
    const a = lastAnalysis.data;

    // General Summary
    if (a.resumoGeral) {
      addSectionTitle("Resumo Geral da Evolução");
      addTextParagraph(a.resumoGeral, false, 6);
    }

    // Weight Analysis
    if (a.analisePeso) {
      yPos += 2;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Análise de Peso:", margin, yPos);
      yPos += 4;
      
      if (a.analisePeso.interpretacao) {
        addTextParagraph(a.analisePeso.interpretacao, false, 3);
      }
    }

    // Training Adjustments
    if (a.ajustesTreino) {
      addSectionTitle("Orientações de Treino");
      const t = a.ajustesTreino;
      
      if (t.intensificar?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(40, 40, 40);
        doc.text("Intensificar: ", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(t.intensificar.join(", "), margin + 22, yPos);
        yPos += 4;
      }
      if (t.adicionar?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Adicionar: ", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(t.adicionar.join(", "), margin + 18, yPos);
        yPos += 4;
      }
      if (t.manutencao?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Manutenção: ", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(t.manutencao.join(", "), margin + 22, yPos);
        yPos += 4;
      }
      if (t.observacoes) {
        yPos += 2;
        addTextParagraph(t.observacoes, false, 3);
      }
    }

    // Diet Adjustments
    if (a.ajustesDieta) {
      yPos += 2;
      addSectionTitle("Orientações Nutricionais");
      const d = a.ajustesDieta;
      
      const macros: string[] = [];
      if (d.calorias) macros.push(`Calorias: ${d.calorias}`);
      if (d.proteina) macros.push(`Proteína: ${d.proteina}`);
      if (d.carboidratos) macros.push(`Carboidratos: ${d.carboidratos}`);
      
      if (macros.length > 0) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(macros.join(" | "), margin, yPos);
        yPos += 5;
      }
      
      if (d.sugestoes?.length > 0) {
        doc.setFont("helvetica", "normal");
        addTextParagraph(d.sugestoes.join("; "), false, 3);
      }
      if (d.observacoes) {
        addTextParagraph(d.observacoes, false, 2);
      }
    }

    // Goals for next 30 days
    if (a.metasProximos30Dias?.length > 0) {
      yPos += 2;
      addSectionTitle("Metas para os Próximos 30 Dias");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      
      a.metasProximos30Dias.slice(0, 5).forEach((meta: string, idx: number) => {
        const metaText = `${idx + 1}. ${truncateText(meta, 100)}`;
        doc.text(metaText, margin, yPos);
        yPos += 4;
      });
    }

    // Motivational message
    if (a.mensagemMotivacional) {
      yPos += 4;
      doc.setFillColor(255, 245, 235);
      const msgLines = doc.splitTextToSize(a.mensagemMotivacional, contentWidth - 8);
      const boxHeight = Math.min(msgLines.length * 3.5 + 8, 25);
      doc.rect(margin, yPos, contentWidth, boxHeight, "F");
      doc.setTextColor(255, 69, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(msgLines.slice(0, 4), margin + 4, yPos + 5);
      yPos += boxHeight + 4;
    }
  } else if (lastAnalysis.data) {
    // Non-structured analysis fallback
    addSectionTitle("Análise Geral");
    addTextParagraph(String(lastAnalysis.data), false, 15);
  } else {
    addSectionTitle("Análise");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Nenhuma análise disponível para este período.", margin, yPos);
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `evolucao_${clientName.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
