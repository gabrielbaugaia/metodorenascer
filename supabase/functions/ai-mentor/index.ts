import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS
const allowedOrigins = [
  "https://lxdosmjenbaugmhyfanx.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Map errors to safe user messages
function mapErrorToUserMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Erro ao processar mensagem. Tente novamente.";
  
  const message = error.message.toLowerCase();
  
  if (message.includes("rate limit") || message.includes("limite")) {
    return "Limite de requisições excedido. Aguarde alguns segundos.";
  }
  if (message.includes("créditos") || message.includes("credits")) {
    return "Créditos insuficientes. Entre em contato com o suporte.";
  }
  
  return "Erro ao processar mensagem. Tente novamente.";
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (type === "mentor") {
      systemPrompt = `Você é Gabriel Baú, mentor fitness do Método Renascer. Você é um especialista em transformação corporal com mais de 10 anos de experiência. Seu papel é:

1. Motivar e apoiar o cliente em sua jornada de transformação
2. Responder dúvidas sobre treino, nutrição e mindset
3. Dar dicas práticas e personalizadas
4. Celebrar conquistas e ajudar em momentos difíceis
5. Manter um tom amigável, profissional e motivador

Contexto do cliente: ${JSON.stringify(userContext || {})}

Regras:
- Sempre responda em português brasileiro
- Seja empático e motivador
- Use linguagem acessível
- Dê respostas práticas e acionáveis
- Nunca forneça diagnósticos médicos, sempre recomende consultar um profissional para questões de saúde`;
    } else if (type === "protocolo") {
      systemPrompt = `Você é um sistema de geração de protocolos fitness do Método Renascer. Gere planos de treino e nutrição personalizados baseados na anamnese do cliente.

Contexto do cliente: ${JSON.stringify(userContext || {})}

Para TREINO, retorne JSON no formato:
{
  "semanas": [
    {
      "semana": 1,
      "dias": [
        {
          "dia": "Segunda",
          "foco": "Peito e Tríceps",
          "exercicios": [
            {"nome": "Supino reto", "series": 4, "repeticoes": "10-12", "descanso": "60s"}
          ]
        }
      ]
    }
  ],
  "observacoes": "..."
}

Para NUTRIÇÃO, retorne JSON no formato:
{
  "calorias_diarias": 2000,
  "macros": {"proteinas": 150, "carboidratos": 200, "gorduras": 67},
  "refeicoes": [
    {
      "nome": "Café da manhã",
      "horario": "07:00",
      "alimentos": ["2 ovos", "1 banana", "30g aveia"],
      "calorias": 350
    }
  ],
  "observacoes": "..."
}`;
    } else if (type === "receita") {
      systemPrompt = `Você é um chef nutricional do Método Renascer. Crie receitas fitness deliciosas e saudáveis.

Retorne JSON no formato:
{
  "nome": "Nome da Receita",
  "tempo_preparo": "20 minutos",
  "porcoes": 2,
  "calorias_por_porcao": 350,
  "macros": {"proteinas": 30, "carboidratos": 25, "gorduras": 12},
  "ingredientes": ["100g frango", "1 xícara arroz integral"],
  "modo_preparo": ["Passo 1...", "Passo 2..."],
  "dicas": "Dica do chef..."
}`;
    } else {
      systemPrompt = `Você é o assistente de suporte do Método Renascer. Ajude os clientes com dúvidas gerais sobre a plataforma, planos, funcionalidades e aspectos técnicos. Seja sempre cordial e prestativo.`;
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI mentor error:", error);
    const userMessage = mapErrorToUserMessage(error);
    return new Response(JSON.stringify({ error: userMessage }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
