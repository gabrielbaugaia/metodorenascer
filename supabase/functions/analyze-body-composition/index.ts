import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  getCorsHeaders, 
  handleCorsPreflightRequest, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/cors.ts";

const buildPrompt = (clientData: Record<string, string>) => `Você é um especialista em avaliação física, composição corporal e análise postural clínica. Analise as 3 fotos corporais enviadas (frente, lado e costas) e forneça uma avaliação TÉCNICA completa.

DADOS DO CLIENTE:
- Nome: ${clientData.name || "Cliente"}
- Idade: ${clientData.age || "Não informada"} anos
- Peso: ${clientData.weight || "Não informado"} kg
- Altura: ${clientData.height || "Não informada"} cm
- Sexo: ${clientData.sex || "Não informado"}
- Objetivo: ${clientData.goal || "Não informado"}

INSTRUÇÕES OBRIGATÓRIAS — SIGA TODAS SEM EXCEÇÃO:

1. PERCENTUAL DE GORDURA (OBRIGATÓRIO):
   Estime o percentual de gordura corporal com base em REFERÊNCIAS VISUAIS:
   - Visibilidade de pregas cutâneas (abdominal, subescapular, tricipital)
   - Definição do serrátil anterior e oblíquos
   - Separação muscular visível (deltoides/bíceps, quadríceps)
   - Grau de vascularização superficial
   - Acúmulo de gordura em região abdominal, lombar, quadril
   Forneça SEMPRE uma faixa numérica (ex: "18-22%") e NUNCA deixe em branco.

2. ESCALA VISUAL DE GORDURA (OBRIGATÓRIO):
   No campo "escalaVisualGordura", descreva tecnicamente os marcadores visuais que justificam a estimativa.
   Exemplo: "Pregas abdominais visíveis na região infraumbilical, sem definição de serrátil, vascularização ausente nos membros superiores — compatível com 20-24%"

3. ANÁLISE POSTURAL TÉCNICA (OBRIGATÓRIO — preencha TODOS os campos):
   - Cabeça: anteriorização, inclinação lateral, rotação
   - Ombros: protrusão anterior (grau leve/moderado/severo), elevação unilateral, rotação interna dos úmeros, assimetria escapular
   - Coluna: lordose lombar (acentuada/normal/retificada), cifose torácica (acentuada/normal/retificada), retificação cervical, escoliose aparente (convexidade D/E)
   - Quadril: anteversão/retroversão pélvica, desnivelamento ilíaco, rotação pélvica
   - Joelhos: valgo/varo (grau leve/moderado/severo), hiperextensão, rotação tibial
   - Tornozelos: pronação/supinação dos pés, desabamento do arco plantar medial
   Cada campo deve conter descrição técnica curta e grau quando aplicável.

4. REGRA ABSOLUTA: NUNCA omita nenhum campo do JSON. Todos são OBRIGATÓRIOS. Se não for possível avaliar com precisão, escreva "Não avaliável neste ângulo" mas NUNCA deixe vazio ou null.

RESPONDA EXATAMENTE NESTE FORMATO JSON:
{
  "resumoGeral": "Parágrafo com visão geral técnica da avaliação",
  "biotipo": {
    "tipo": "ectomorfo | mesomorfo | endomorfo | ecto-mesomorfo | endo-mesomorfo",
    "descricao": "Explicação do biotipo identificado com base nas proporções observadas"
  },
  "composicaoCorporal": {
    "percentualGorduraEstimado": "XX-XX%",
    "escalaVisualGordura": "Descrição técnica dos marcadores visuais que justificam a estimativa de gordura",
    "classificacao": "Muito baixo | Baixo | Normal | Moderado | Alto",
    "distribuicaoGordura": "Padrão de distribuição (androide/ginoide/misto) e regiões predominantes",
    "massaMuscular": "Baixa | Moderada | Boa | Excelente"
  },
  "analisePostural": {
    "cabeca": "Descrição técnica do posicionamento cervical e craniano",
    "ombros": "Protrusão, elevação, rotação interna, assimetria — com grau (leve/moderado/severo)",
    "coluna": "Lordose lombar, cifose torácica, retificação cervical, escoliose — com detalhamento",
    "quadril": "Anteversão/retroversão pélvica, desnivelamento ilíaco — com grau",
    "joelhos": "Valgo/varo, hiperextensão, rotação tibial — com grau (leve/moderado/severo)",
    "tornozelos": "Pronação/supinação dos pés, arco plantar — com observações",
    "observacoes": "Síntese postural e correlações entre desvios observados"
  },
  "analiseFrente": {
    "pontosFortePrincipais": ["músculo1", "músculo2"],
    "areasDesenvolver": ["área1", "área2"],
    "simetria": "Boa | Regular | Precisa atenção — com detalhes",
    "observacoes": "Comentário específico da visão frontal"
  },
  "analiseLado": {
    "posturaGeral": "Boa | Regular | Precisa correção — com detalhes",
    "desenvolvimentoPeitoral": "Pouco | Moderado | Bom | Excelente",
    "desenvolvimentoCostas": "Pouco | Moderado | Bom | Excelente",
    "abdomen": "Definido | Plano | Levemente protuberante | Protuberante",
    "observacoes": "Comentário específico da visão lateral"
  },
  "analiseCostas": {
    "larguraCostas": "Estreita | Média | Larga",
    "desenvolvimentoDorsais": "Pouco | Moderado | Bom | Excelente",
    "trapezio": "Pouco | Moderado | Bom | Excelente",
    "simetriaLombar": "Boa | Regular | Assimétrica",
    "observacoes": "Comentário específico da visão posterior"
  },
  "gruposMuscularesDestaque": {
    "pontosFortes": ["músculo1", "músculo2", "músculo3"],
    "pontosFracos": ["músculo1", "músculo2", "músculo3"]
  },
  "recomendacoes": {
    "treino": ["recomendação1", "recomendação2", "recomendação3"],
    "postura": ["recomendação postural 1", "recomendação postural 2"],
    "prioridades": ["prioridade1", "prioridade2"]
  },
  "mensagemMotivacional": "Mensagem personalizada de incentivo baseada no objetivo do cliente"
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem blocos de código, sem texto adicional.`;

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const { photos, clientData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[ANALYZE-BODY] Starting body composition analysis with gemini-2.5-pro");

    const content: unknown[] = [
      { type: "text", text: buildPrompt(clientData) }
    ];

    // Add photos
    const photoTypes = [
      { key: "frente", label: "FRENTE" },
      { key: "lado", label: "LADO" },
      { key: "costas", label: "COSTAS" },
    ];

    for (const { key, label } of photoTypes) {
      if (photos[key]) {
        content.push(
          { type: "text", text: `FOTO CORPORAL - ${label}:` },
          { type: "image_url", image_url: { url: photos[key] } }
        );
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANALYZE-BODY] AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return createErrorResponse(req, "Limite de requisições excedido. Tente novamente em alguns instantes.", 429);
      }
      if (response.status === 402) {
        return createErrorResponse(req, "Créditos insuficientes. Entre em contato com o suporte.", 402);
      }
      
      return createErrorResponse(req, "Erro no serviço de IA");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    console.log("[ANALYZE-BODY] Raw response received, parsing...");

    let analysis;
    try {
      const cleanedContent = rawContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("[ANALYZE-BODY] Failed to parse JSON:", parseError);
      analysis = {
        resumoGeral: rawContent || "Análise não disponível no momento.",
        error: "Formato de resposta inesperado"
      };
    }

    console.log("[ANALYZE-BODY] Analysis completed successfully");

    return createSuccessResponse(req, { analysis });
  } catch (error) {
    console.error("[ANALYZE-BODY] Error:", error);
    return createErrorResponse(req, "Erro ao processar análise corporal. Tente novamente.");
  }
});
