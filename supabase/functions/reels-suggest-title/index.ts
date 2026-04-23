import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MUSCLE_GROUPS, sanitizeMuscleGroups } from "../_shared/muscleGroups.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Mode = "full" | "description_only";

interface Body {
  // base64 frames (without data: prefix), 1-3 frames recommended
  frames: string[];
  // optional hints
  category?: string;
  muscleGroup?: string;
  muscleGroups?: string[];
  // controla se a IA gera tudo ou só a descrição
  mode?: Mode;
  // contexto opcional pro modo description_only
  currentTitle?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { frames, category, muscleGroup, muscleGroups, mode, currentTitle } =
      (await req.json()) as Body;
    const resolvedMode: Mode = mode === "description_only" ? "description_only" : "full";

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
    const hintMuscles = muscleGroups?.length
      ? muscleGroups.join(", ")
      : muscleGroup;
    if (hintMuscles) hintParts.push(`Grupo muscular sugerido: ${hintMuscles}`);
    const hint = hintParts.length
      ? `\n\nContexto adicional: ${hintParts.join(" | ")}`
      : "";

    const muscleList = MUSCLE_GROUPS.join(", ");

    const fullPrompt = `Você é um especialista em fitness e copywriter de redes sociais.
Recebe frames de um vídeo curto vertical (estilo Reels) sobre exercícios/dicas/explicações de academia.

Sua tarefa: gerar METADADOS COMPLETOS para o vídeo, em PORTUGUÊS BRASILEIRO:

1) TÍTULO: curto e direto, máximo 60 caracteres, sem emojis, sem aspas, sem ponto final.
   Deve descrever objetivamente o que o vídeo mostra.

2) DESCRIÇÃO CURTA: até 200 caracteres, explicando como executar o exercício
   ou qual a dica/conceito demonstrado. Linguagem clara e prática, voltada ao aluno.
   Sem emojis. Sem aspas. Termine com ponto final.

3) GRUPOS MUSCULARES: array com 1 a 3 grupos da lista FIXA abaixo. Use EXATAMENTE
   essas grafias (case-sensitive). Se for cardio, mobilidade, alongamento ou corpo todo,
   use o item correspondente.

   Lista permitida: ${muscleList}

Use os 3 campos juntos via a ferramenta set_video_metadata.`;

    const descOnlyPrompt = `Você é um especialista em fitness e copywriter de redes sociais.
Recebe frames de um vídeo curto vertical (estilo Reels) sobre exercícios/dicas/explicações de academia.

Sua tarefa: gerar APENAS a DESCRIÇÃO CURTA (até 200 caracteres) em PORTUGUÊS BRASILEIRO,
explicando como executar o exercício ou a dica/conceito demonstrado. Linguagem clara e prática,
voltada ao aluno. Sem emojis. Sem aspas. Termine com ponto final.

${currentTitle ? `O vídeo já tem o título: "${currentTitle}". Use-o como contexto, mas não o repita literalmente na descrição.` : ""}

Retorne via a ferramenta set_video_metadata preenchendo SOMENTE o campo description.`;

    const systemPrompt = resolvedMode === "description_only" ? descOnlyPrompt : fullPrompt;

    const userMessage = {
      role: "user",
      content: [
        ...imageContents,
        {
          type: "text",
          text: resolvedMode === "description_only"
            ? `Analise os frames e gere apenas a descrição conforme as instruções.${hint}`
            : `Analise os frames e gere os metadados conforme as instruções.${hint}`,
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
                name: "set_video_metadata",
                description:
                  resolvedMode === "description_only"
                    ? "Define apenas a descrição do vídeo"
                    : "Define título, descrição e grupos musculares do vídeo",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description:
                        "Título curto em português, máx 60 caracteres",
                    },
                    description: {
                      type: "string",
                      description:
                        "Descrição curta explicando execução/dica, máx 200 caracteres",
                    },
                    muscle_groups: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: [...MUSCLE_GROUPS],
                      },
                      minItems: 1,
                      maxItems: 3,
                      description:
                        "Lista de 1 a 3 grupos musculares da lista fixa",
                    },
                  },
                  required:
                    resolvedMode === "description_only"
                      ? ["description"]
                      : ["title", "description", "muscle_groups"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "set_video_metadata" },
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisições atingido. Tente em instantes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos de IA esgotados. Adicione créditos no workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ error: "Falha ao chamar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let title = "Novo vídeo";
    let description = "";
    let groups: string[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        if (typeof args.title === "string" && args.title.trim()) {
          title = args.title.trim().slice(0, 60);
        }
        if (typeof args.description === "string" && args.description.trim()) {
          description = args.description.trim().slice(0, 200);
        }
        groups = sanitizeMuscleGroups(args.muscle_groups);
      } catch (_) {
        // fallback
      }
    }

    const payload =
      resolvedMode === "description_only"
        ? { description }
        : { title, description, muscle_groups: groups };

    return new Response(
      JSON.stringify(payload),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("reels-suggest-title error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
