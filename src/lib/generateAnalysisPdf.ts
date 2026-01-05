import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PhotoComparison {
  initialFronte?: string | null;
  initialLado?: string | null;
  initialCostas?: string | null;
  currentFrente?: string | null;
  currentLado?: string | null;
  currentCostas?: string | null;
}

interface EvolutionAnalysis {
  resumoGeral: string;
  mudancasObservadas?: {
    composicaoCorporal?: {
      gorduraCorporal: string;
      descricaoGordura: string;
      massaMuscular: string;
      descricaoMuscular: string;
      definicaoGeral: string;
    };
    frente?: {
      mudancasPositivas: string[];
      areasAtencao: string[];
      observacoes: string;
    };
    lado?: {
      mudancasPositivas: string[];
      areasAtencao: string[];
      observacoes: string;
    };
    costas?: {
      mudancasPositivas: string[];
      areasAtencao: string[];
      observacoes: string;
    };
  };
  analisePeso?: {
    variacao: string;
    interpretacao: string;
    tendencia: string;
  };
  ajustesTreino?: {
    manutencao: string[];
    intensificar: string[];
    adicionar: string[];
    observacoes: string;
  };
  ajustesDieta?: {
    calorias: string;
    proteina: string;
    carboidratos: string;
    sugestoes: string[];
    observacoes: string;
  };
  metasProximos30Dias?: string[];
  pontuacaoEvolucao?: {
    nota: number;
    justificativa: string;
  };
  mensagemMotivacional?: string;
}

interface GenerateAnalysisPdfParams {
  clientName: string;
  analysis: EvolutionAnalysis;
  photos?: PhotoComparison;
  checkinDate?: Date;
}

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

