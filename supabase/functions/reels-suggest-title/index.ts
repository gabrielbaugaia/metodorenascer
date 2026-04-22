import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  // base64 frames (without data: prefix), 1-3 frames recommended
  frames: string[];
  // optional hint (e.g. category)
  category?: string;
  muscleGroup?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { frames, category, muscleGroup } = (await req.json()) as Body;

    if (!Array.isArray(frames) || frames.length === 0) {
      return new Response(
        JSON.stringify({ error: "frames (array of base64 jpeg) required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imageContents = frames.slice(0, 3).map((b64) => ({
      type: "image_url",
      image_url: {
        url: b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`,
      },
    }));

    const hintParts: string[] = [];
    if (category) hintParts.push(`Categoria: ${category}`);
    if (muscleGroup) hintParts.push(`Grupo muscular: ${muscleGroup}`);
    const hint = hintParts.length ? `\n\nContexto: ${hintParts.join(" | ")}` : "";

    const systemPrompt = `Você é um especialista em fitness e copywriter de redes sociais.
Recebe frames de um vídeo curto vertical (estilo Reels) sobre exercícios/dicas/explicações de academia.
Sua tarefa: criar UM título curto e direto em português brasileiro, máximo 60 caracteres, sem emojis, sem aspas, sem ponto final.
O título deve descrever objetivamente o que o vídeo mostra (exercício, dica ou explicação).`;

    const userMessage = {
      role: "user",
      content: [
        ...imageContents,
        {
          type: "text",
          text: `Analise os frames e gere o título conforme as instruções.${hint}`,
        },
      ],
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            userMessage,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "set_video_title",
                description: "Define o título sugerido do vídeo",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Título curto em português, máx 60 caracteres",
                    },
                  },
                  required: ["title"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "set_video_title" },
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Falha ao chamar IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let title = "Novo vídeo";
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        if (typeof args.title === "string" && args.title.trim()) {
          title = args.title.trim().slice(0, 60);
        }
      } catch (_) {
        // fallback below
      }
    }

    return new Response(JSON.stringify({ title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reels-suggest-title error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
