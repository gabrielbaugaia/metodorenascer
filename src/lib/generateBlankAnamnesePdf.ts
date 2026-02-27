import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function generateBlankAnamnesePdf(clientName?: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const addHeader = () => {
    doc.setFillColor(255, 69, 0);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MÉTODO RENASCER", margin, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Ficha de Anamnese", margin, 25);
    yPos = 42;
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

  const addBlankField = (label: string, lineWidth: number = contentWidth - 50) => {
    checkNewPage(10);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label + ":", margin, yPos);

    const lineX = margin + 50;
    doc.setDrawColor(180, 180, 180);
    doc.line(lineX, yPos, lineX + lineWidth, yPos);
    yPos += 8;
  };

  const addBlankTextArea = (label: string, lines: number = 3) => {
    checkNewPage(10 + lines * 7);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label + ":", margin, yPos);
    yPos += 4;

    doc.setDrawColor(180, 180, 180);
    for (let i = 0; i < lines; i++) {
      yPos += 7;
      doc.line(margin, yPos, margin + contentWidth, yPos);
    }
    yPos += 6;
  };

  const addCheckboxField = (label: string, options: string[]) => {
    checkNewPage(10);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label + ":", margin, yPos);

    let xPos = margin + 50;
    options.forEach((opt) => {
      doc.rect(xPos, yPos - 3, 3, 3);
      doc.text(opt, xPos + 5, yPos);
      xPos += doc.getTextWidth(opt) + 12;
    });
    yPos += 8;
  };

  // Build PDF
  addHeader();

  // Client name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Cliente: ${clientName || ""}`, margin, yPos);
  if (!clientName) {
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + 25, yPos, margin + contentWidth, yPos);
  }
  yPos += 5;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, margin, yPos);
  yPos += 10;

  // Dados Pessoais
  addSectionTitle("Dados Pessoais");
  addBlankField("Nome Completo");
  addBlankField("E-mail");
  addBlankField("Telefone / WhatsApp");
  addBlankField("Data de Nascimento");
  addCheckboxField("Sexo", ["Masculino", "Feminino"]);
  addBlankField("Peso (kg)");
  addBlankField("Altura (cm)");

  // Objetivos
  addSectionTitle("Objetivo e Metas");
  addCheckboxField("Objetivo Principal", ["Emagrecimento", "Hipertrofia", "Saúde", "Condicionamento"]);
  addBlankTextArea("Metas Detalhadas", 2);

  // Histórico de Treino
  addSectionTitle("Histórico de Treino");
  addCheckboxField("Já treinou antes?", ["Sim", "Não"]);
  addCheckboxField("Nível de Condicionamento", ["Sedentário", "Iniciante", "Intermediário", "Avançado"]);
  addCheckboxField("Local de Treino", ["Academia", "Casa", "Ar livre"]);
  addBlankField("Dias Disponíveis p/ Treino");
  addCheckboxField("Pratica Aeróbica?", ["Sim", "Não"]);
  addCheckboxField("Sobe escada sem cansar?", ["Sim", "Não", "Com dificuldade"]);

  // Rotina
  addSectionTitle("Rotina");
  addBlankField("Horário de Treino");
  addBlankField("Horário que Acorda");
  addBlankField("Horário que Dorme");

  // Saúde
  addSectionTitle("Saúde");
  addBlankTextArea("Condições de Saúde / Doenças", 2);
  addCheckboxField("Toma Medicamentos?", ["Sim", "Não"]);
  addBlankTextArea("Quais Medicamentos?", 1);
  addBlankTextArea("Lesões / Restrições", 2);

  // Alimentação
  addSectionTitle("Alimentação");
  addCheckboxField("Refeições por Dia", ["2-3", "4-5", "6+"]);
  addCheckboxField("Bebe Água Frequente?", ["Sim", "Não"]);
  addBlankTextArea("Restrições Alimentares", 2);

  // Estilo de Vida
  addSectionTitle("Estilo de Vida");
  addCheckboxField("Qualidade do Sono", ["Boa", "Regular", "Ruim"]);
  addCheckboxField("Nível de Estresse", ["Baixo", "Moderado", "Alto"]);
  addCheckboxField("Consome Álcool?", ["Nunca", "Raramente", "Frequentemente"]);
  addCheckboxField("Fuma?", ["Nunca", "Raramente", "Frequentemente"]);

  // Observações
  addSectionTitle("Observações Adicionais");
  addBlankTextArea("", 5);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} — Método Renascer`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  const fileName = clientName
    ? `anamnese_branco_${clientName.replace(/\s+/g, "_").toLowerCase()}.pdf`
    : `anamnese_branco_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
