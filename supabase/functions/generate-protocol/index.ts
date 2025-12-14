import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, userContext, userId, adjustments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let systemPrompt = "";
    let userPrompt = "";

    if (tipo === "treino") {
      systemPrompt = `Você é um personal trainer especializado do Método Renascer. Crie um protocolo de treino completo e personalizado.

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Protocolo de Treino Personalizado",
  "duracao_semanas": 4,
  "nivel": "iniciante|intermediario|avancado",
  "objetivo": "...",
  "semanas": [
    {
      "semana": 1,
      "dias": [
        {
          "dia": "Segunda-feira",
          "foco": "Peito e Tríceps",
          "duracao_minutos": 45,
          "exercicios": [
            {
              "nome": "Supino reto com halteres",
              "series": 4,
              "repeticoes": "10-12",
              "descanso": "60s",
              "video_url": "",
              "dicas": "Mantenha os cotovelos a 45 graus"
            }
          ]
        }
      ]
    }
  ],
  "observacoes_gerais": "...",
  "aquecimento": "5-10 min de cardio leve",
  "alongamento": "10 min ao final"
}`;

      userPrompt = `Crie um protocolo de treino para este cliente:
${JSON.stringify(userContext, null, 2)}

${adjustments ? `Ajustes solicitados: ${adjustments}` : ""}

Considere:
- Nível de experiência do cliente
- Objetivos específicos
- Lesões ou restrições
- Disponibilidade semanal`;
    } else if (tipo === "nutricao") {
      systemPrompt = `Você é um nutricionista esportivo do Método Renascer. Crie um plano alimentar completo e personalizado.

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Plano Nutricional Personalizado",
  "calorias_diarias": 2000,
  "macros": {
    "proteinas_g": 150,
    "carboidratos_g": 200,
    "gorduras_g": 67
  },
  "refeicoes": [
    {
      "nome": "Café da manhã",
      "horario": "07:00",
      "alimentos": [
        {"item": "2 ovos mexidos", "calorias": 140, "proteinas": 12},
        {"item": "1 fatia pão integral", "calorias": 80, "proteinas": 4}
      ],
      "calorias_total": 350
    }
  ],
  "suplementacao": ["Whey Protein pós-treino", "Creatina 5g/dia"],
  "hidratacao": "Mínimo 2.5L água/dia",
  "observacoes": "...",
  "lista_compras": ["Ovos", "Frango", "Arroz integral"]
}`;

      userPrompt = `Crie um plano nutricional para este cliente:
${JSON.stringify(userContext, null, 2)}

${adjustments ? `Ajustes solicitados: ${adjustments}` : ""}

Considere:
- Peso atual e objetivo
- Nível de atividade física
- Restrições alimentares
- Preferências`;
    } else {
      throw new Error("Tipo de protocolo inválido");
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error("Erro ao gerar protocolo");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Parse JSON from response
    let protocolData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      protocolData = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse protocol JSON:", content);
      throw new Error("Erro ao processar protocolo gerado");
    }

    // Save protocol to database
    const { data: savedProtocol, error: saveError } = await supabaseClient
      .from("protocolos")
      .insert({
        user_id: userId,
        tipo: tipo,
        titulo: protocolData.titulo || `Protocolo de ${tipo}`,
        conteudo: protocolData,
        ativo: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving protocol:", saveError);
      throw new Error("Erro ao salvar protocolo");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      protocol: savedProtocol,
      data: protocolData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate protocol error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
