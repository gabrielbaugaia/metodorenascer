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
        JSON.stringify({ valid: false, reason: "Imagem não fornecida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      // If no API key, skip validation and accept the photo
      return new Response(
        JSON.stringify({ valid: true, reason: "Validação ignorada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
                text: `Você é um validador de fotos corporais para um programa de fitness. Analise esta imagem e verifique se a pessoa está seguindo o padrão correto para fotos de avaliação corporal.

REGRAS OBRIGATÓRIAS:
1. A pessoa deve estar SEM CAMISETA (homens) ou usando apenas TOP ESPORTIVO (mulheres)
2. A pessoa NÃO pode estar usando camiseta, blusa, casaco ou qualquer roupa que cubra o torso
3. A pessoa NÃO pode estar usando acessórios como bonés, óculos, relógios grandes, correntes
4. A pessoa deve estar de corpo inteiro ou pelo menos da cintura para cima visível
5. A foto deve mostrar claramente o corpo para avaliação física

RESPONDA APENAS com um JSON no formato:
{
  "valid": true ou false,
  "reason": "motivo em português se inválida, ou 'OK' se válida"
}

Exemplos de respostas:
- Se estiver de camiseta: {"valid": false, "reason": "Remova a camiseta para a foto de avaliação corporal"}
- Se estiver usando boné: {"valid": false, "reason": "Remova acessórios como boné para a foto"}
- Se estiver correto: {"valid": true, "reason": "OK"}
- Se não conseguir analisar: {"valid": true, "reason": "OK"}

Seja rigoroso na validação.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AI validation failed:", response.status);
      // On error, accept the photo to not block the user
      return new Response(
        JSON.stringify({ valid: true, reason: "Validação ignorada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiContent);

    // Try to parse JSON from response
    let validationResult = { valid: true, reason: "OK" };
    
    try {
      // Find JSON in the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // If can't parse, accept the photo
      validationResult = { valid: true, reason: "OK" };
    }

    return new Response(
      JSON.stringify(validationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Validation error:", error);
    // On any error, accept the photo
    return new Response(
      JSON.stringify({ valid: true, reason: "Erro na validação" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
