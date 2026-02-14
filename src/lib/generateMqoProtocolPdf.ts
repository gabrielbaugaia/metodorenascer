import jsPDF from "jspdf";

interface Protocol {
  type: string;
  title: string;
  content: any;
  audit_result?: any;
}

export function generateMqoProtocolPdf(protocols: Protocol[], clientName: string, includeAudit: boolean = false) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const addHeader = () => {
    // Black header bar
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 25, "F");

    // Yellow accent line
    doc.setFillColor(255, 196, 0);
    doc.rect(0, 25, pageWidth, 2, "F");

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("MQO — Metodologia de Qualificação Operacional", margin, 16);

    // Reset
    doc.setTextColor(0, 0, 0);
  };

  const addFooter = (pageNum: number) => {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Documento técnico gerado pelo sistema MQO | Uso profissional — confidencial",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
    doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  const addSectionTitle = (title: string, y: number): number => {
    doc.setFillColor(255, 196, 0);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), margin + 3, y + 5.5);
    return y + 12;
  };

  const addDivider = (y: number): number => {
    doc.setDrawColor(255, 196, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 4;
  };

  let pageNum = 1;
  let y = 0;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      addFooter(pageNum);
      doc.addPage();
      pageNum++;
      addHeader();
      y = 32;
    }
  };

  // Cover page
  addHeader();
  addFooter(pageNum);

  y = 60;
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PRESCRIÇÃO TÉCNICA", pageWidth / 2, y, { align: "center" });

  y += 15;
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text(clientName, pageWidth / 2, y, { align: "center" });

  y += 10;
  doc.setFillColor(255, 196, 0);
  doc.rect(pageWidth / 2 - 20, y, 40, 1, "F");

  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(new Date().toLocaleDateString("pt-BR"), pageWidth / 2, y, { align: "center" });

  // Protocol pages
  protocols.forEach((protocol) => {
    doc.addPage();
    pageNum++;
    addHeader();
    addFooter(pageNum);
    y = 32;

    // Protocol title
    y = addSectionTitle(protocol.title, y);
    y += 2;

    // Render content as formatted text
    const content = typeof protocol.content === "string"
      ? protocol.content
      : JSON.stringify(protocol.content, null, 2);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    const lines = doc.splitTextToSize(content, contentWidth);

    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 5;
    }

    // Audit section for this protocol (admin only)
    if (includeAudit && protocol.audit_result) {
      y += 5;
      checkPageBreak(60);
      y = addSectionTitle("AUDITORIA INTERNA DE QUALIDADE", y);

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

      doc.setFontSize(9);
      for (const [key, label] of Object.entries(criteriaLabels)) {
        checkPageBreak(6);
        const passed = protocol.audit_result[key] === true;
        doc.setTextColor(passed ? 34 : 220, passed ? 139 : 38, passed ? 34 : 38);
        doc.text(`${passed ? "✅" : "❌"} ${label}`, margin, y);
        y += 5;
      }

      y += 3;
      checkPageBreak(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`Score: ${protocol.audit_result.final_score || 0}/100 — ${protocol.audit_result.classification || "N/A"}`, margin, y);
      doc.setFont("helvetica", "normal");
      y += 8;
    }
  });

  // Final footer
  addFooter(pageNum);

  doc.save(`MQO_${clientName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}
