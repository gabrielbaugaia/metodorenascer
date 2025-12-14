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
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Helper functions
  const addHeader = () => {
    doc.setFillColor(255, 69, 0); // Primary orange
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MÉTODO RENASCER", margin, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Transformação Elite", margin, 30);
    yPos = 50;
  };

  const addTitle = (title: string) => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado em ${format(new Date(protocol.data_geracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      margin,
      yPos
    );
    yPos += 15;
  };

  const checkNewPage = (height: number = 20) => {
    if (yPos + height > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  const addSectionTitle = (title: string) => {
    checkNewPage(15);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, contentWidth, 10, "F");
    doc.setTextColor(255, 69, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 5, yPos + 2);
    yPos += 15;
  };

  const addText = (text: string, indent: number = 0) => {
    checkNewPage();
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 5 + 3;
  };

  const addBoldText = (text: string, indent: number = 0) => {
    checkNewPage();
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 5 + 3;
  };

  // Generate PDF based on protocol type
  addHeader();
  addTitle(protocol.titulo);

  if (protocol.tipo === "treino") {
    generateTreinoPdf(doc, protocol.conteudo, { addSectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth });
  } else if (protocol.tipo === "nutricao") {
    generateNutricaoPdf(doc, protocol.conteudo, { addSectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth, yPos: () => yPos, setYPos: (v: number) => yPos = v });
  }

  // Footer on all pages
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      `Método Renascer - Gabriel Baú | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `protocolo-${protocol.tipo}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

function generateTreinoPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth } = helpers;

  if (conteudo?.observacoes_gerais) {
    addSectionTitle("Observações Gerais");
    addText(conteudo.observacoes_gerais);
  }

  if (conteudo?.semanas) {
    conteudo.semanas.forEach((semana: any) => {
      addSectionTitle(`SEMANA ${semana.semana}`);

      semana.dias?.forEach((dia: any) => {
        checkNewPage(30);
        addBoldText(`${dia.dia} - ${dia.foco}`);

        dia.exercicios?.forEach((ex: any) => {
          const exerciseText = `• ${ex.nome}: ${ex.series}x${ex.repeticoes} (Descanso: ${ex.descanso})`;
          addText(exerciseText, 5);
          if (ex.dicas) {
            addText(`  Dica: ${ex.dicas}`, 10);
          }
        });
      });
    });
  }
}

function generateNutricaoPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth, yPos, setYPos } = helpers;

  // Macros overview
  if (conteudo?.calorias_diarias || conteudo?.macros) {
    addSectionTitle("Resumo Nutricional");
    
    const macroText = [
      conteudo.calorias_diarias ? `Calorias Diárias: ${conteudo.calorias_diarias} kcal` : null,
      conteudo.macros?.proteinas_g ? `Proteínas: ${conteudo.macros.proteinas_g}g` : null,
      conteudo.macros?.carboidratos_g ? `Carboidratos: ${conteudo.macros.carboidratos_g}g` : null,
      conteudo.macros?.gorduras_g ? `Gorduras: ${conteudo.macros.gorduras_g}g` : null,
    ].filter(Boolean).join(" | ");

    addBoldText(macroText);
  }

  // Meals
  if (conteudo?.refeicoes) {
    addSectionTitle("Plano de Refeições");

    conteudo.refeicoes.forEach((refeicao: any) => {
      checkNewPage(25);
      addBoldText(`${refeicao.nome} - ${refeicao.horario}`);

      refeicao.alimentos?.forEach((alimento: any) => {
        const alimentoText = typeof alimento === "string" 
          ? `• ${alimento}` 
          : `• ${alimento.item}${alimento.calorias ? ` (${alimento.calorias} kcal)` : ""}`;
        addText(alimentoText, 5);
      });

      if (refeicao.calorias_total) {
        addText(`Total: ${refeicao.calorias_total} kcal`, 5);
      }
    });
  }

  // Supplementation
  if (conteudo?.suplementacao && conteudo.suplementacao.length > 0) {
    addSectionTitle("Suplementação");
    conteudo.suplementacao.forEach((supl: string) => {
      addText(`• ${supl}`, 5);
    });
  }

  // Tips
  if (conteudo?.dicas) {
    addSectionTitle("Dicas Importantes");
    if (Array.isArray(conteudo.dicas)) {
      conteudo.dicas.forEach((dica: string) => addText(`• ${dica}`, 5));
    } else {
      addText(conteudo.dicas);
    }
  }
}
