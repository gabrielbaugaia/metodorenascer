import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Limit payload size (~5MB base64)
    if (imageBase64.length > 7_000_000) {
      return new Response(
        JSON.stringify({ error: "Imagem muito grande. Máximo 5MB." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Chave de API não configurada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
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
            content: [
              {
                type: "text",
                text: `Você é um nutricionista especialista em alimentação brasileira. Analise esta foto de refeição e identifique TODOS os alimentos visíveis.

Para CADA alimento identificado, retorne:
- food_name: nome em português
- calories: calorias estimadas para a porção visível
- protein_g: proteína em gramas
- carbs_g: carboidratos em gramas
- fat_g: gordura em gramas
- portion_size: descrição da porção estimada (ex: "1 concha", "2 colheres", "1 filé")

REGRAS:
1. Seja realista nas estimativas de porção baseado no que vê na foto
2. Use valores nutricionais da Tabela TACO quando possível
3. Se não conseguir identificar um alimento, não invente
4. Retorne APENAS o JSON, sem texto adicional

Retorne um JSON no formato:
{
  "foods": [
    {
      "food_name": "Arroz branco",
      "calories": 130,
      "protein_g": 2.5,
      "carbs_g": 28,
      "fat_g": 0.3,
      "portion_size": "2 colheres"
    }
  ],
  "total_calories": 450,
  "confidence": "high"
}

Se a imagem NÃO for de comida, retorne:
{ "foods": [], "total_calories": 0, "confidence": "none", "error": "Imagem não parece ser de uma refeição" }`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status, await response.text());
      return new Response(
        JSON.stringify({ error: "Erro ao analisar imagem. Tente novamente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ foods: [], total_calories: 0, confidence: "none", error: "Não foi possível analisar a imagem" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-meal-photo error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar a imagem." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
