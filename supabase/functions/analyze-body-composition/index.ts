import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  getCorsHeaders, 
  handleCorsPreflightRequest, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/cors.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const { photos, clientData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[ANALYZE-BODY] Starting body composition analysis");

    // Build the content array with text and images
    const content: unknown[] = [
      {
        type: "text",
        text: `Você é um especialista em avaliação física e composição corporal. Analise as 3 fotos corporais enviadas (frente, lado e costas) e forneça uma avaliação física completa baseada no que você pode observar visualmente.

DADOS DO CLIENTE:
- Nome: ${clientData.name || "Cliente"}
- Idade: ${clientData.age || "Não informada"} anos
- Peso: ${clientData.weight || "Não informado"} kg
- Altura: ${clientData.height || "Não informada"} cm
- Sexo: ${clientData.sex || "Não informado"}
- Objetivo: ${clientData.goal || "Não informado"}

INSTRUÇÕES:
1. Analise VISUALMENTE a composição corporal em cada ângulo
2. Identifique o biotipo corporal (ectomorfo, mesomorfo, endomorfo ou misto)
3. Avalie a distribuição de gordura corporal
4. Avalie a simetria muscular e pontos fortes/fracos
5. Analise a postura observando alinhamento da coluna, ombros, quadril
6. Estime percentual de gordura corporal baseado na aparência visual (faixa aproximada)
7. Identifique grupos musculares que precisam de mais desenvolvimento
8. Seja realista mas motivador

RESPONDA EXATAMENTE NESTE FORMATO JSON:
{
  "resumoGeral": "Parágrafo com visão geral da avaliação",
  "biotipo": {
    "tipo": "ectomorfo | mesomorfo | endomorfo | ecto-mesomorfo | endo-mesomorfo",
    "descricao": "Breve explicação do biotipo identificado"
  },
  "composicaoCorporal": {
    "percentualGorduraEstimado": "XX-XX%",
    "classificacao": "Muito baixo | Baixo | Normal | Moderado | Alto",
    "distribuicaoGordura": "Onde a gordura se concentra mais (abdominal, quadril, generalizada, etc)",
    "massaMuscular": "Baixa | Moderada | Boa | Excelente"
  },
  "analisePostural": {
    "cabeca": "Alinhada | Anteriorizada | Inclinada",
    "ombros": "Alinhados | Protraídos | Elevados | Assimétricos",
    "coluna": "Normal | Lordose | Cifose | Escoliose leve | Retificada",
    "quadril": "Alinhado | Anterovertido | Retrovertido | Assimétrico",
    "joelhos": "Alinhados | Valgo | Varo",
    "observacoes": "Comentários adicionais sobre a postura"
  },
  "analiseFrente": {
    "pontosFortePrincipais": ["músculo1", "músculo2"],
    "areasDesenvolver": ["área1", "área2"],
    "simetria": "Boa | Regular | Precisa atenção",
    "observacoes": "Comentário específico da visão frontal"
  },
  "analiseLado": {
    "posturaGeral": "Boa | Regular | Precisa correção",
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

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem blocos de código, sem texto adicional.`
      }
    ];

    // Add photos
    if (photos.frente) {
      content.push({
        type: "text",
        text: "FOTO CORPORAL - FRENTE:"
      });
      content.push({
        type: "image_url",
        image_url: { url: photos.frente }
      });
    }

    if (photos.lado) {
      content.push({
        type: "text",
        text: "FOTO CORPORAL - LADO:"
      });
      content.push({
        type: "image_url",
        image_url: { url: photos.lado }
      });
    }

    if (photos.costas) {
      content.push({
        type: "text",
        text: "FOTO CORPORAL - COSTAS:"
      });
      content.push({
        type: "image_url",
        image_url: { url: photos.costas }
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "user", 
            content: content
          }
        ],
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
    
    console.log("[ANALYZE-BODY] Raw response received");

    // Try to parse JSON from response
    let analysis;
    try {
      // Remove possible markdown code blocks
      const cleanedContent = rawContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("[ANALYZE-BODY] Failed to parse JSON:", parseError);
      // Return a structured fallback
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
