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

export async function generateEvolutionPdf(data: EvolutionPdfData): Promise<void> {
  const { clientName, initialWeight, checkins, signedPhotos, initialPhotos } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Helper functions
  const addHeader = () => {
    doc.setFillColor(255, 69, 0);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MÉTODO RENASCER", margin, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório de Evolução - Gabriel Baú", margin, 25);
    yPos = 42;
  };

  const checkNewPage = (height: number = 15) => {
    if (yPos + height > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  const addSectionTitle = (title: string) => {
    checkNewPage(12);
    doc.setFillColor(255, 69, 0);
    doc.rect(margin, yPos - 4, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 3, yPos + 1);
    yPos += 12;
  };

  const addField = (label: string, value: string | number | boolean | null | undefined) => {
    checkNewPage(10);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label + ":", margin, yPos);
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    let displayValue = "-";
    if (value === true) displayValue = "Sim";
    else if (value === false) displayValue = "Não";
    else if (value !== null && value !== undefined && value !== "") displayValue = String(value);
    
    const lines = doc.splitTextToSize(displayValue, contentWidth - 50);
    doc.text(lines, margin + 50, yPos);
    yPos += Math.max(lines.length * 4, 6) + 2;
  };

  const addTextBlock = (label: string, value: string | null | undefined, indent: number = 0) => {
    if (!value) return;
    checkNewPage(15);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + indent, yPos);
    yPos += 4;
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, contentWidth - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 4 + 4;
  };

  const addSubTitle = (title: string) => {
    checkNewPage(12);
    doc.setTextColor(255, 69, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("▸ " + title, margin, yPos);
    yPos += 6;
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

  // Sort checkins by date
  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Build the PDF
  addHeader();

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Relatório de Evolução - ${clientName}`, margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    margin,
    yPos
  );
  yPos += 10;

  // Summary stats
  addSectionTitle("Resumo da Evolução");
  addField("Total de Check-ins", checkins.length);
  if (initialWeight) {
    addField("Peso Inicial", `${initialWeight} kg`);
  }
  
  const lastCheckin = sortedCheckins[sortedCheckins.length - 1];
  if (lastCheckin?.peso_atual) {
    addField("Peso Atual", `${lastCheckin.peso_atual} kg`);
    if (initialWeight) {
      const diff = lastCheckin.peso_atual - initialWeight;
      const sign = diff > 0 ? "+" : "";
      addField("Variação Total", `${sign}${diff.toFixed(1)} kg`);
    }
  }
  
  if (sortedCheckins.length > 0) {
    addField(
      "Período",
      `${format(new Date(sortedCheckins[0].created_at), "dd/MM/yyyy", { locale: ptBR })} até ${format(new Date(sortedCheckins[sortedCheckins.length - 1].created_at), "dd/MM/yyyy", { locale: ptBR })}`
    );
  }
  yPos += 5;

  // Weight progression chart
  const weightData = sortedCheckins
    .filter(c => c.peso_atual !== null)
    .map(c => ({ date: c.created_at, weight: c.peso_atual as number }));

  if (weightData.length >= 2) {
    addSectionTitle("Gráfico de Progressão de Peso");
    
    const chartWidth = contentWidth - 20;
    const chartHeight = 60;
    const chartX = margin + 10;
    const chartY = yPos;
    
    checkNewPage(chartHeight + 30);
    
    // Draw chart background
    doc.setFillColor(248, 248, 248);
    doc.rect(chartX, chartY, chartWidth, chartHeight, "F");
    
    // Draw grid lines
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const lineY = chartY + (chartHeight / 4) * i;
      doc.line(chartX, lineY, chartX + chartWidth, lineY);
    }
    
    // Calculate min/max weights for scale
    const weights = weightData.map(d => d.weight);
    const minWeight = Math.floor(Math.min(...weights) - 2);
    const maxWeight = Math.ceil(Math.max(...weights) + 2);
    const weightRange = maxWeight - minWeight;
    
    // Draw y-axis labels
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    for (let i = 0; i <= 4; i++) {
      const value = maxWeight - (weightRange / 4) * i;
      const labelY = chartY + (chartHeight / 4) * i + 2;
      doc.text(`${value.toFixed(0)}kg`, margin, labelY);
    }
    
    // Draw line chart
    doc.setDrawColor(255, 69, 0);
    doc.setLineWidth(1.5);
    
    const points = weightData.map((d, i) => {
      const x = chartX + (i / (weightData.length - 1)) * chartWidth;
      const y = chartY + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight;
      return { x, y, date: d.date, weight: d.weight };
    });
    
    // Draw the line
    for (let i = 1; i < points.length; i++) {
      doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
    
    // Draw points and labels
    doc.setFillColor(255, 69, 0);
    points.forEach((p, i) => {
      doc.circle(p.x, p.y, 2, "F");
      
      // Add date labels on x-axis
      if (i === 0 || i === points.length - 1 || points.length <= 5) {
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        const dateLabel = format(new Date(p.date), "dd/MM", { locale: ptBR });
        doc.text(dateLabel, p.x - 6, chartY + chartHeight + 8);
      }
    });
    
    yPos = chartY + chartHeight + 20;
  }

  // Visual comparison page: Initial vs Current photos
  const lastCheckinPhotos = sortedCheckins.length > 0 ? signedPhotos[sortedCheckins[sortedCheckins.length - 1].id] : null;
  const hasInitialPhotos = initialPhotos?.frente || initialPhotos?.lado || initialPhotos?.costas;
  const hasCurrentPhotos = lastCheckinPhotos?.frente || lastCheckinPhotos?.lado || lastCheckinPhotos?.costas;
  
  if (hasInitialPhotos && hasCurrentPhotos) {
    doc.addPage();
    yPos = 20;
    
    addSectionTitle("Comparação Visual: Início vs Atual");
    
    const photoWidth = 45;
    const aspectRatio = 3 / 4;
    const photoHeight = photoWidth / aspectRatio;
    const columnGap = 15;
    const labelHeight = 8;
    
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
    
    // Helper to draw comparison row
    const drawComparisonRow = (
      label: string, 
      initialImg: string | null, 
      currentImg: string | null,
      startY: number
    ) => {
      if (!initialImg && !currentImg) return startY;
      
      const centerX = pageWidth / 2;
      const leftX = centerX - columnGap / 2 - photoWidth;
      const rightX = centerX + columnGap / 2;
      
      // Row label
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(label, margin, startY);
      startY += 5;
      
      // Column headers
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("INÍCIO", leftX + photoWidth / 2 - 8, startY);
      doc.text("ATUAL", rightX + photoWidth / 2 - 8, startY);
      startY += labelHeight;
      
      // Draw photos
      if (initialImg) {
        doc.addImage(initialImg, "JPEG", leftX, startY, photoWidth, photoHeight);
      } else {
        doc.setFillColor(240, 240, 240);
        doc.rect(leftX, startY, photoWidth, photoHeight, "F");
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Não disponível", leftX + 8, startY + photoHeight / 2);
      }
      
      if (currentImg) {
        doc.addImage(currentImg, "JPEG", rightX, startY, photoWidth, photoHeight);
      } else {
        doc.setFillColor(240, 240, 240);
        doc.rect(rightX, startY, photoWidth, photoHeight, "F");
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Não disponível", rightX + 8, startY + photoHeight / 2);
      }
      
      // Arrow between photos
      const arrowY = startY + photoHeight / 2;
      doc.setDrawColor(255, 69, 0);
      doc.setLineWidth(1);
      doc.line(leftX + photoWidth + 3, arrowY, rightX - 3, arrowY);
      // Arrow head
      doc.line(rightX - 8, arrowY - 3, rightX - 3, arrowY);
      doc.line(rightX - 8, arrowY + 3, rightX - 3, arrowY);
      
      return startY + photoHeight + 10;
    };
    
    // Draw comparisons for each angle
    if (initialFrenteBase64 || currentFrenteBase64) {
      yPos = drawComparisonRow("Vista Frontal", initialFrenteBase64, currentFrenteBase64, yPos);
    }
    
    checkNewPage(photoHeight + 20);
    
    if (initialLadoBase64 || currentLadoBase64) {
      yPos = drawComparisonRow("Vista Lateral", initialLadoBase64, currentLadoBase64, yPos);
    }
    
    checkNewPage(photoHeight + 20);
    
    if (initialCostasBase64 || currentCostasBase64) {
      yPos = drawComparisonRow("Vista Posterior", initialCostasBase64, currentCostasBase64, yPos);
    }
    
    // Add date labels at bottom
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const lastCheckinDate = sortedCheckins[sortedCheckins.length - 1]?.created_at;
    if (lastCheckinDate) {
      doc.text(
        `Comparação: Anamnese inicial → Check-in de ${format(new Date(lastCheckinDate), "dd/MM/yyyy", { locale: ptBR })}`,
        margin,
        yPos
      );
    }
  }

  // Individual check-ins with analysis
  for (let i = 0; i < sortedCheckins.length; i++) {
    const checkin = sortedCheckins[i];
    const analysis = parseAnalysis(checkin.ai_analysis);
    const photos = signedPhotos[checkin.id];
    
    doc.addPage();
    yPos = 20;
    
    addSectionTitle(
      `Check-in ${i + 1} - ${format(new Date(checkin.created_at), "dd/MM/yyyy", { locale: ptBR })}`
    );
    
    addField("Semana", checkin.semana_numero || "-");
    addField("Peso", checkin.peso_atual ? `${checkin.peso_atual} kg` : "-");
    
    // Weight change from previous
    if (i > 0 && checkin.peso_atual && sortedCheckins[i - 1].peso_atual) {
      const diff = checkin.peso_atual - sortedCheckins[i - 1].peso_atual!;
      const sign = diff > 0 ? "+" : "";
      addField("Variação desde último check-in", `${sign}${diff.toFixed(1)} kg`);
    }
    
    if (checkin.notas) {
      addTextBlock("Observações do Cliente:", checkin.notas);
    }
    yPos += 5;

    // Photos
    const hasPhotos = photos?.frente || photos?.lado || photos?.costas || photos?.single;
    if (hasPhotos) {
      addSubTitle("Fotos do Check-in");
      
      const photoWidth = 50;
      const aspectRatio = 3 / 4;
      const photoHeight = photoWidth / aspectRatio;
      
      checkNewPage(photoHeight + 15);
      
      const [frenteBase64, ladoBase64, costasBase64, singleBase64] = await Promise.all([
        photos?.frente ? loadImage(photos.frente) : Promise.resolve(null),
        photos?.lado ? loadImage(photos.lado) : Promise.resolve(null),
        photos?.costas ? loadImage(photos.costas) : Promise.resolve(null),
        photos?.single ? loadImage(photos.single) : Promise.resolve(null),
      ]);
      
      let xPos = margin;
      
      if (singleBase64) {
        doc.addImage(singleBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
        yPos += photoHeight + 10;
      } else {
        if (frenteBase64) {
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text("Frente", xPos + 18, yPos - 2);
          doc.addImage(frenteBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
          xPos += photoWidth + 8;
        }
        if (ladoBase64) {
          doc.setFontSize(7);
          doc.text("Lado", xPos + 20, yPos - 2);
          doc.addImage(ladoBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
          xPos += photoWidth + 8;
        }
        if (costasBase64) {
          doc.setFontSize(7);
          doc.text("Costas", xPos + 18, yPos - 2);
          doc.addImage(costasBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
        }
        yPos += photoHeight + 10;
      }
    }

    // AI Analysis
    if (analysis.data) {
      addSubTitle("Análise Comparativa por IA");
      
      if (analysis.structured) {
        const a = analysis.data;
        
        if (a.resumoGeral) {
          addTextBlock("Resumo Geral:", a.resumoGeral);
        }
        
        if (a.analisePeso) {
          checkNewPage(20);
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Análise de Peso:", margin, yPos);
          yPos += 4;
          addField("Peso Inicial", a.analisePeso.pesoInicial ? `${a.analisePeso.pesoInicial} kg` : "-");
          addField("Peso Atual", a.analisePeso.pesoAtual ? `${a.analisePeso.pesoAtual} kg` : "-");
          addField("Variação", a.analisePeso.variacao || "-");
          if (a.analisePeso.interpretacao) {
            addTextBlock("Interpretação:", a.analisePeso.interpretacao, 5);
          }
        }
        
        if (a.mudancasObservadas) {
          const m = a.mudancasObservadas;
          checkNewPage(25);
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Mudanças Observadas:", margin, yPos);
          yPos += 5;
          
          if (m.composicaoCorporal) addTextBlock("Composição Corporal:", m.composicaoCorporal, 5);
          if (m.postura) addTextBlock("Postura:", m.postura, 5);
          if (m.definicaoMuscular) addTextBlock("Definição Muscular:", m.definicaoMuscular, 5);
          if (m.areasDestaque && m.areasDestaque.length > 0) {
            addTextBlock("Áreas de Destaque:", m.areasDestaque.join(", "), 5);
          }
        }
        
        if (a.ajustesTreino) {
          const t = a.ajustesTreino;
          checkNewPage(25);
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Ajustes Recomendados - Treino:", margin, yPos);
          yPos += 5;
          
          if (t.intensificar && t.intensificar.length > 0) {
            addTextBlock("Intensificar:", t.intensificar.join(", "), 5);
          }
          if (t.adicionar && t.adicionar.length > 0) {
            addTextBlock("Adicionar:", t.adicionar.join(", "), 5);
          }
          if (t.manutencao && t.manutencao.length > 0) {
            addTextBlock("Manutenção:", t.manutencao.join(", "), 5);
          }
          if (t.observacoes) addTextBlock("Observações:", t.observacoes, 5);
        }
        
        if (a.ajustesDieta) {
          const d = a.ajustesDieta;
          checkNewPage(25);
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Ajustes Recomendados - Dieta:", margin, yPos);
          yPos += 5;
          
          if (d.calorias) addField("Calorias", d.calorias);
          if (d.proteina) addField("Proteína", d.proteina);
          if (d.carboidratos) addField("Carboidratos", d.carboidratos);
          if (d.sugestoes && d.sugestoes.length > 0) {
            addTextBlock("Sugestões:", d.sugestoes.join("; "), 5);
          }
          if (d.observacoes) addTextBlock("Observações:", d.observacoes, 5);
        }
        
        if (a.metasProximos30Dias && a.metasProximos30Dias.length > 0) {
          checkNewPage(15);
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Metas para os Próximos 30 Dias:", margin, yPos);
          yPos += 5;
          
          a.metasProximos30Dias.forEach((meta: string, idx: number) => {
            addTextBlock(`${idx + 1}.`, meta, 5);
          });
        }
        
        if (a.mensagemMotivacional) {
          checkNewPage(15);
          doc.setFillColor(255, 245, 230);
          const msgLines = doc.splitTextToSize(a.mensagemMotivacional, contentWidth - 10);
          const boxHeight = msgLines.length * 4 + 10;
          doc.rect(margin, yPos, contentWidth, boxHeight, "F");
          doc.setTextColor(255, 69, 0);
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.text(msgLines, margin + 5, yPos + 7);
          yPos += boxHeight + 5;
        }
      } else {
        // Non-structured analysis
        addTextBlock("Análise:", String(analysis.data));
      }
    }
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `evolucao_${clientName.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
