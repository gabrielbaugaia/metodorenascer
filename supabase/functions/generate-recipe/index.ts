import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("Ingredientes são obrigatórios");
    }

    console.log("[GENERATE-RECIPE] Generating recipe for ingredients:", ingredients);

    const systemPrompt = `Você é um nutricionista especializado em receitas fitness saudáveis. 
Quando o usuário fornecer ingredientes, você deve criar UMA receita fitness deliciosa e saudável.

Regras:
- A receita deve ser fitness/saudável
- Use APENAS os ingredientes fornecidos (pode adicionar temperos básicos como sal, pimenta, azeite)
- Forneça valores nutricionais estimados
- Seja prático e objetivo
- Responda sempre em português brasileiro

Formato da resposta (use exatamente este formato):

**NOME DA RECEITA**
[Nome criativo da receita]

**INGREDIENTES**
- [quantidade] de [ingrediente]
- ...

**MODO DE PREPARO**
1. [passo]
2. [passo]
...

**INFORMAÇÕES NUTRICIONAIS (por porção)**
- Calorias: X kcal
- Proteínas: Xg
- Carboidratos: Xg
- Gorduras: Xg

**DICA FITNESS**
[Uma dica rápida sobre a receita]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie uma receita fitness usando estes ingredientes: ${ingredients.join(", ")}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GENERATE-RECIPE] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Erro ao gerar receita");
    }

    const data = await response.json();
    const recipe = data.choices?.[0]?.message?.content;

    console.log("[GENERATE-RECIPE] Recipe generated successfully");

    return new Response(
      JSON.stringify({ recipe }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[GENERATE-RECIPE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
