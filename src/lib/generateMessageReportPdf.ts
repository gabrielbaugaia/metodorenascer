import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageMetric {
  message_id: string;
  message_title: string;
  trigger_type: string;
  is_custom: boolean;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

interface Totals {
  sent: number;
  opened: number;
  clicked: number;
}

interface Bottleneck {
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
}

function identifyBottlenecks(
  metrics: MessageMetric[],
  totals: Totals
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];
  const overallOpenRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
  const overallClickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;

  // Check overall metrics
  if (totals.sent === 0) {
    bottlenecks.push({
      type: "critical",
      title: "Nenhuma mensagem enviada",
      description: "O sistema não enviou nenhuma mensagem automática ainda.",
      recommendation: "Ative pelo menos uma mensagem automática e configure os gatilhos adequados.",
    });
  }

  if (overallOpenRate < 20 && totals.sent > 10) {
    bottlenecks.push({
      type: "critical",
      title: "Taxa de abertura crítica",
      description: `A taxa geral de abertura está em ${overallOpenRate.toFixed(1)}%, muito abaixo do ideal (20-30%).`,
      recommendation: "Revise os títulos das mensagens para torná-los mais atrativos e personalizados. Use o nome do cliente e crie urgência.",
    });
  } else if (overallOpenRate < 30 && totals.sent > 10) {
    bottlenecks.push({
      type: "warning",
      title: "Taxa de abertura abaixo do ideal",
      description: `A taxa geral de abertura está em ${overallOpenRate.toFixed(1)}%.`,
      recommendation: "Teste diferentes horários de envio e personalize mais os títulos das mensagens.",
    });
  }

  if (overallClickRate < 5 && totals.opened > 10) {
    bottlenecks.push({
      type: "critical",
      title: "Taxa de cliques muito baixa",
      description: `Apenas ${overallClickRate.toFixed(1)}% das pessoas que abrem as mensagens clicam nos links.`,
      recommendation: "Melhore as CTAs (chamadas para ação), use botões mais visíveis e crie ofertas mais relevantes.",
    });
  } else if (overallClickRate < 15 && totals.opened > 10) {
    bottlenecks.push({
      type: "warning",
      title: "Taxa de cliques pode melhorar",
      description: `A taxa de cliques está em ${overallClickRate.toFixed(1)}%.`,
      recommendation: "Teste diferentes posicionamentos de links e CTAs mais diretas.",
    });
  }

  // Check individual messages
  const lowPerformers = metrics.filter(
    (m) => m.total_sent > 5 && m.open_rate < 10
  );
  if (lowPerformers.length > 0) {
    bottlenecks.push({
      type: "warning",
      title: `${lowPerformers.length} mensagem(ns) com baixo desempenho`,
      description: `As mensagens "${lowPerformers.map((m) => m.message_title).join(", ")}" têm taxa de abertura abaixo de 10%.`,
      recommendation: "Considere reescrever essas mensagens ou desativá-las temporariamente.",
    });
  }

  const inactiveMessages = metrics.filter((m) => m.total_sent === 0);
  if (inactiveMessages.length > 0) {
    bottlenecks.push({
      type: "info",
      title: `${inactiveMessages.length} mensagem(ns) sem envios`,
      description: `As mensagens "${inactiveMessages.map((m) => m.message_title).join(", ")}" nunca foram disparadas.`,
      recommendation: "Verifique se os gatilhos estão configurados corretamente ou se há clientes que se enquadram nos critérios.",
    });
  }

  // Best practices
  const customMessages = metrics.filter((m) => m.is_custom);
  if (customMessages.length === 0) {
    bottlenecks.push({
      type: "info",
      title: "Sem mensagens personalizadas",
      description: "Você está usando apenas mensagens padrão do sistema.",
      recommendation: "Crie mensagens personalizadas para campanhas específicas e segmentação de público.",
    });
  }

  // Positive feedback
  if (bottlenecks.length === 0 && totals.sent > 10) {
    bottlenecks.push({
      type: "info",
      title: "Excelente desempenho!",
      description: "Suas métricas de mensagens estão dentro do esperado.",
      recommendation: "Continue monitorando e teste novos formatos para melhorar ainda mais.",
    });
  }

  return bottlenecks;
}

