import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Protocol {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: any;
  data_geracao: string;
  audit_result?: any;
}

// Track PDF download event (called from components that use this function)
export function trackPdfDownloadEvent(tipo: string, trackFn: (pdfType: "treino" | "nutricao" | "mindset" | "anamnese" | "evolucao") => void) {
  const validTypes = ["treino", "nutricao", "mindset", "anamnese", "evolucao"] as const;
  if (validTypes.includes(tipo as any)) {
    trackFn(tipo as typeof validTypes[number]);
  }
}

export function generateProtocolPdf(protocol: Protocol, includeAudit: boolean = false): void {
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

  // Audit section (admin only)
  if (includeAudit && protocol.audit_result) {
    const audit = protocol.audit_result;
    doc.addPage();
    yPos = 20;
    
    addSectionTitle("AUDITORIA INTERNA DE QUALIDADE");
    
    const criteriaLabels: Record<string, string> = {
      coherence_anamnese: "Coerência com anamnese",
      coherence_objective: "Coerência com objetivo",
      restriction_respect: "Respeito às restrições/lesões",
      weekly_volume: "Volume semanal adequado",
      muscle_distribution: "Distribuição dos grupamentos musculares",
      progression_defined: "Progressão definida (4 semanas)",
      instruction_clarity: "Clareza das instruções",
      mindset_quality: "Qualidade do protocolo de mindset",
      safety_score: "Segurança geral da prescrição",
    };

    for (const [key, label] of Object.entries(criteriaLabels)) {
      const passed = audit[key] === true;
      addText(`${passed ? "✅" : "❌"} ${label}: ${passed ? "Passou" : "Falhou"}`);
    }

    checkNewPage(15);
    addBoldText(`Score final de qualidade: ${audit.final_score || 0}/100`);
    addText(`Classificação: ${audit.classification || "N/A"}`);

    if (audit.issues?.length > 0) {
      checkNewPage(10);
      addSubsectionTitle("Problemas Detectados");
      audit.issues.forEach((issue: string) => addText(`• ${issue}`, 5));
    }

    if (audit.corrections_applied?.length > 0) {
      checkNewPage(10);
      addSubsectionTitle("Correções Aplicadas");
      audit.corrections_applied.forEach((corr: string) => addText(`• ${corr}`, 5));
    }
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
      addSubsectionTitle(`Treino ${treino.letra || treino.day || '?'} - ${treino.foco || treino.focus || ''}${treino.duration ? ` (${treino.duration} min)` : ''}`);

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
      const exercises = treino.exercicios || treino.exercises || [];
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
          (ex.nome || ex.name)?.substring(0, 25) || "-",
          String(ex.series || ex.sets || "-"),
          String(ex.repeticoes || ex.reps || "-"),
          ex.descanso || ex.rest || "-",
          (ex.dicas || ex.tips)?.substring(0, 20) || "-"
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

// Helper: render a meal block (used for both treino and descanso day plans)
function renderMealBlock(refeicao: any, helpers: any) {
  const { addSubsectionTitle, addText, addBoldText, checkNewPage } = helpers;
  if (!refeicao) return;

  const subtitle = [
    refeicao.nome,
    refeicao.horario ? `(${refeicao.horario})` : null,
    refeicao.calorias_aproximadas ? `~${refeicao.calorias_aproximadas} kcal` : null,
    refeicao.calorias ? `~${refeicao.calorias} kcal` : null,
  ].filter(Boolean).join(" — ");

  checkNewPage(25);
  addSubsectionTitle(subtitle);

  // Alimentos
  const alimentos = refeicao.alimentos || refeicao.opcoes || [];
  alimentos.forEach((alimento: any) => {
    if (typeof alimento === "string") {
      addText(`• ${alimento}`, 5);
    } else {
      const name = alimento.item || alimento.nome || alimento.alimento || "";
      const qty = alimento.quantidade || alimento.porcao || "";
      const kcal = alimento.calorias || "";
      addText(`• ${name}${qty ? ` — ${qty}` : ""}${kcal ? ` (${kcal} kcal)` : ""}`, 5);
    }
  });

  // Macros da refeição
  if (refeicao.macros) {
    const m = refeicao.macros;
    const macroLine = [
      m.proteina || m.proteinas ? `P: ${m.proteina || m.proteinas}g` : null,
      m.carboidrato || m.carboidratos ? `C: ${m.carboidrato || m.carboidratos}g` : null,
      m.gordura || m.gorduras ? `G: ${m.gordura || m.gorduras}g` : null,
    ].filter(Boolean).join(" | ");
    if (macroLine) addText(`  ↳ ${macroLine}`, 8);
  }

  // Substituições inline
  const subs = refeicao.substituicoes || refeicao.alternativas || [];
  if (subs.length > 0) {
    addText("  Substituições:", 5);
    subs.forEach((sub: any) => {
      const subText = typeof sub === "string" ? sub : `${sub.original || ""} → ${sub.substituto || sub.opcao || ""}`;
      addText(`    • ${subText}`, 10);
    });
  }

  // Observação da refeição
  if (refeicao.observacao || refeicao.nota) {
    addText(`  Obs: ${refeicao.observacao || refeicao.nota}`, 5);
  }
}

function generateNutricaoPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addSubsectionTitle, addText, addBoldText, checkNewPage, margin, contentWidth } = helpers;

  // Detect expanded format
  const isExpanded = !!(conteudo?.plano_dia_treino || conteudo?.macros_diarios || conteudo?.plano_dia_descanso);

  // ── EXPANDED FORMAT ─────────────────────────────────────────────────────────
  if (isExpanded) {

    // 1. Resumo Macros Diários
    if (conteudo?.macros_diarios) {
      const md = conteudo.macros_diarios;
      addSectionTitle("Resumo de Macros Diários");

      let tableY = helpers.yPos ? helpers.yPos() : 0;
      const colWidth = contentWidth / 5;

      doc.setFillColor(50, 50, 50);
      doc.rect(margin, tableY, contentWidth, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");

      const macroHeaders = ["CALORIAS", "PROTEÍNA", "CARBOIDRATO", "GORDURA", "ÁGUA"];
      let xPos = margin;
      macroHeaders.forEach(h => {
        doc.text(h, xPos + colWidth / 2, tableY + 5, { align: "center" });
        xPos += colWidth;
      });
      tableY += 7;

      doc.setFillColor(255, 245, 230);
      doc.rect(margin, tableY, contentWidth, 10, "F");
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");

      const macroValues = [
        md.calorias ? `${md.calorias} kcal` : "-",
        md.proteina ? `${md.proteina}g` : (md.proteinas ? `${md.proteinas}g` : "-"),
        md.carboidrato ? `${md.carboidrato}g` : (md.carboidratos ? `${md.carboidratos}g` : "-"),
        md.gordura ? `${md.gordura}g` : (md.gorduras ? `${md.gorduras}g` : "-"),
        md.agua || md.hidratacao ? `${md.agua || md.hidratacao}` : "-",
      ];

      xPos = margin;
      macroValues.forEach(v => {
        doc.text(v, xPos + colWidth / 2, tableY + 7, { align: "center" });
        xPos += colWidth;
      });

      if (helpers.setYPos) helpers.setYPos(tableY + 18);
    }

    // 2. Plano Dia de Treino
    if (conteudo?.plano_dia_treino) {
      const pdt = conteudo.plano_dia_treino;
      addSectionTitle("Plano — Dia de Treino");
      if (pdt.nota || pdt.descricao) addText(pdt.nota || pdt.descricao);
      const refeicoesT = pdt.refeicoes || [];
      refeicoesT.forEach((r: any) => renderMealBlock(r, helpers));
    }

    // 3. Plano Dia de Descanso
    if (conteudo?.plano_dia_descanso) {
      const pdd = conteudo.plano_dia_descanso;
      addSectionTitle("Plano — Dia de Descanso");
      if (pdd.nota || pdd.descricao || pdd.nota_ajuste) addText(pdd.nota || pdd.descricao || pdd.nota_ajuste);
      const refeicoesD = pdd.refeicoes || [];
      refeicoesD.forEach((r: any) => renderMealBlock(r, helpers));
    }

    // 4. Refeição Pré-Sono
    if (conteudo?.refeicao_pre_sono) {
      const rps = conteudo.refeicao_pre_sono;
      addSectionTitle("Refeição Pré-Sono");
      if (rps.descricao || rps.nota) addText(rps.descricao || rps.nota);
      const opcoes = rps.opcoes || [];
      opcoes.forEach((opcao: any, idx: number) => {
        checkNewPage(20);
        addSubsectionTitle(`Opção ${idx + 1}${opcao.nome ? ` — ${opcao.nome}` : ""}`);
        const als = opcao.alimentos || [];
        als.forEach((al: any) => {
          const name = typeof al === "string" ? al : (al.item || al.nome || al.alimento || "");
          const qty = typeof al === "object" ? (al.quantidade || al.porcao || "") : "";
          addText(`• ${name}${qty ? ` — ${qty}` : ""}`, 5);
        });
        if (opcao.macros) {
          const m = opcao.macros;
          const line = [
            m.proteina || m.proteinas ? `P: ${m.proteina || m.proteinas}g` : null,
            m.carboidrato || m.carboidratos ? `C: ${m.carboidrato || m.carboidratos}g` : null,
            m.gordura || m.gorduras ? `G: ${m.gordura || m.gorduras}g` : null,
            m.calorias ? `${m.calorias} kcal` : null,
          ].filter(Boolean).join(" | ");
          if (line) addText(`  ↳ ${line}`, 8);
        }
      });
    }

    // 5. Hidratação (expandida)
    if (conteudo?.hidratacao && typeof conteudo.hidratacao === "object") {
      const h = conteudo.hidratacao;
      addSectionTitle("Hidratação");
      if (h.calculo) addBoldText(h.calculo);
      if (h.litros_dia) addText(`Total diário: ${h.litros_dia}`);
      const dist = h.distribuicao || h.dicas || [];
      dist.forEach((item: any) => {
        const text = typeof item === "string" ? item : `${item.horario || item.momento || ""}: ${item.quantidade || item.descricao || ""}`;
        addText(`• ${text}`, 5);
      });
    } else if (conteudo?.hidratacao && typeof conteudo.hidratacao === "string") {
      const ht = conteudo.hidratacao.trim();
      if (ht && !ht.includes("[object Object]")) {
        addSectionTitle("Hidratação");
        addBoldText(ht);
      }
    }

    // 6. Lista de Compras Semanal
    if (conteudo?.lista_compras_semanal) {
      const lc = conteudo.lista_compras_semanal;
      addSectionTitle("Lista de Compras Semanal");
      const categorias: Record<string, string> = {
        proteinas: "Proteínas",
        carboidratos: "Carboidratos",
        gorduras: "Gorduras",
        frutas: "Frutas",
        vegetais: "Vegetais e Legumes",
        outros: "Outros",
      };
      Object.entries(categorias).forEach(([key, label]) => {
        const items = lc[key];
        if (!items || (Array.isArray(items) && items.length === 0)) return;
        checkNewPage(15);
        addSubsectionTitle(label);
        const list = Array.isArray(items) ? items : [items];
        list.forEach((item: any) => {
          const text = typeof item === "string" ? item : (item.nome || item.item || item.alimento || JSON.stringify(item));
          addText(`• ${text}`, 5);
        });
      });
    }

    // 7. Substituições
    if (conteudo?.substituicoes && conteudo.substituicoes.length > 0) {
      addSectionTitle("Substituições");
      conteudo.substituicoes.forEach((cat: any) => {
        if (cat.categoria) {
          checkNewPage(12);
          addSubsectionTitle(cat.categoria);
        }
        const items = cat.opcoes || cat.equivalencias || cat.items || (Array.isArray(cat) ? cat : []);
        items.forEach((item: any) => {
          if (typeof item === "string") {
            addText(`• ${item}`, 5);
          } else {
            const text = `${item.original || item.de || ""} → ${item.substituto || item.para || item.opcao || ""}`;
            addText(`• ${text}`, 5);
          }
        });
      });
    }

    // 8. Estratégia Anti-Compulsão
    if (conteudo?.estrategia_anti_compulsao) {
      const eac = conteudo.estrategia_anti_compulsao;
      addSectionTitle("Estratégia Anti-Compulsão");
      if (typeof eac === "string") {
        addText(eac);
      } else {
        if (eac.descricao || eac.texto) addText(eac.descricao || eac.texto);
        const orientacoes = eac.orientacoes || eac.dicas || [];
        orientacoes.forEach((o: any) => {
          const text = typeof o === "string" ? o : (o.descricao || o.titulo || "");
          if (text) addText(`• ${text}`, 5);
        });
      }
    }

    // 9. Suplementação (reutilizar lógica abaixo)
    renderSuplementacao(conteudo?.suplementacao, helpers);

    // 10. Dicas
    renderDicas(conteudo, helpers);

    return; // done with expanded format
  }

  // ── LEGACY FORMAT ─────────────────────────────────────────────────────────
  // Macros em tabela
  if (conteudo?.calorias_diarias || conteudo?.macros) {
    addSectionTitle("Resumo Nutricional Diário");
    
    let tableY = helpers.yPos ? helpers.yPos() : 0;
    
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

  // Refeições legadas
  if (conteudo?.refeicoes) {
    addSectionTitle("Plano de Refeições");
    conteudo.refeicoes.forEach((refeicao: any) => {
      renderMealBlock(refeicao, helpers);
    });
  }

  // Hidratação legada
  if (conteudo?.hidratacao) {
    const hidratacaoText = typeof conteudo.hidratacao === 'string' 
      ? conteudo.hidratacao 
      : conteudo.hidratacao?.quantidade || conteudo.hidratacao?.recomendacao || null;
    
    if (hidratacaoText && hidratacaoText.trim() && !hidratacaoText.includes('[object Object]')) {
      addSectionTitle("Hidratação");
      addBoldText(hidratacaoText);
    }
  }

  renderSuplementacao(conteudo?.suplementacao, helpers);
  renderDicas(conteudo, helpers);
}

function renderSuplementacao(suplementacao: any, helpers: any) {
  const { addSectionTitle, addText } = helpers;
  if (!suplementacao || !Array.isArray(suplementacao) || suplementacao.length === 0) return;

  const validSupl = suplementacao.filter((supl: any) => {
    if (typeof supl === 'string') return supl.trim() && !supl.includes('[object Object]');
    if (typeof supl === 'object' && supl !== null) {
      const t = supl.nome || supl.suplemento || supl.item || '';
      return t.trim() && !t.includes('[object Object]');
    }
    return false;
  });

  if (validSupl.length === 0) return;

  addSectionTitle("Suplementação");
  validSupl.forEach((supl: any) => {
    const suplText = typeof supl === 'string'
      ? supl
      : `${supl.nome || supl.suplemento || supl.item}${supl.dosagem ? ` — ${supl.dosagem}` : ''}${supl.horario ? ` (${supl.horario})` : ''}${supl.observacao ? ` · ${supl.observacao}` : ''}`;
    addText(`• ${suplText}`, 5);
  });
}

function renderDicas(conteudo: any, helpers: any) {
  const { addSectionTitle, addText } = helpers;
  const dicas = conteudo?.dicas_gerais || conteudo?.dicas;
  if (!dicas) return;
  addSectionTitle("Dicas Importantes");
  if (Array.isArray(dicas)) {
    dicas.forEach((dica: string) => addText(`• ${dica}`, 5));
  } else {
    addText(dicas);
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
