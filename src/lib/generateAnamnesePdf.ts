import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  sexo: string | null;
  data_nascimento: string | null;
  goals: string | null;
  injuries: string | null;
  availability: string | null;
  nivel_experiencia: string | null;
  restricoes_medicas: string | null;
  objetivos_detalhados: any;
  medidas: any;
  telefone: string | null;
  whatsapp: string | null;
  objetivo_principal: string | null;
  ja_treinou_antes: boolean | null;
  local_treino: string | null;
  dias_disponiveis: string | null;
  nivel_condicionamento: string | null;
  pratica_aerobica: boolean | null;
  escada_sem_cansar: string | null;
  condicoes_saude: string | null;
  toma_medicamentos: boolean | null;
  refeicoes_por_dia: string | null;
  bebe_agua_frequente: boolean | null;
  restricoes_alimentares: string | null;
  qualidade_sono: string | null;
  nivel_estresse: string | null;
  consome_alcool: string | null;
  fuma: string | null;
  observacoes_adicionais: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

interface SignedPhotos {
  frente: string | null;
  lado: string | null;
  costas: string | null;
}

export async function generateAnamnesePdf(
  profile: Profile,
  signedPhotos: SignedPhotos
): Promise<void> {
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
    doc.text("Anamnese do Cliente - Gabriel Baú", margin, 25);
    yPos = 42;
  };

  const addTitle = (title: string, date: string | null) => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    if (date) {
      doc.text(
        `Preenchida em ${format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        margin,
        yPos
      );
    }
    yPos += 4;
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      margin,
      yPos
    );
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

  const addTextBlock = (label: string, value: string | null | undefined) => {
    if (!value) return;
    checkNewPage(15);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label + ":", margin, yPos);
    yPos += 4;
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4 + 4;
  };

  // Add image from URL with robust error handling
  const addImageFromUrl = async (url: string, label: string, width: number = 50) => {
    checkNewPage(80);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPos);
    yPos += 4;

    try {
      console.log(`[PDF] Attempting to load image: ${label}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`[PDF] Failed to fetch ${label}: HTTP ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("image/")) {
        console.warn(`[PDF] Invalid content type for ${label}: ${contentType}`);
        throw new Error(`Invalid content type: ${contentType}`);
      }
      
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(blob);
      });
      
      const aspectRatio = 3 / 4;
      const height = width / aspectRatio;
      doc.addImage(base64, "JPEG", margin, yPos, width, height);
      yPos += height + 5;
      console.log(`[PDF] Successfully added ${label}`);
    } catch (error) {
      console.warn(`[PDF] Could not load ${label}:`, error);
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("(Imagem não disponível - formato não suportado ou erro de carregamento)", margin, yPos);
      yPos += 10;
    }
  };

  // Build the PDF
  addHeader();
  addTitle(`Anamnese de ${profile.full_name}`, profile.updated_at || profile.created_at);

  // Dados Pessoais
  addSectionTitle("Dados Pessoais");
  addField("Nome Completo", profile.full_name);
  addField("E-mail", profile.email);
  addField("Telefone", profile.telefone);
  addField("WhatsApp", profile.whatsapp);
  addField("Data de Nascimento", profile.data_nascimento ? format(new Date(profile.data_nascimento), "dd/MM/yyyy", { locale: ptBR }) : null);
  addField("Idade", profile.age ? `${profile.age} anos` : null);
  addField("Sexo", profile.sexo);
  addField("Peso", profile.weight ? `${profile.weight} kg` : null);
  addField("Altura", profile.height ? `${profile.height} cm` : null);

  // Objetivo
  addSectionTitle("Objetivo e Metas");
  addField("Objetivo Principal", profile.objetivo_principal);
  addTextBlock("Metas Detalhadas", profile.goals);
  
  if (profile.objetivos_detalhados) {
    const objetivos = typeof profile.objetivos_detalhados === 'string' 
      ? JSON.parse(profile.objetivos_detalhados) 
      : profile.objetivos_detalhados;
    if (objetivos && typeof objetivos === 'object') {
      Object.entries(objetivos).forEach(([key, value]) => {
        if (value) addField(key, String(value));
      });
    }
  }

  // Histórico de Treino
  addSectionTitle("Histórico de Treino");
  addField("Já treinou antes", profile.ja_treinou_antes);
  addField("Nível de Experiência", profile.nivel_experiencia);
  addField("Nível de Condicionamento", profile.nivel_condicionamento);
  addField("Local de Treino", profile.local_treino);
  addField("Dias Disponíveis", profile.dias_disponiveis);
  addField("Disponibilidade", profile.availability);
  addField("Pratica Aeróbica", profile.pratica_aerobica);
  addField("Sobe escada sem cansar", profile.escada_sem_cansar);

  // Saúde
  addSectionTitle("Saúde");
  addTextBlock("Condições de Saúde", profile.condicoes_saude);
  addField("Toma Medicamentos", profile.toma_medicamentos);
  addTextBlock("Restrições Médicas", profile.restricoes_medicas);
  addTextBlock("Lesões", profile.injuries);

  // Alimentação
  addSectionTitle("Alimentação");
  addField("Refeições por Dia", profile.refeicoes_por_dia);
  addField("Bebe Água Frequente", profile.bebe_agua_frequente);
  addTextBlock("Restrições Alimentares", profile.restricoes_alimentares);

  // Estilo de Vida
  addSectionTitle("Estilo de Vida");
  addField("Qualidade do Sono", profile.qualidade_sono);
  addField("Nível de Estresse", profile.nivel_estresse);
  addField("Consome Álcool", profile.consome_alcool);
  addField("Fuma", profile.fuma);

  // Medidas
  if (profile.medidas) {
    addSectionTitle("Medidas Corporais");
    const medidas = typeof profile.medidas === 'string' 
      ? JSON.parse(profile.medidas) 
      : profile.medidas;
    if (medidas && typeof medidas === 'object') {
      Object.entries(medidas).forEach(([key, value]) => {
        if (value) addField(key, `${value} cm`);
      });
    }
  }

  // Observações
  if (profile.observacoes_adicionais) {
    addSectionTitle("Observações Adicionais");
    addTextBlock("", profile.observacoes_adicionais);
  }

  // Fotos Corporais
  const hasPhotos = signedPhotos.frente || signedPhotos.lado || signedPhotos.costas;
  if (hasPhotos) {
    doc.addPage();
    yPos = 20;
    addSectionTitle("Fotos Corporais");
    
    const photoWidth = 55;
    let xPos = margin;
    
    if (signedPhotos.frente) {
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Frente", xPos + 20, yPos);
    }
    if (signedPhotos.lado) {
      doc.text("Lado", xPos + photoWidth + 10 + 20, yPos);
    }
    if (signedPhotos.costas) {
      doc.text("Costas", xPos + (photoWidth + 10) * 2 + 20, yPos);
    }
    yPos += 5;

    const aspectRatio = 3 / 4;
    const photoHeight = photoWidth / aspectRatio;

    const loadImage = async (url: string): Promise<string | null> => {
      try {
        console.log(`[PDF] Loading photo from: ${url.substring(0, 50)}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`[PDF] HTTP error loading photo: ${response.status}`);
          return null;
        }
        
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null as unknown as string);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn(`[PDF] Error loading photo:`, error);
        return null;
      }
    };

    const [frenteBase64, ladoBase64, costasBase64] = await Promise.all([
      signedPhotos.frente ? loadImage(signedPhotos.frente) : Promise.resolve(null),
      signedPhotos.lado ? loadImage(signedPhotos.lado) : Promise.resolve(null),
      signedPhotos.costas ? loadImage(signedPhotos.costas) : Promise.resolve(null),
    ]);

    xPos = margin;
    if (frenteBase64) {
      doc.addImage(frenteBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
      xPos += photoWidth + 10;
    }
    if (ladoBase64) {
      doc.addImage(ladoBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
      xPos += photoWidth + 10;
    }
    if (costasBase64) {
      doc.addImage(costasBase64, "JPEG", xPos, yPos, photoWidth, photoHeight);
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
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `anamnese_${profile.full_name.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