export async function generateMessageReportPdf(
  metrics: MessageMetric[],
  totals: Totals
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const overallOpenRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
  const overallClickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;
  const bottlenecks = identifyBottlenecks(metrics, totals);

  // Header
  doc.setFillColor(255, 107, 53); // Primary orange
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Mensagens Automáticas", margin, 25);

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
  const boxHeight = 25;

  // Box 1 - Total Enviadas
  doc.setFillColor(59, 130, 246); // Blue
  doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(String(totals.sent), margin + boxWidth / 2, y + 10, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Enviadas", margin + boxWidth / 2, y + 18, { align: "center" });

  // Box 2 - Abertas
  doc.setFillColor(34, 197, 94); // Green
  doc.roundedRect(margin + boxWidth + 5, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(String(totals.opened), margin + boxWidth + 5 + boxWidth / 2, y + 10, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Abertas", margin + boxWidth + 5 + boxWidth / 2, y + 18, { align: "center" });

  // Box 3 - Clicadas
  doc.setFillColor(168, 85, 247); // Purple
  doc.roundedRect(margin + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(String(totals.clicked), margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 10, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Clicadas", margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 18, { align: "center" });

  // Box 4 - Taxa Abertura
  doc.setFillColor(249, 115, 22); // Orange
  doc.roundedRect(margin + (boxWidth + 5) * 3, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${overallOpenRate.toFixed(1)}%`, margin + (boxWidth + 5) * 3 + boxWidth / 2, y + 10, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Taxa Abertura", margin + (boxWidth + 5) * 3 + boxWidth / 2, y + 18, { align: "center" });

  y += boxHeight + 20;

  // Bottlenecks Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Análise de Gargalos e Recomendações", margin, y);
  y += 10;

  bottlenecks.forEach((bottleneck) => {
    // Check page break
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Bottleneck card
    let bgColor: [number, number, number];
    let borderColor: [number, number, number];
    switch (bottleneck.type) {
      case "critical":
        bgColor = [254, 226, 226]; // Red light
        borderColor = [239, 68, 68]; // Red
        break;
      case "warning":
        bgColor = [254, 243, 199]; // Yellow light
        borderColor = [245, 158, 11]; // Yellow
        break;
      default:
        bgColor = [219, 234, 254]; // Blue light
        borderColor = [59, 130, 246]; // Blue
    }

    doc.setFillColor(...bgColor);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, contentWidth, 35, 2, 2, "FD");

    // Type badge
    doc.setFillColor(...borderColor);
    const badgeText = bottleneck.type === "critical" ? "CRÍTICO" : bottleneck.type === "warning" ? "ATENÇÃO" : "INFO";
    doc.roundedRect(margin + 5, y + 4, 25, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(badgeText, margin + 17.5, y + 8.5, { align: "center" });

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(bottleneck.title, margin + 35, y + 9);

    // Description
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(bottleneck.description, contentWidth - 15);
    doc.text(descLines, margin + 5, y + 17);

    // Recommendation
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(55, 65, 81);
    const recLines = doc.splitTextToSize(`💡 ${bottleneck.recommendation}`, contentWidth - 15);
    doc.text(recLines, margin + 5, y + 27);

    y += 42;
  });

  // Messages Detail Section
  if (metrics.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento por Mensagem", margin, y);
    y += 12;

    // Table header
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text("Mensagem", margin + 3, y + 5.5);
    doc.text("Enviadas", margin + 90, y + 5.5);
    doc.text("Abertura", margin + 115, y + 5.5);
    doc.text("Cliques", margin + 140, y + 5.5);
    doc.text("Status", margin + 160, y + 5.5);
    y += 10;

    metrics.forEach((metric, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 2, contentWidth, 10, "F");
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Truncate title if too long
      const title = metric.message_title.length > 40
        ? metric.message_title.substring(0, 37) + "..."
        : metric.message_title;
      doc.text(title, margin + 3, y + 4);
      doc.text(String(metric.total_sent), margin + 90, y + 4);
      doc.text(`${metric.open_rate}%`, margin + 115, y + 4);
      doc.text(`${metric.click_rate}%`, margin + 140, y + 4);

      // Status indicator
      let status: string;
      let statusColor: [number, number, number];
      if (metric.total_sent === 0) {
        status = "Inativa";
        statusColor = [156, 163, 175];
      } else if (metric.open_rate >= 25) {
        status = "Ótimo";
        statusColor = [34, 197, 94];
      } else if (metric.open_rate >= 15) {
        status = "Bom";
        statusColor = [59, 130, 246];
      } else if (metric.open_rate >= 10) {
        status = "Regular";
        statusColor = [245, 158, 11];
      } else {
        status = "Revisar";
        statusColor = [239, 68, 68];
      }

      doc.setTextColor(...statusColor);
      doc.setFont("helvetica", "bold");
      doc.text(status, margin + 160, y + 4);

      y += 10;
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
      `Página ${i} de ${totalPages} | Método Renascer - Relatório de Mensagens`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `relatorio-mensagens-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
