import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    console.log("[ANALYZE-EVOLUTION] Starting analysis");

    // Build the content array with text and images
    const content: any[] = [
      {
        type: "text",
        text: `Você é Gabriel Baú, mentor fitness do Método Renascer. Faça uma análise comparativa VISUAL detalhada entre as fotos iniciais (anamnese) e as fotos de evolução atuais do cliente.

DADOS DO CLIENTE:
- Nome: ${clientData.name || "Cliente"}
- Peso inicial: ${clientData.initialWeight || "Não informado"} kg
- Peso atual: ${clientData.currentWeight || "Não informado"} kg
- Observações do cliente: ${clientData.notes || "Nenhuma"}

INSTRUÇÕES:
1. Compare VISUALMENTE as fotos de frente, lado e costas entre o ANTES (anamnese) e o DEPOIS (evolução)
2. Identifique mudanças positivas na composição corporal
3. Note áreas de melhoria e áreas que ainda precisam de trabalho
4. Seja motivador e construtivo
5. Dê recomendações específicas para os próximos 30 dias

FORMATO DA RESPOSTA (use exatamente esta estrutura):

## 🔥 ANÁLISE DA SUA EVOLUÇÃO

### 📊 Resumo Geral
[Breve parágrafo sobre a evolução geral]

### 💪 Mudanças Positivas Identificadas
- **Frente:** [o que melhorou visualmente]
- **Lado:** [o que melhorou visualmente]  
- **Costas:** [o que melhorou visualmente]

### 📈 Análise do Peso
[Comentário sobre a mudança de peso se houver dados]

### 🎯 Áreas de Foco para os Próximos 30 Dias
1. [Recomendação específica 1]
2. [Recomendação específica 2]
3. [Recomendação específica 3]

### 🏆 Mensagem Motivacional
[Mensagem personalizada de incentivo]

---
*Análise gerada em ${new Date().toLocaleDateString("pt-BR")}*`
      }
    ];

    // Add anamnese photos (BEFORE)
    if (anamnesePhotos.frente) {
      content.push({
        type: "text",
        text: "FOTO INICIAL (ANAMNESE) - FRENTE:"
      });
      content.push({
        type: "image_url",
        image_url: { url: anamnesePhotos.frente }
      });
    }

    if (anamnesePhotos.lado) {
      content.push({
        type: "text",
        text: "FOTO INICIAL (ANAMNESE) - LADO:"
      });
      content.push({
        type: "image_url",
        image_url: { url: anamnesePhotos.lado }
      });
    }

    if (anamnesePhotos.costas) {
      content.push({
        type: "text",
        text: "FOTO INICIAL (ANAMNESE) - COSTAS:"
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
        text: "FOTO ATUAL (EVOLUÇÃO) - FRENTE:"
      });
      content.push({
        type: "image_url",
        image_url: { url: evolutionPhotos.frente }
      });
    }

    if (evolutionPhotos.lado) {
      content.push({
        type: "text",
        text: "FOTO ATUAL (EVOLUÇÃO) - LADO:"
      });
      content.push({
        type: "image_url",
        image_url: { url: evolutionPhotos.lado }
      });
    }

    if (evolutionPhotos.costas) {
      content.push({
        type: "text",
        text: "FOTO ATUAL (EVOLUÇÃO) - COSTAS:"
      });
      content.push({
        type: "image_url",
        image_url: { url: evolutionPhotos.costas }
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
      console.error("[ANALYZE-EVOLUTION] AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    console.log("[ANALYZE-EVOLUTION] Analysis generated successfully");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ANALYZE-EVOLUTION] Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar análise. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
