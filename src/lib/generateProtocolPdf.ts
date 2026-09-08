import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PDF_COLORS,
  PDF_MARGIN,
  drawContinuationHeader,
  drawFooters,
  drawHeader,
  setDraw,
  setFill,
  setText,
} from "./pdfTheme";

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

function formatDate(value: string) {
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

export function generateProtocolPdf(protocol: Protocol, includeAudit: boolean = false): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PDF_MARGIN;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 22;

  const typeLabel =
    protocol.tipo === "treino" ? "Protocolo de Treino"
      : protocol.tipo === "nutricao" ? "Plano Nutricional"
      : protocol.tipo === "mindset" ? "Protocolo de Mentalidade"
      : "Protocolo";

  const metaItems: string[] = [formatDate(protocol.data_geracao)];
  if (protocol.conteudo?.duracao_semanas) metaItems.push(`${protocol.conteudo.duracao_semanas} semanas`);

  let yPos = drawHeader(doc, {
    title: protocol.titulo || typeLabel,
    subtitle: typeLabel,
    meta: metaItems,
  });

  const newPage = () => {
    doc.addPage();
    yPos = drawContinuationHeader(doc, typeLabel);
  };

  const checkNewPage = (height: number = 15) => {
    if (yPos + height > bottomLimit) newPage();
  };

  const addSectionTitle = (title: string) => {
    checkNewPage(22);
    yPos += 3;
    setFill(doc, PDF_COLORS.bronze);
    doc.rect(margin, yPos - 3.2, 14, 0.9, "F");
    yPos += 3;
    setText(doc, PDF_COLORS.text);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin, yPos + 2);
    yPos += 10;
  };

  const addSubsectionTitle = (title: string) => {
    checkNewPage(16);
    setText(doc, PDF_COLORS.text);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(title, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4.6 + 1.5;
    setFill(doc, PDF_COLORS.hairline);
    doc.rect(margin, yPos, contentWidth, 0.3, "F");
    yPos += 5;
  };

  const addText = (text: string, indent: number = 0) => {
    if (!text) return;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(String(text), contentWidth - indent);
    for (const line of lines) {
      checkNewPage(6);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      setText(doc, PDF_COLORS.text);
      doc.text(line, margin + indent, yPos);
      yPos += 4.6;
    }
    yPos += 1.5;
  };

  const addBoldText = (text: string, indent: number = 0) => {
    if (!text) return;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(String(text), contentWidth - indent);
    for (const line of lines) {
      checkNewPage(6);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      setText(doc, PDF_COLORS.text);
      doc.text(line, margin + indent, yPos);
      yPos += 4.6;
    }
    yPos += 1.5;
  };

  const addObservation = (text: string) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", protocol.tipo === "nutricao" ? "normal" : "italic");
    const observationText = protocol.tipo === "nutricao" ? sanitizeNutritionText(text) : String(text);
    const lines = doc.splitTextToSize(observationText, contentWidth - 14);
    const boxHeight = lines.length * 4.4 + 9;
    checkNewPage(boxHeight + 4);
    setFill(doc, PDF_COLORS.surface);
    doc.rect(margin, yPos - 3, contentWidth, boxHeight, "F");
    setFill(doc, PDF_COLORS.bronze);
    doc.rect(margin, yPos - 3, 1.4, boxHeight, "F");
    setText(doc, PDF_COLORS.text);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", protocol.tipo === "nutricao" ? "normal" : "italic");
    doc.text(lines, margin + 8, yPos + 3);
    yPos += boxHeight + 5;
  };

  const helpersBase = {
    addSectionTitle,
    addSubsectionTitle,
    addText,
    addBoldText,
    addObservation,
    checkNewPage,
    newPage,
    margin,
    contentWidth,
    bottomLimit,
    yPos: () => yPos,
    setYPos: (v: number) => { yPos = v; },
  };

  // Resumo do protocolo (primeira página)
  const resumoItems: { label: string; value: string }[] = [];
  const c = protocol.conteudo || {};
  if (c.nivel) resumoItems.push({ label: "Nível", value: String(c.nivel) });
  if (c.objetivo) resumoItems.push({ label: "Objetivo", value: String(c.objetivo) });
  if (c.frequencia_semanal) resumoItems.push({ label: "Frequência", value: `${c.frequencia_semanal}x / semana` });
  if (c.duracao_semanas) resumoItems.push({ label: "Duração", value: `${c.duracao_semanas} semanas` });
  if (c.calorias_diarias) resumoItems.push({ label: "Calorias", value: `${c.calorias_diarias} kcal` });
  resumoItems.push({ label: "Emissão", value: formatDate(protocol.data_geracao) });

  {
    const cols = 3;
    const rows = Math.ceil(resumoItems.length / cols);
    const cellW = contentWidth / cols;
    const cellH = 15;
    const boxH = rows * cellH + 6;
    checkNewPage(boxH + 6);
    setFill(doc, PDF_COLORS.surface);
    doc.rect(margin, yPos, contentWidth, boxH, "F");
    setDraw(doc, PDF_COLORS.hairline);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, boxH, "S");
    resumoItems.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * cellW + 6;
      const y = yPos + 4 + row * cellH;
      setText(doc, PDF_COLORS.muted);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(item.label.toUpperCase(), x, y + 4);
      setText(doc, PDF_COLORS.text);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      const val = doc.splitTextToSize(item.value, cellW - 10)[0];
      doc.text(val, x, y + 10);
    });
    yPos += boxH + 8;
  }

  // Add adjustment observation if exists
  if (protocol.conteudo?.observacao_ajustes) {
    addObservation(protocol.conteudo.observacao_ajustes);
  }

  if (protocol.tipo === "treino") {
    generateTreinoPdf(doc, protocol.conteudo, helpersBase);
  } else if (protocol.tipo === "nutricao") {
    generateNutricaoPdf(doc, protocol.conteudo, helpersBase);
  } else if (protocol.tipo === "mindset") {
    generateMindsetPdf(doc, protocol.conteudo, helpersBase);
  }

  // Audit section (admin only)
  if (includeAudit && protocol.audit_result) {
    const audit = protocol.audit_result;
    newPage();

    addSectionTitle("Auditoria interna de qualidade");

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
      addText(`${label}: ${passed ? "Aprovado" : "Reprovado"}`);
    }

    addBoldText(`Score final de qualidade: ${audit.final_score || 0}/100`);
    addText(`Classificação: ${audit.classification || "N/A"}`);

    if (audit.issues?.length > 0) {
      addSubsectionTitle("Problemas detectados");
      audit.issues.forEach((issue: string) => addText(`• ${issue}`, 5));
    }

    if (audit.corrections_applied?.length > 0) {
      addSubsectionTitle("Correções aplicadas");
      audit.corrections_applied.forEach((corr: string) => addText(`• ${corr}`, 5));
    }
  }

  drawFooters(doc);

  // Save
  const fileName = `protocolo-${protocol.tipo}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

/** Renderiza a tabela de exercícios com altura de linha dinâmica e page break correto. */
function renderExerciseTable(doc: jsPDF, exercises: any[], helpers: any) {
  const { margin, contentWidth, bottomLimit, newPage } = helpers;
  if (!exercises || exercises.length === 0) return;

  const colWidths = [
    contentWidth * 0.42,
    contentWidth * 0.11,
    contentWidth * 0.13,
    contentWidth * 0.12,
    contentWidth * 0.22,
  ];
  const headers = ["EXERCÍCIO", "SÉRIES", "REPS", "DESC.", "OBSERVAÇÕES"];

  const drawTableHeader = (y: number) => {
    setFill(doc, PDF_COLORS.graphite);
    doc.rect(margin, y, contentWidth, 8, "F");
    setText(doc, PDF_COLORS.offWhite);
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "bold");
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + 3, y + 5.3);
      x += colWidths[i];
    });
    return y + 8;
  };

  let tableY = drawTableHeader(helpers.yPos());

  exercises.forEach((ex: any, idx: number) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const name = String(ex.nome || ex.name || "-");
    const tips = String(ex.dicas || ex.tips || "");
    const nameLines = doc.splitTextToSize(name, colWidths[0] - 6);
    const tipLines = tips ? doc.splitTextToSize(tips, colWidths[4] - 6) : ["—"];
    const rowLines = Math.max(nameLines.length, tipLines.length, 1);
    const rowHeight = rowLines * 4.2 + 4;

    if (tableY + rowHeight > bottomLimit) {
      helpers.setYPos(tableY);
      newPage();
      tableY = drawTableHeader(helpers.yPos());
    }

    setFill(doc, idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.surface);
    doc.rect(margin, tableY, contentWidth, rowHeight, "F");
    setFill(doc, PDF_COLORS.hairline);
    doc.rect(margin, tableY + rowHeight - 0.25, contentWidth, 0.25, "F");

    const baseY = tableY + 5;
    let x = margin;

    setText(doc, PDF_COLORS.text);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(nameLines, x + 3, baseY);
    x += colWidths[0];

    doc.setFont("helvetica", "normal");
    const mid = [
      String(ex.series || ex.sets || "-"),
      String(ex.repeticoes || ex.reps || "-"),
      String(ex.descanso || ex.rest || "-"),
    ];
    mid.forEach((cell, i) => {
      doc.text(cell, x + 3, baseY);
      x += colWidths[i + 1];
    });

    setText(doc, PDF_COLORS.muted);
    doc.setFontSize(7.2);
    doc.text(tipLines, x + 3, baseY);

    tableY += rowHeight;
  });

  helpers.setYPos(tableY + 7);
}

/** Estima a altura necessária de um bloco de treino para decidir o page break. */
function estimateWorkoutHeight(exercises: any[]) {
  return 22 + (exercises?.length || 0) * 9;
}

function generateTreinoPdf(doc: jsPDF, conteudo: any, helpers: any) {
  const { addSectionTitle, addSubsectionTitle, addText, addBoldText, bottomLimit, newPage } = helpers;

  if (conteudo?.aquecimento || conteudo?.alongamento) {
    addSectionTitle("Preparação");
    if (conteudo.aquecimento) addText(`Aquecimento: ${conteudo.aquecimento}`);
    if (conteudo.alongamento) addText(`Alongamento: ${conteudo.alongamento}`);
  }

  if (conteudo?.observacoes_gerais) {
    addSectionTitle("Observações gerais");
    addText(conteudo.observacoes_gerais);
  }

  const startBlock = (exercises: any[]) => {
    const needed = estimateWorkoutHeight(exercises);
    const remaining = bottomLimit - helpers.yPos();
    if (needed > remaining && remaining < 90) newPage();
  };

  // Handle treinos array format (direct workout list)
  if (conteudo?.treinos && Array.isArray(conteudo.treinos)) {
    addSectionTitle("Plano de treino semanal");

    conteudo.treinos.forEach((treino: any) => {
      const exercises = treino.exercicios || treino.exercises || [];
      startBlock(exercises);
      addSubsectionTitle(
        `Treino ${treino.letra || treino.day || "?"} — ${treino.foco || treino.focus || ""}${treino.duration ? `  ·  ${treino.duration} min` : ""}`
      );
      renderExerciseTable(doc, exercises, helpers);
    });
  }

  // Handle semanas format (week-based)
  if (conteudo?.semanas && Array.isArray(conteudo.semanas)) {
    conteudo.semanas.forEach((semana: any) => {
      const isBlocked = semana.bloqueada;
      addSectionTitle(`Semana ${semana.semana}${semana.ciclo ? ` — Ciclo ${semana.ciclo}` : ""}${isBlocked ? " (bloqueada)" : ""}`);

      if (isBlocked) {
        addText("Esta semana será liberada após envio do feedback e fotos do ciclo anterior.", 5);
        return;
      }

      semana.dias?.forEach((dia: any) => {
        const exercises = dia.exercicios || [];
        startBlock(exercises);
        addSubsectionTitle(`${dia.dia} — ${dia.foco}${dia.duracao_minutos ? `  ·  ${dia.duracao_minutos} min` : ""}`);
        renderExerciseTable(doc, exercises, helpers);
      });
    });
  }

  // Próxima avaliação
  if (conteudo?.proxima_avaliacao) {
    addSectionTitle("Próxima avaliação");
    addBoldText(conteudo.proxima_avaliacao);
  }
}

// Nutrition strings are normalized before both measurement and drawing.
export function sanitizeNutritionText(value: unknown): string {
  return String(value ?? "")
    .replace(/(?:â(?:†|€|€™|€˜|€")+[’'\u0092]?|!+[’'\u0092]+|[→↳]|=>|->|[—–])/gi, " - ")
    .replace(/•/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\uFEFF�]/g, "")
    .replace(/\s*-\s*-+\s*/g, " - ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:)])/g, "$1")
    .trim();
}

function renderMealBlock(doc: jsPDF, refeicao: any, helpers: any) {
  if (!refeicao) return;
  const { margin, contentWidth, bottomLimit, newPage } = helpers;
  let y: number = helpers.yPos();
  const foodLineHeight = 4.7;
  const substitutionLineHeight = 4.5;
  const ensure = (height: number) => {
    if (y + height > bottomLimit) {
      newPage();
      y = helpers.yPos();
    }
  };

  const title = sanitizeNutritionText([
    refeicao.nome,
    refeicao.horario ? `(${refeicao.horario})` : null,
    refeicao.calorias_aproximadas ? `~${refeicao.calorias_aproximadas} kcal` : null,
    refeicao.calorias ? `~${refeicao.calorias} kcal` : null,
  ].filter(Boolean).join(" "));
  const alimentos: string[] = (refeicao.alimentos || refeicao.opcoes || []).map((alimento: any) => {
    if (typeof alimento === "string") return sanitizeNutritionText(alimento);
    const name = alimento.item || alimento.nome || alimento.alimento || "";
    const qty = alimento.quantidade || alimento.porcao || "";
    const kcal = alimento.calorias || "";
    return sanitizeNutritionText(`${name}${qty ? ` - ${qty}` : ""}${kcal ? ` (${kcal} kcal)` : ""}`);
  }).filter(Boolean);
  let macroLine = "";
  if (refeicao.macros) {
    const m = refeicao.macros;
    macroLine = sanitizeNutritionText([
      m.proteina || m.proteinas ? `P: ${m.proteina || m.proteinas}g` : null,
      m.carboidrato || m.carboidratos ? `C: ${m.carboidrato || m.carboidratos}g` : null,
      m.gordura || m.gorduras ? `G: ${m.gordura || m.gorduras}g` : null,
    ].filter(Boolean).join(" | "));
  }
  const subs: string[] = (refeicao.substituicoes || refeicao.alternativas || []).map((sub: any) => {
    if (typeof sub === "string") return sanitizeNutritionText(sub);
    const from = sub.original || sub.de || "";
    const to = sub.substituto || sub.para || sub.opcao || "";
    return sanitizeNutritionText(from && to ? `${from} - ${to}` : `${from}${to}`);
  }).filter(Boolean);
  const observation = sanitizeNutritionText(refeicao.observacao || refeicao.nota || "");

  ensure(12 + Math.min(alimentos.length, 2) * foodLineHeight + (subs.length ? 9 : 0));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, PDF_COLORS.text);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 4.8 + 1.6;
  setFill(doc, PDF_COLORS.hairline);
  doc.rect(margin, y, contentWidth, 0.3, "F");
  y += 4.4;

  for (const food of alimentos) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    const lines = doc.splitTextToSize(food, contentWidth - 10);
    lines.forEach((line: string, index: number) => {
      ensure(foodLineHeight + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      setText(doc, [34, 34, 34]);
      if (index === 0) {
        setFill(doc, [34, 34, 34]);
        doc.circle(margin + 2.2, y - 1, 0.55, "F");
      }
      doc.text(line, margin + 6, y);
      y += foodLineHeight;
    });
  }

  if (macroLine) {
    ensure(substitutionLineHeight + 3);
    y += 1.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    setText(doc, PDF_COLORS.muted);
    doc.text(macroLine, margin + 6, y);
    y += substitutionLineHeight;
  }

  if (subs.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.4);
    const firstLines = doc.splitTextToSize(subs[0], contentWidth - 16).length;
    ensure(6.8 + Math.min(firstLines, 2) * substitutionLineHeight);
    y += 2.6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, PDF_COLORS.bronze);
    doc.text("SUBSTITUIÇÕES", margin + 6, y);
    y += 4.4;
    for (const substitution of subs) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.4);
      const lines = doc.splitTextToSize(substitution, contentWidth - 16);
      lines.forEach((line: string, index: number) => {
        ensure(substitutionLineHeight + 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.4);
        setText(doc, [95, 99, 104]);
        if (index === 0) {
          setFill(doc, [95, 99, 104]);
          doc.circle(margin + 8.2, y - 0.9, 0.5, "F");
        }
        doc.text(line, margin + 12, y);
        y += substitutionLineHeight;
      });
    }
  }

  if (observation) {
    const lines = doc.splitTextToSize(`Obs: ${observation}`, contentWidth - 10);
    lines.forEach((line: string) => {
      ensure(substitutionLineHeight + 2);
      y += 0.6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, PDF_COLORS.muted);
      doc.text(line, margin + 6, y);
      y += substitutionLineHeight;
    });
  }
  helpers.setYPos(y + 5.5);
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

      setFill(doc, PDF_COLORS.graphite);
      doc.rect(margin, tableY, contentWidth, 7, "F");
      setText(doc, PDF_COLORS.offWhite);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");

      const macroHeaders = ["CALORIAS", "PROTEÍNA", "CARBOIDRATO", "GORDURA", "ÁGUA"];
      let xPos = margin;
      macroHeaders.forEach(h => {
        doc.text(h, xPos + colWidth / 2, tableY + 5, { align: "center" });
        xPos += colWidth;
      });
      tableY += 7;

      setFill(doc, PDF_COLORS.surface);
      doc.rect(margin, tableY, contentWidth, 10, "F");
      setText(doc, PDF_COLORS.text);
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
      refeicoesT.forEach((r: any) => renderMealBlock(doc, r, helpers));
    }

    // 3. Plano Dia de Descanso
    if (conteudo?.plano_dia_descanso) {
      const pdd = conteudo.plano_dia_descanso;
      addSectionTitle("Plano — Dia de Descanso");
      if (pdd.nota || pdd.descricao || pdd.nota_ajuste) addText(pdd.nota || pdd.descricao || pdd.nota_ajuste);
      const refeicoesD = pdd.refeicoes || [];
      refeicoesD.forEach((r: any) => renderMealBlock(doc, r, helpers));
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
          if (line) addText(`  ${line}`, 8);
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
            const text = `${item.original || item.de || ""} - ${item.substituto || item.para || item.opcao || ""}`;
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
    
    setFill(doc, PDF_COLORS.graphite);
    doc.rect(margin, tableY, contentWidth, 7, "F");
    setText(doc, PDF_COLORS.offWhite);
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

    setFill(doc, PDF_COLORS.surface);
    doc.rect(margin, tableY, contentWidth, 10, "F");
    setText(doc, PDF_COLORS.text);
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
      renderMealBlock(doc, refeicao, helpers);
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
      setFill(doc, PDF_COLORS.surface);
      const lines = doc.splitTextToSize(`"${conteudo.mentalidade_necessaria.reflexao}"`, contentWidth - 10);
      doc.rect(margin, helpers.yPos() - 3, contentWidth, lines.length * 4 + 8, "F");
      setText(doc, PDF_COLORS.text);
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
      addText(`•  ${habito}`, 5);
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
