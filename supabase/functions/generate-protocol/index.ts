import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";
import { getTreinoSystemPrompt, getTreinoUserPrompt } from "./prompts/treino.ts";
import { getNutricaoSystemPrompt, getNutricaoUserPrompt } from "./prompts/nutricao.ts";
import { getMindsetSystemPrompt, getMindsetUserPrompt } from "./prompts/mindset.ts";
import { 
  validateTreinoProtocol, 
  validateNutricaoProtocol, 
  validateMindsetProtocol,
  normalizeTreinoProtocol
} from "./schemas.ts";
import { 
  getClientIdentifier, 
  checkRateLimit, 
  STRICT_RATE_LIMIT, 
  createRateLimitResponse 
} from "../_shared/rateLimit.ts";

// Mapear tipo de plano para duração em semanas
const planDurationWeeks: Record<string, number> = {
  "embaixador": 4,
  "mensal": 4,
  "trimestral": 12,
  "semestral": 24,
  "anual": 48,
  "free": 4,
  "gratuito": 4,
};

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // SECURITY FIX: Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return createErrorResponse(req, "Não autorizado - sessão não encontrada", 401);
    }

    // Create admin client for operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate the user's session token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth validation failed:", authError);
      return createErrorResponse(req, "Sessão inválida ou expirada", 401);
    }

    console.log("Authenticated user:", user.id);

    // Rate limiting per user
    const clientId = getClientIdentifier(req, user.id);
    const rateCheck = checkRateLimit(clientId, STRICT_RATE_LIMIT);

    if (!rateCheck.allowed) {
      console.log("Rate limit exceeded for user:", user.id);
      return createRateLimitResponse(rateCheck.resetAt);
    }

    const { tipo, userContext, userId, adjustments, planType, evolutionAdjustments } = await req.json();

    // SECURITY FIX: Verify user can generate for this userId
    if (userId !== user.id) {
      // Check if requesting user is admin
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        console.error("Non-admin trying to generate for other user:", user.id, "target:", userId);
        return createErrorResponse(req, "Acesso negado - não pode gerar protocolo para outro usuário", 403);
      }
      console.log("Admin authorized to generate for user:", userId);
    }

    // Format evolution adjustments into a string if provided
    let formattedAdjustments = adjustments || "";
    
    if (evolutionAdjustments) {
      const evolutionText: string[] = [];
      
      if (tipo === "treino" && evolutionAdjustments) {
        evolutionText.push("### AJUSTES BASEADOS NA ANÁLISE DE EVOLUÇÃO ###");
        if (evolutionAdjustments.intensificar?.length > 0) {
          evolutionText.push(`INTENSIFICAR: ${evolutionAdjustments.intensificar.join(", ")}`);
        }
        if (evolutionAdjustments.adicionar?.length > 0) {
          evolutionText.push(`ADICIONAR FOCO: ${evolutionAdjustments.adicionar.join(", ")}`);
        }
        if (evolutionAdjustments.manutencao?.length > 0) {
          evolutionText.push(`MANTER ÊNFASE: ${evolutionAdjustments.manutencao.join(", ")}`);
        }
        if (evolutionAdjustments.observacoes) {
          evolutionText.push(`OBSERVAÇÕES: ${evolutionAdjustments.observacoes}`);
        }
      }
      
      if (tipo === "nutricao" && evolutionAdjustments) {
        evolutionText.push("### AJUSTES BASEADOS NA ANÁLISE DE EVOLUÇÃO ###");
        if (evolutionAdjustments.calorias) {
          evolutionText.push(`CALORIAS: ${evolutionAdjustments.calorias}`);
        }
        if (evolutionAdjustments.proteina) {
          evolutionText.push(`PROTEÍNA: ${evolutionAdjustments.proteina}`);
        }
        if (evolutionAdjustments.carboidratos) {
          evolutionText.push(`CARBOIDRATOS: ${evolutionAdjustments.carboidratos}`);
        }
        if (evolutionAdjustments.sugestoes?.length > 0) {
          evolutionText.push(`SUGESTÕES: ${evolutionAdjustments.sugestoes.join("; ")}`);
        }
        if (evolutionAdjustments.observacoes) {
          evolutionText.push(`OBSERVAÇÕES: ${evolutionAdjustments.observacoes}`);
        }
      }
      
      if (evolutionText.length > 0) {
        formattedAdjustments = formattedAdjustments 
          ? `${formattedAdjustments}\n\n${evolutionText.join("\n")}`
          : evolutionText.join("\n");
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determinar duração do protocolo baseado no plano
    const durationWeeks = planDurationWeeks[planType?.toLowerCase()] || 4;
    
    // Calcular quantas semanas liberar (máximo 4 por ciclo)
    const weeksPerCycle = 4;
    const totalCycles = Math.ceil(durationWeeks / weeksPerCycle);

    let systemPrompt = "";
    let userPrompt = "";

    // P1 FIX: Buscar lista de exercícios ANTES de gerar o prompt
    // para que a IA use nomes padronizados
    let exerciseVideos: Record<string, string> = {};
    let exerciseNames: string[] = [];
    
    if (tipo === "treino") {
      const { data: videos } = await supabaseClient
        .from("exercise_videos")
        .select("exercise_name, video_url");
      
      if (videos) {
        videos.forEach((v: { exercise_name: string; video_url: string }) => {
          exerciseVideos[v.exercise_name.toLowerCase()] = v.video_url;
          exerciseNames.push(v.exercise_name);
        });
        console.log(`Loaded ${videos.length} exercise videos from database`);
      }
    }

    // Selecionar prompts baseado no tipo
    if (tipo === "treino") {
      // P1 FIX: Passar lista de exercícios para o prompt
      systemPrompt = getTreinoSystemPrompt(durationWeeks, weeksPerCycle, totalCycles, exerciseNames);
      userPrompt = getTreinoUserPrompt(userContext, planType, durationWeeks, weeksPerCycle, formattedAdjustments);
    } else if (tipo === "nutricao") {
      systemPrompt = getNutricaoSystemPrompt(durationWeeks, weeksPerCycle);
      userPrompt = getNutricaoUserPrompt(userContext, planType, durationWeeks, weeksPerCycle, formattedAdjustments);
    } else if (tipo === "mindset") {
      systemPrompt = getMindsetSystemPrompt(durationWeeks, weeksPerCycle);
      userPrompt = getMindsetUserPrompt(userContext, planType, durationWeeks, formattedAdjustments);
    } else {
      throw new Error("Tipo de protocolo inválido");
    }

    console.log(`Generating ${tipo} protocol for user ${userId}, plan: ${planType}, weeks: ${durationWeeks}`);

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
      
      // Handle rate limits
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
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
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      protocolData = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse protocol JSON:", content);
      throw new Error("Erro ao processar protocolo gerado - JSON inválido");
    }

    // P0 FIX: Validar schema do protocolo antes de salvar
    let validationResult: { valid: boolean; errors: string[] };
    if (tipo === "treino") {
      // Normalizar campos numéricos antes de validar
      normalizeTreinoProtocol(protocolData);
      validationResult = validateTreinoProtocol(protocolData);
    } else if (tipo === "nutricao") {
      validationResult = validateNutricaoProtocol(protocolData);
    } else {
      validationResult = validateMindsetProtocol(protocolData);
    }

    if (!validationResult.valid) {
      console.error(`Schema validation failed for ${tipo}:`, validationResult.errors);
      // Log os primeiros 3 erros para debugging
      console.error("First errors:", validationResult.errors.slice(0, 3));
      // Continuar mesmo com erros menores, mas logar para análise
      if (validationResult.errors.some(e => e.includes("é obrigatório"))) {
        throw new Error(`Protocolo gerado com estrutura incompleta: ${validationResult.errors[0]}`);
      }
    }
    
    console.log(`Schema validation passed for ${tipo}`);

    // Enriquecer exercícios com URLs de vídeo do banco de dados
    if (tipo === "treino" && protocolData.semanas && Object.keys(exerciseVideos).length > 0) {
      protocolData.semanas.forEach((semana: any) => {
        if (semana.dias) {
          semana.dias.forEach((dia: any) => {
            if (dia.exercicios) {
              dia.exercicios.forEach((ex: any) => {
                if (ex.nome && !ex.video_url) {
                  const nomeNormalizado = ex.nome.toLowerCase().trim();
                  
                  if (exerciseVideos[nomeNormalizado]) {
                    ex.video_url = exerciseVideos[nomeNormalizado];
                  } else {
                    for (const [exerciseName, url] of Object.entries(exerciseVideos)) {
                      if (nomeNormalizado.includes(exerciseName) || exerciseName.includes(nomeNormalizado)) {
                        ex.video_url = url;
                        break;
                      }
                    }
                  }
                }
              });
            }
          });
        }
      });
      console.log("Exercise videos enriched from database");
    }

    // Adicionar metadados de controle de ciclos
    protocolData.plan_type = planType || 'mensal';
    protocolData.duracao_semanas = durationWeeks;
    protocolData.semanas_por_ciclo = weeksPerCycle;
    protocolData.ciclo_atual = 1;
    protocolData.total_ciclos = totalCycles;
    protocolData.data_proxima_avaliacao = new Date(Date.now() + weeksPerCycle * 7 * 24 * 60 * 60 * 1000).toISOString();
    protocolData.metodo = "Método Renascer";
    protocolData.versao_guia = "1.0";

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

    console.log(`Protocol ${tipo} generated and saved successfully for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      protocol: savedProtocol,
      data: protocolData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate protocol error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar protocolo. Tente novamente." }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
