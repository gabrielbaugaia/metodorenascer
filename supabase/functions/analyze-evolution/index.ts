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
    const { 
      anamnesePhotos, 
      evolutionPhotos, 
      clientData 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[ANALYZE-EVOLUTION] Starting comparative analysis");

    // Build the content array with text and images
    const content: unknown[] = [
      {
        type: "text",
        text: `Você é Gabriel Baú, mentor fitness do Método Renascer, especialista em composição corporal e prescrição de treinos e dietas personalizadas. 

Analise VISUALMENTE as fotos ANTES (anamnese/inicial) e DEPOIS (evolução/atual) do cliente e gere uma análise comparativa completa com recomendações específicas para ajustes no treino e na dieta.

DADOS DO CLIENTE:
- Nome: ${clientData.name || "Cliente"}
- Peso inicial: ${clientData.initialWeight || "Não informado"} kg
- Peso atual: ${clientData.currentWeight || "Não informado"} kg
- Variação de peso: ${clientData.initialWeight && clientData.currentWeight ? `${(clientData.currentWeight - clientData.initialWeight).toFixed(1)} kg` : "Não calculável"}
- Observações do cliente: ${clientData.notes || "Nenhuma"}

INSTRUÇÕES DE ANÁLISE:
1. Compare VISUALMENTE cada ângulo (frente, lado, costas) entre ANTES e DEPOIS
2. Identifique mudanças na composição corporal (gordura, músculo)
3. Avalie mudanças posturais
4. Identifique áreas que melhoraram e áreas que precisam mais atenção
5. Baseado nas mudanças observadas, sugira ajustes específicos no treino
6. Baseado nas mudanças observadas, sugira ajustes específicos na dieta
7. Seja motivador mas realista

RESPONDA EXATAMENTE NESTE FORMATO JSON:
{
  "resumoGeral": "Parágrafo resumindo a evolução geral do cliente",
  "mudancasObservadas": {
    "composicaoCorporal": {
      "gorduraCorporal": "aumentou | diminuiu | manteve",
      "descricaoGordura": "Descrição da mudança na gordura",
      "massaMuscular": "aumentou | diminuiu | manteve", 
      "descricaoMuscular": "Descrição da mudança na massa muscular",
      "definicaoGeral": "melhorou | piorou | manteve"
    },
    "frente": {
      "mudancasPositivas": ["mudança 1", "mudança 2"],
      "areasAtencao": ["área 1", "área 2"],
      "observacoes": "comentário específico"
    },
    "lado": {
      "mudancasPositivas": ["mudança 1", "mudança 2"],
      "areasAtencao": ["área 1", "área 2"],
      "observacoes": "comentário específico"
    },
    "costas": {
      "mudancasPositivas": ["mudança 1", "mudança 2"],
      "areasAtencao": ["área 1", "área 2"],
      "observacoes": "comentário específico"
    },
    "postura": {
      "mudou": true ou false,
      "descricao": "descrição das mudanças posturais se houver"
    }
  },
  "analisePeso": {
    "variacao": "${clientData.initialWeight && clientData.currentWeight ? (clientData.currentWeight - clientData.initialWeight).toFixed(1) : 0} kg",
    "interpretacao": "Interpretação da mudança de peso considerando as fotos (ex: ganho de músculo vs gordura)",
    "tendencia": "positiva | neutra | negativa"
  },
  "ajustesTreino": {
    "manutencao": ["exercício/grupo muscular para manter a ênfase"],
    "intensificar": ["área/exercício para intensificar", "justificativa"],
    "adicionar": ["novo foco de treino sugerido"],
    "observacoes": "comentário geral sobre ajustes no treino"
  },
  "ajustesDieta": {
    "calorias": "aumentar | manter | reduzir",
    "proteina": "aumentar | manter | reduzir",
    "carboidratos": "aumentar | manter | reduzir (especificar timing se relevante)",
    "sugestoes": ["sugestão específica 1", "sugestão específica 2"],
    "observacoes": "comentário geral sobre ajustes na dieta"
  },
  "metasProximos30Dias": [
    "Meta específica 1",
    "Meta específica 2", 
    "Meta específica 3"
  ],
  "pontuacaoEvolucao": {
    "nota": 1-10,
    "justificativa": "Breve justificativa da nota"
  },
  "mensagemMotivacional": "Mensagem personalizada de incentivo baseada na evolução observada"
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem blocos de código, sem texto adicional.`
      }
    ];

    // Add anamnese photos (BEFORE)
    if (anamnesePhotos.frente) {
      content.push({
        type: "text",
        text: "📸 FOTO INICIAL (ANAMNESE) - FRENTE:"
      });
      content.push({
        type: "image_url",
        image_url: { url: anamnesePhotos.frente }
      });
    }

    if (anamnesePhotos.lado) {
      content.push({
        type: "text",
        text: "📸 FOTO INICIAL (ANAMNESE) - LADO:"
      });
      content.push({
        type: "image_url",
        image_url: { url: anamnesePhotos.lado }
      });
    }

    if (anamnesePhotos.costas) {
      content.push({
        type: "text",
        text: "📸 FOTO INICIAL (ANAMNESE) - COSTAS:"
      });
      content.push({
        type: "image_url",
        image_url: { url: anamnesePhotos.costas }
      });
    }

    // Add evolution photos (AFTER)
    if (evolutionPhotos.frente) {
      content.push({
        type: "text",
        text: "📸 FOTO ATUAL (EVOLUÇÃO) - FRENTE:"
      });
      content.push({
        type: "image_url",
        image_url: { url: evolutionPhotos.frente }
      });
    }

    if (evolutionPhotos.lado) {
      content.push({
        type: "text",
        text: "📸 FOTO ATUAL (EVOLUÇÃO) - LADO:"
      });
      content.push({
        type: "image_url",
        image_url: { url: evolutionPhotos.lado }
      });
    }

    if (evolutionPhotos.costas) {
      content.push({
        type: "text",
        text: "📸 FOTO ATUAL (EVOLUÇÃO) - COSTAS:"
      });
      content.push({
        type: "image_url",
        image_url: { url: evolutionPhotos.costas }
      });
    }

    console.log("[ANALYZE-EVOLUTION] Calling AI gateway with", content.length, "content items");

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
      console.error("[ANALYZE-EVOLUTION] AI gateway error:", response.status, errorText);

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

    console.log("[ANALYZE-EVOLUTION] Raw response length:", rawContent.length);

    // Try to parse JSON from response
    let analysis;
    try {
      // Remove possible markdown code blocks
      const cleanedContent = rawContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedContent);
      console.log("[ANALYZE-EVOLUTION] JSON parsed successfully");
    } catch (parseError) {
      console.error("[ANALYZE-EVOLUTION] Failed to parse JSON:", parseError);
      // Return the raw content as a fallback (legacy format)
      return createSuccessResponse(req, { 
        analysis: rawContent,
        structured: null,
        parseError: true
      });
    }

    console.log("[ANALYZE-EVOLUTION] Analysis completed successfully");

    return createSuccessResponse(req, { 
      analysis: analysis,
      structured: true
    });
  } catch (error) {
    console.error("[ANALYZE-EVOLUTION] Error:", error);
    return createErrorResponse(req, "Erro ao processar análise comparativa. Tente novamente.");
  }
});
