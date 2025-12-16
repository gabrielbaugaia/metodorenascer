import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Protocol {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: any;
  data_geracao: string;
}

export function generateProtocolPdf(protocol: Protocol): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
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
    doc.text("Transformação Elite - Gabriel Baú", margin, 25);
    yPos = 42;
  };

  const addTitle = (title: string) => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado em ${format(new Date(protocol.data_geracao), "dd/MM/yyyy", { locale: ptBR })}`,
      margin,
      yPos
    );
    
    // Duração do plano
    if (protocol.conteudo?.duracao_semanas) {
      doc.text(` | Duração: ${protocol.conteudo.duracao_semanas} semanas`, margin + 60, yPos);
    }
    yPos += 10;
  };

  const checkNewPage = (height: number = 15) => {
    if (yPos + height > doc.internal.pageSize.getHeight() - 20) {
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

  const addSubsectionTitle = (title: string) => {
    checkNewPage(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 3, contentWidth, 7, "F");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 3, yPos + 1);
    yPos += 10;
  };

  const addText = (text: string, indent: number = 0) => {
    checkNewPage();
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 4 + 2;
  };

  const addBoldText = (text: string, indent: number = 0) => {
    checkNewPage();
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 4 + 2;
  };

  const addObservation = (text: string) => {
    checkNewPage(15);
    doc.setFillColor(255, 245, 230);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    doc.rect(margin, yPos - 3, contentWidth, lines.length * 4 + 8, "F");
    doc.setDrawColor(255, 69, 0);
    doc.rect(margin, yPos - 3, contentWidth, lines.length * 4 + 8, "S");
    doc.setTextColor(100, 60, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(lines, margin + 5, yPos + 2);
    yPos += lines.length * 4 + 12;
  };

  // Generate PDF based on protocol type
  addHeader();
  addTitle(protocol.titulo);

  // Add adjustment observation if exists
  if (protocol.conteudo?.observacao_ajustes) {
    addObservation(protocol.conteudo.observacao_ajustes);
  }

  if (protocol.tipo === "treino") {
    generateTreinoPdf(doc, protocol.conteudo, { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth, addObservation, yPos: () => yPos, setYPos: (v: number) => yPos = v });
  } else if (protocol.tipo === "nutricao") {
    generateNutricaoPdf(doc, protocol.conteudo, { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth, yPos: () => yPos, setYPos: (v: number) => yPos = v });
  } else if (protocol.tipo === "mindset") {
    generateMindsetPdf(doc, protocol.conteudo, { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth, yPos: () => yPos, setYPos: (v: number) => yPos = v });
  }

  // Footer on all pages
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text(
      `Método Renascer - Gabriel Baú | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  // Save
  const fileName = `protocolo-${protocol.tipo}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

function generateTreinoPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth } = helpers;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Info do plano
  if (conteudo?.nivel || conteudo?.objetivo) {
    addSectionTitle("Informações do Protocolo");
    if (conteudo.nivel) addText(`Nível: ${conteudo.nivel}`);
    if (conteudo.objetivo) addText(`Objetivo: ${conteudo.objetivo}`);
    if (conteudo.frequencia_semanal) addText(`Frequência: ${conteudo.frequencia_semanal}x por semana`);
    if (conteudo.aquecimento) addText(`Aquecimento: ${conteudo.aquecimento}`);
    if (conteudo.alongamento) addText(`Alongamento: ${conteudo.alongamento}`);
  }

  if (conteudo?.observacoes_gerais) {
    addSectionTitle("Observações Gerais");
    addText(conteudo.observacoes_gerais);
  }

  // Handle treinos array format (direct workout list)
  if (conteudo?.treinos && Array.isArray(conteudo.treinos)) {
    addSectionTitle("PLANO DE TREINO SEMANAL");
    
    conteudo.treinos.forEach((treino: any, idx: number) => {
      checkNewPage(30);
      addSubsectionTitle(`${treino.day} - ${treino.focus}${treino.duration ? ` (${treino.duration} min)` : ''}`);

      // Tabela de exercícios
      let tableY = helpers.yPos ? helpers.yPos() : 0;
      const colWidths = [60, 25, 30, 25, 40];
      const headers = ["EXERCÍCIO", "SÉRIES", "REPS", "DESC.", "DICAS"];
      
      // Header da tabela
      doc.setFillColor(50, 50, 50);
      doc.rect(margin, tableY, contentWidth, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      
      let xPos = margin;
      headers.forEach((header, i) => {
        doc.text(header, xPos + 2, tableY + 5);
        xPos += colWidths[i];
      });
      tableY += 7;

      // Linhas de exercícios
      const exercises = treino.exercises || [];
      exercises.forEach((ex: any, exIdx: number) => {
        checkNewPage(10);
        const bgColor = exIdx % 2 === 0 ? 250 : 240;
        doc.setFillColor(bgColor, bgColor, bgColor);
        doc.rect(margin, tableY, contentWidth, 8, "F");
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        
        xPos = margin;
        const rowData = [
          (ex.name || ex.nome)?.substring(0, 25) || "-",
          String(ex.sets || ex.series || "-"),
          String(ex.reps || ex.repeticoes || "-"),
          ex.rest || ex.descanso || "-",
          (ex.tips || ex.dicas)?.substring(0, 20) || "-"
        ];
        
        rowData.forEach((cell, i) => {
          doc.text(cell, xPos + 2, tableY + 5);
          xPos += colWidths[i];
        });
        
        tableY += 8;
      });

      if (helpers.setYPos) helpers.setYPos(tableY + 5);
    });
  }

  // Handle semanas format (week-based)
  if (conteudo?.semanas && Array.isArray(conteudo.semanas)) {
    conteudo.semanas.forEach((semana: any) => {
      const isBlocked = semana.bloqueada;
      addSectionTitle(`SEMANA ${semana.semana}${semana.ciclo ? ` - Ciclo ${semana.ciclo}` : ''}${isBlocked ? ' 🔒' : ''}`);

      if (isBlocked) {
        addText("Esta semana será liberada após envio do feedback e fotos do ciclo anterior.", 5);
        return;
      }

      semana.dias?.forEach((dia: any) => {
        checkNewPage(30);
        addSubsectionTitle(`${dia.dia} - ${dia.foco}${dia.duracao_minutos ? ` (${dia.duracao_minutos} min)` : ''}`);

        // Tabela de exercícios
        let tableY = helpers.yPos ? helpers.yPos() : 0;
        const colWidths = [60, 25, 30, 25, 40];
        const headers = ["EXERCÍCIO", "SÉRIES", "REPS", "DESC.", "DICAS"];
        
        // Header da tabela
        doc.setFillColor(50, 50, 50);
        doc.rect(margin, tableY, contentWidth, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        
        let xPos = margin;
        headers.forEach((header, i) => {
          doc.text(header, xPos + 2, tableY + 5);
          xPos += colWidths[i];
        });
        tableY += 7;

        // Linhas de exercícios
        dia.exercicios?.forEach((ex: any, idx: number) => {
          checkNewPage(10);
          const bgColor = idx % 2 === 0 ? 250 : 240;
          doc.setFillColor(bgColor, bgColor, bgColor);
          doc.rect(margin, tableY, contentWidth, 8, "F");
          
          doc.setTextColor(50, 50, 50);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          
          xPos = margin;
          const rowData = [
            ex.nome?.substring(0, 25) || "-",
            String(ex.series || "-"),
            String(ex.repeticoes || "-"),
            ex.descanso || "-",
            ex.dicas?.substring(0, 20) || "-"
          ];
          
          rowData.forEach((cell, i) => {
            doc.text(cell, xPos + 2, tableY + 5);
            xPos += colWidths[i];
          });
          
          tableY += 8;
        });

        if (helpers.setYPos) helpers.setYPos(tableY + 5);
      });
    });
  }

  // Próxima avaliação
  if (conteudo?.proxima_avaliacao) {
    addSectionTitle("Próxima Avaliação");
    addBoldText(conteudo.proxima_avaliacao);
  }
}

function generateNutricaoPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth } = helpers;

  // Macros em tabela
  if (conteudo?.calorias_diarias || conteudo?.macros) {
    addSectionTitle("Resumo Nutricional Diário");
    
    let tableY = helpers.yPos ? helpers.yPos() : 0;
    
    // Tabela de macros
    doc.setFillColor(50, 50, 50);
    doc.rect(margin, tableY, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    
    const macroHeaders = ["CALORIAS", "PROTEÍNAS", "CARBOIDRATOS", "GORDURAS"];
    const colWidth = contentWidth / 4;
    let xPos = margin;
    macroHeaders.forEach(header => {
      doc.text(header, xPos + colWidth/2, tableY + 5, { align: "center" });
      xPos += colWidth;
    });
    tableY += 7;

    // Valores
    doc.setFillColor(255, 245, 230);
    doc.rect(margin, tableY, contentWidth, 10, "F");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    const macroValues = [
      `${conteudo.calorias_diarias || '-'} kcal`,
      conteudo.macros?.proteinas || conteudo.macros?.proteinas_g ? `${conteudo.macros?.proteinas || conteudo.macros?.proteinas_g}` : '-',
      conteudo.macros?.carboidratos || conteudo.macros?.carboidratos_g ? `${conteudo.macros?.carboidratos || conteudo.macros?.carboidratos_g}` : '-',
      conteudo.macros?.gorduras || conteudo.macros?.gorduras_g ? `${conteudo.macros?.gorduras || conteudo.macros?.gorduras_g}` : '-'
    ];
    
    xPos = margin;
    macroValues.forEach(value => {
      doc.text(value, xPos + colWidth/2, tableY + 7, { align: "center" });
      xPos += colWidth;
    });
    
    if (helpers.setYPos) helpers.setYPos(tableY + 18);
  }

  // Refeições em tabela
  if (conteudo?.refeicoes) {
    addSectionTitle("Plano de Refeições");

    conteudo.refeicoes.forEach((refeicao: any, idx: number) => {
      checkNewPage(25);
      addSubsectionTitle(`${refeicao.nome} - ${refeicao.horario}${refeicao.calorias_aproximadas ? ` (~${refeicao.calorias_aproximadas} kcal)` : ''}`);

      refeicao.alimentos?.forEach((alimento: any) => {
        const alimentoText = typeof alimento === "string" 
          ? `• ${alimento}` 
          : `• ${alimento.item}${alimento.calorias ? ` (${alimento.calorias} kcal)` : ""}`;
        addText(alimentoText, 5);
      });
    });
  }

  // Hidratação
  if (conteudo?.hidratacao) {
    addSectionTitle("Hidratação");
    addBoldText(conteudo.hidratacao);
  }

  // Suplementação em tabela
  if (conteudo?.suplementacao && conteudo.suplementacao.length > 0) {
    addSectionTitle("Suplementação");
    conteudo.suplementacao.forEach((supl: string) => {
      addText(`• ${supl}`, 5);
    });
  }

  // Dicas
  if (conteudo?.dicas_gerais || conteudo?.dicas) {
    addSectionTitle("Dicas Importantes");
    const dicas = conteudo.dicas_gerais || conteudo.dicas;
    if (Array.isArray(dicas)) {
      dicas.forEach((dica: string) => addText(`• ${dica}`, 5));
    } else {
      addText(dicas);
    }
  }
}

function generateMindsetPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth } = helpers;

  // Mentalidade Necessária
  if (conteudo?.mentalidade_necessaria) {
    addSectionTitle("Mentalidade Necessária");
    addBoldText(conteudo.mentalidade_necessaria.titulo || "");
    addText(conteudo.mentalidade_necessaria.descricao || "");
    if (conteudo.mentalidade_necessaria.reflexao) {
      checkNewPage(15);
      doc.setFillColor(255, 245, 230);
      const lines = doc.splitTextToSize(`"${conteudo.mentalidade_necessaria.reflexao}"`, contentWidth - 10);
      doc.rect(margin, helpers.yPos() - 3, contentWidth, lines.length * 4 + 8, "F");
      doc.setTextColor(100, 60, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(lines, margin + 5, helpers.yPos() + 2);
      helpers.setYPos(helpers.yPos() + lines.length * 4 + 12);
    }
  }

  // Rotina da Manhã
  if (conteudo?.rotina_manha) {
    addSectionTitle(`Rotina da Manhã (${conteudo.rotina_manha.duracao || '5-10 min'})`);
    conteudo.rotina_manha.praticas?.forEach((pratica: any, idx: number) => {
      addBoldText(`${idx + 1}. ${pratica.nome}`);
      addText(pratica.descricao, 10);
    });
  }

  // Rotina da Noite
  if (conteudo?.rotina_noite) {
    addSectionTitle(`Rotina da Noite (${conteudo.rotina_noite.duracao || '5-10 min'})`);
    conteudo.rotina_noite.praticas?.forEach((pratica: any, idx: number) => {
      addBoldText(`${idx + 1}. ${pratica.nome}`);
      addText(pratica.descricao, 10);
    });
  }

  // Crenças Limitantes
  if (conteudo?.crencas_limitantes && conteudo.crencas_limitantes.length > 0) {
    addSectionTitle("Crenças Limitantes para Superar");
    conteudo.crencas_limitantes.forEach((crenca: any, idx: number) => {
      checkNewPage(25);
      // Suporta ambos os formatos: crenca ou crenca_original
      const crencaText = crenca.crenca || crenca.crenca_original || "";
      const acaoText = crenca.acao || crenca.acao_pratica || "";
      addSubsectionTitle(`Crença ${idx + 1}: "${crencaText}"`);
      addBoldText("Reformulação:", 5);
      addText(crenca.reformulacao || "", 10);
      addBoldText("Ação:", 5);
      addText(acaoText, 10);
    });
  }

  // Hábitos Semanais
  if (conteudo?.habitos_semanais && conteudo.habitos_semanais.length > 0) {
    addSectionTitle("Hábitos Semanais");
    conteudo.habitos_semanais.forEach((habito: string) => {
      addText(`☐ ${habito}`, 5);
    });
  }

  // Afirmações
  if (conteudo?.afirmacoes_personalizadas && conteudo.afirmacoes_personalizadas.length > 0) {
    addSectionTitle("Afirmações Personalizadas");
    conteudo.afirmacoes_personalizadas.forEach((afirmacao: any) => {
      // Suporta string ou objeto com campo afirmacao
      const afirmacaoText = typeof afirmacao === "string" ? afirmacao : afirmacao.afirmacao || "";
      if (afirmacaoText) {
        addBoldText(`"${afirmacaoText}"`, 5);
      }
    });
  }
}