export async function generateAnalysisPdf(params: GenerateAnalysisPdfParams): Promise<void> {
  const { clientName, analysis, photos, checkinDate } = params;
  
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
    doc.text("Análise de Evolução - Gabriel Baú", margin, 25);
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

  const addField = (label: string, value: string | number | null | undefined) => {
    checkNewPage(10);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label + ":", margin, yPos);
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    const displayValue = value !== null && value !== undefined ? String(value) : "-";
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

  const addListItems = (items: string[], prefix: string = "•") => {
    items.forEach(item => {
      checkNewPage(8);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(`${prefix} ${item}`, contentWidth - 5);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4 + 2;
    });
  };

  // Build PDF
  addHeader();

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Análise de Evolução - ${clientName}`, margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const dateText = checkinDate 
    ? format(checkinDate, "dd/MM/yyyy", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  doc.text(`Check-in de ${dateText}`, margin, yPos);
  yPos += 10;

  // Score
  if (analysis.pontuacaoEvolucao) {
    addSectionTitle("Pontuação da Evolução");
    addField("Nota", `${analysis.pontuacaoEvolucao.nota}/10`);
    if (analysis.pontuacaoEvolucao.justificativa) {
      addTextBlock("Justificativa:", analysis.pontuacaoEvolucao.justificativa);
    }
    yPos += 3;
  }

  // Summary
  addSectionTitle("Resumo Geral");
  addTextBlock("", analysis.resumoGeral);

  // Photo comparison if available
  if (photos) {
    const hasInitial = photos.initialFronte || photos.initialLado || photos.initialCostas;
    const hasCurrent = photos.currentFrente || photos.currentLado || photos.currentCostas;
    
    if (hasInitial && hasCurrent) {
      doc.addPage();
      yPos = 20;
      addSectionTitle("Comparação Visual: Antes vs Depois");

      const photoWidth = 45;
      const aspectRatio = 3 / 4;
      const photoHeight = photoWidth / aspectRatio;
      const columnGap = 15;
      const labelHeight = 8;

      const [
        initialFrenteBase64,
        initialLadoBase64,
        initialCostasBase64,
        currentFrenteBase64,
        currentLadoBase64,
        currentCostasBase64,
      ] = await Promise.all([
        photos.initialFronte ? loadImage(photos.initialFronte) : Promise.resolve(null),
        photos.initialLado ? loadImage(photos.initialLado) : Promise.resolve(null),
        photos.initialCostas ? loadImage(photos.initialCostas) : Promise.resolve(null),
        photos.currentFrente ? loadImage(photos.currentFrente) : Promise.resolve(null),
        photos.currentLado ? loadImage(photos.currentLado) : Promise.resolve(null),
        photos.currentCostas ? loadImage(photos.currentCostas) : Promise.resolve(null),
      ]);

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
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(label, margin, startY);
        startY += 5;
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("ANTES", leftX + photoWidth / 2 - 8, startY);
        doc.text("DEPOIS", rightX + photoWidth / 2 - 10, startY);
        startY += labelHeight;
        
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
        
        // Arrow
        const arrowY = startY + photoHeight / 2;
        doc.setDrawColor(255, 69, 0);
        doc.setLineWidth(1);
        doc.line(leftX + photoWidth + 3, arrowY, rightX - 3, arrowY);
        doc.line(rightX - 8, arrowY - 3, rightX - 3, arrowY);
        doc.line(rightX - 8, arrowY + 3, rightX - 3, arrowY);
        
        return startY + photoHeight + 10;
      };

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
    }
  }

  // Weight analysis
  if (analysis.analisePeso) {
    doc.addPage();
    yPos = 20;
    addSectionTitle("Análise de Peso");
    addField("Variação", analysis.analisePeso.variacao);
    addField("Tendência", analysis.analisePeso.tendencia);
    if (analysis.analisePeso.interpretacao) {
      addTextBlock("Interpretação:", analysis.analisePeso.interpretacao);
    }
  }

  // Body composition
  if (analysis.mudancasObservadas?.composicaoCorporal) {
    checkNewPage(50);
    addSectionTitle("Composição Corporal");
    const comp = analysis.mudancasObservadas.composicaoCorporal;
    addField("Gordura Corporal", comp.gorduraCorporal);
    addTextBlock("Descrição:", comp.descricaoGordura);
    addField("Massa Muscular", comp.massaMuscular);
    addTextBlock("Descrição:", comp.descricaoMuscular);
    addField("Definição Geral", comp.definicaoGeral);
  }

  // Changes by angle
  const angles = ["frente", "lado", "costas"] as const;
  for (const angle of angles) {
    const data = analysis.mudancasObservadas?.[angle];
    if (data && typeof data === 'object' && 'mudancasPositivas' in data) {
      checkNewPage(40);
      addSubTitle(`Vista ${angle.charAt(0).toUpperCase() + angle.slice(1)}`);
      
      if (data.mudancasPositivas?.length > 0) {
        doc.setTextColor(34, 139, 34);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Melhorias:", margin, yPos);
        yPos += 4;
        addListItems(data.mudancasPositivas, "✓");
      }
      
      if (data.areasAtencao?.length > 0) {
        doc.setTextColor(255, 140, 0);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Áreas de Atenção:", margin, yPos);
        yPos += 4;
        addListItems(data.areasAtencao, "!");
      }
      
      if (data.observacoes) {
        addTextBlock("Observações:", data.observacoes);
      }
    }
  }

  // Training adjustments
  if (analysis.ajustesTreino) {
    doc.addPage();
    yPos = 20;
    addSectionTitle("Ajustes no Treino");
    
    if (analysis.ajustesTreino.intensificar?.length > 0) {
      addSubTitle("Intensificar");
      addListItems(analysis.ajustesTreino.intensificar, "↑");
    }
    
    if (analysis.ajustesTreino.adicionar?.length > 0) {
      addSubTitle("Adicionar");
      addListItems(analysis.ajustesTreino.adicionar, "+");
    }
    
    if (analysis.ajustesTreino.manutencao?.length > 0) {
      addSubTitle("Manter Ênfase");
      addListItems(analysis.ajustesTreino.manutencao, "=");
    }
    
    if (analysis.ajustesTreino.observacoes) {
      addTextBlock("Observações:", analysis.ajustesTreino.observacoes);
    }
  }

  // Diet adjustments
  if (analysis.ajustesDieta) {
    checkNewPage(50);
    addSectionTitle("Ajustes na Dieta");
    addField("Calorias", analysis.ajustesDieta.calorias);
    addField("Proteína", analysis.ajustesDieta.proteina);
    addField("Carboidratos", analysis.ajustesDieta.carboidratos);
    
    if (analysis.ajustesDieta.sugestoes?.length > 0) {
      addSubTitle("Sugestões");
      addListItems(analysis.ajustesDieta.sugestoes);
    }
    
    if (analysis.ajustesDieta.observacoes) {
      addTextBlock("Observações:", analysis.ajustesDieta.observacoes);
    }
  }

  // Goals
  if (analysis.metasProximos30Dias && analysis.metasProximos30Dias.length > 0) {
    checkNewPage(40);
    addSectionTitle("Metas para os Próximos 30 Dias");
    analysis.metasProximos30Dias.forEach((meta, i) => {
      checkNewPage(8);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(`${i + 1}. ${meta}`, contentWidth - 5);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 3;
    });
  }

  // Motivational message
  if (analysis.mensagemMotivacional) {
    checkNewPage(30);
    addSectionTitle("Mensagem do Mentor");
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(`"${analysis.mensagemMotivacional}"`, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("— Gabriel Baú, seu mentor", margin, yPos);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    margin,
    pageHeight - 10
  );

  // Save
  const fileName = `analise-evolucao-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
