import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[TRANSCRIBE-MANUAL-PROTOCOL] ${step}${detailsStr}`);
};

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(req, "Não autorizado", 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return createErrorResponse(req, "Token inválido", 401);
    }
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return createErrorResponse(req, "Acesso negado", 403);
    }

    const { text, imageBase64, instructions, userId, title } = await req.json();

    if (!text && !imageBase64) {
      return createErrorResponse(req, "Envie texto ou imagem do protocolo", 400);
    }
    if (!userId) {
      return createErrorResponse(req, "userId é obrigatório", 400);
    }

    logStep("Preparing AI request", { hasText: !!text, hasImage: !!imageBase64, userId });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return createErrorResponse(req, "LOVABLE_API_KEY não configurada", 500);
    }

    const systemPrompt = `Você é um assistente especializado em transcrição de protocolos de treino.
Sua tarefa é extrair exercícios de texto ou imagem e estruturá-los no formato JSON exato abaixo.

O formato de saída DEVE ser:
{
  "titulo": "Protocolo de Treino - [nome descritivo]",
  "nivel": "iniciante|intermediario|avancado",
  "treinos": [
    {
      "letra": "A",
      "foco": "Peito e Tríceps",
      "duracao_minutos": 60,
      "exercicios": [
        {
          "nome": "Supino Reto com Barra",
          "series": 4,
          "repeticoes": "10-12",
          "descanso": "90s",
          "dicas": "Manter escápulas retraídas"
        }
      ]
    }
  ]
}

Regras:
- Se o texto mencionar treinos A, B, C, D etc., mapeie cada um para um objeto em "treinos"
- Se não houver divisão clara, crie treinos lógicos agrupando por grupo muscular
- "repeticoes" sempre como string (ex: "10-12", "8", "até falha")
- "descanso" sempre como string (ex: "60s", "90s", "2min")
- "series" sempre como número inteiro
- Se houver observações de execução, coloque em "dicas"
- Traduza nomes de exercícios para português se estiverem em inglês
- ${instructions ? `Orientações adicionais do treinador: ${instructions}` : ""}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (text && imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Transcreva este protocolo de treino:\n\n${text}` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    } else if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Transcreva o protocolo de treino desta imagem para o formato JSON estruturado." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Transcreva este protocolo de treino para o formato JSON estruturado:\n\n${text}`
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageBase64 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "create_training_protocol",
              description: "Create a structured training protocol from the provided text/image",
              parameters: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  nivel: { type: "string", enum: ["iniciante", "intermediario", "avancado"] },
                  treinos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        letra: { type: "string" },
                        foco: { type: "string" },
                        duracao_minutos: { type: "number" },
                        exercicios: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              nome: { type: "string" },
                              series: { type: "number" },
                              repeticoes: { type: "string" },
                              descanso: { type: "string" },
                              dicas: { type: "string" }
                            },
                            required: ["nome", "series", "repeticoes", "descanso"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["letra", "foco", "exercicios"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["titulo", "nivel", "treinos"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_training_protocol" } }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      logStep("AI gateway error", { status: aiResponse.status, body: errText });
      if (aiResponse.status === 429) {
        return createErrorResponse(req, "Muitas requisições. Aguarde alguns minutos.", 429);
      }
      if (aiResponse.status === 402) {
        return createErrorResponse(req, "Créditos de IA insuficientes.", 402);
      }
      return createErrorResponse(req, "Erro na IA ao processar protocolo", 500);
    }

    const aiData = await aiResponse.json();
    logStep("AI response received");

    let protocolContent: any;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        protocolContent = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } else {
        throw new Error("No tool call in response");
      }
    } catch (e) {
      logStep("Failed to parse AI response", { error: (e as Error).message });
      return createErrorResponse(req, "Erro ao interpretar resposta da IA", 500);
    }

    // Match exercise GIFs from database
    logStep("Matching exercise GIFs");
    const allExerciseNames: string[] = [];
    for (const treino of protocolContent.treinos) {
      for (const ex of treino.exercicios) {
        allExerciseNames.push(ex.nome);
      }
    }

    if (allExerciseNames.length > 0) {
      const { data: gifs } = await supabaseClient
        .from("exercise_gifs")
        .select("exercise_name_pt, gif_url")
        .eq("status", "found")
        .not("gif_url", "is", null);

      if (gifs && gifs.length > 0) {
        const gifMap = new Map<string, string>();
        for (const g of gifs) {
          gifMap.set(g.exercise_name_pt.toLowerCase().trim(), g.gif_url!);
        }

        for (const treino of protocolContent.treinos) {
          for (const ex of treino.exercicios) {
            const nameKey = ex.nome.toLowerCase().trim();
            // Exact match
            if (gifMap.has(nameKey)) {
              ex.video_url = gifMap.get(nameKey);
              continue;
            }
            // Partial match
            for (const [gifName, gifUrl] of gifMap) {
              if (nameKey.includes(gifName) || gifName.includes(nameKey)) {
                ex.video_url = gifUrl;
                break;
              }
            }
          }
        }
        logStep("GIFs matched");
      }
    }

    // Save to protocolos table
    const finalTitle = title || protocolContent.titulo || "Protocolo Manual";

    // Deactivate existing training protocols for this user
    await supabaseClient
      .from("protocolos")
      .update({ ativo: false })
      .eq("user_id", userId)
      .eq("tipo", "treino");

    const { data: inserted, error: insertError } = await supabaseClient
      .from("protocolos")
      .insert({
        user_id: userId,
        tipo: "treino",
        titulo: finalTitle,
        conteudo: protocolContent,
        ativo: true,
        data_geracao: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      logStep("Insert error", { error: insertError.message });
      return createErrorResponse(req, "Erro ao salvar protocolo", 500);
    }

    logStep("Protocol saved", { protocolId: inserted.id });

    return createSuccessResponse(req, {
      success: true,
      protocolId: inserted.id,
      content: protocolContent,
    });

  } catch (error) {
    console.error("[TRANSCRIBE-MANUAL-PROTOCOL] Error:", error);
    return createErrorResponse(req, "Erro interno ao processar protocolo", 500);
  }
});
