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
  normalizeTreinoProtocol,
  type NutricaoValidationResult,
  type TreinoValidationResult
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

    // ==== LOGGING DE ROTINA PARA DEBUG ====
    console.log(`[generate-protocol] User routine context for ${tipo}:`, {
      horario_acorda: userContext?.horario_acorda || "NOT PROVIDED",
      horario_treino: userContext?.horario_treino || "NOT PROVIDED",
      horario_dorme: userContext?.horario_dorme || "NOT PROVIDED",
      refeicoes_por_dia: userContext?.refeicoes_por_dia || "NOT PROVIDED"
    });

    // ==== VALIDAÇÃO E DEFAULTS PARA CAMPOS DE ROTINA ====
    if (tipo === "nutricao") {
      const requiredRoutineFields = ["horario_treino", "horario_acorda", "horario_dorme"];
      const missingFields = requiredRoutineFields.filter(
        field => !userContext?.[field] || userContext[field] === ""
      );
      
      if (missingFields.length > 0) {
        console.warn(`[generate-protocol] Missing routine fields for nutrition: ${missingFields.join(", ")}. Using defaults.`);
        // Apply defaults to prevent AI hallucination
        userContext.horario_acorda = userContext?.horario_acorda || "06:00";
        userContext.horario_treino = userContext?.horario_treino || "18:00";
        userContext.horario_dorme = userContext?.horario_dorme || "22:00";
        userContext.refeicoes_por_dia = userContext?.refeicoes_por_dia || "5";
      }
      
      // ==== VALIDAÇÃO DE COERÊNCIA DOS HORÁRIOS ====
      const toMinutes = (time: string): number => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + (m || 0);
      };
      
      const acordaMin = toMinutes(userContext.horario_acorda);
      const treinoMin = toMinutes(userContext.horario_treino);
      const dormeMin = toMinutes(userContext.horario_dorme);
      
      console.log(`[generate-protocol] Schedule validation:`, {
        acordaMin, treinoMin, dormeMin,
        primeiraRefeicao: acordaMin + 30,
        preTreino: treinoMin - 90,
        posTreino: treinoMin + 90,
        ultimaRefeicao: dormeMin - 60
      });
      
      // Verificar que primeira refeição não é antes de acordar
      if (acordaMin + 30 > treinoMin - 90 && treinoMin > acordaMin) {
        console.warn("[generate-protocol] Warning: Breakfast may overlap with pre-workout - training very early");
      }
      
      // Verificar que há pelo menos 12h entre acordar e dormir
      if (dormeMin - acordaMin < 720) {
        console.warn("[generate-protocol] Warning: Very short waking window (less than 12h)");
      }
      
      // Verificar se pós-treino não ultrapassa horário de dormir
      if (treinoMin + 90 > dormeMin) {
        console.warn("[generate-protocol] Warning: Post-workout meal may be too close to bedtime");
      }
      
      console.log(`[generate-protocol] Final routine for nutrition generation:`, {
        horario_acorda: userContext.horario_acorda,
        horario_treino: userContext.horario_treino,
        horario_dorme: userContext.horario_dorme,
        refeicoes_por_dia: userContext.refeicoes_por_dia
      });
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData;

    // Determine target user: admin can generate for any user, client only for themselves
    // NOTE: `userId` comes from request body (admin passes the client id). Clients usually won't pass it.
    const targetUserId = isAdmin ? userId : user.id;

    if (!targetUserId) {
      console.error("[generate-protocol] Missing targetUserId", { isAdmin, userIdFromBody: userId, authUserId: user.id });
      return createErrorResponse(req, "Usuário alvo não informado", 400);
    }

    console.log(`User ${user.id} (admin: ${isAdmin}) requesting protocol for user: ${targetUserId}`);

    // Check monthly limit: max 1 protocol per type per month per user
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const { data: existingProtocols, error: checkError } = await supabaseClient
      .from("protocolos")
      .select("id, created_at")
      .eq("user_id", targetUserId)
      .eq("tipo", tipo)
      .gte("created_at", oneMonthAgo.toISOString())
      .order("created_at", { ascending: false });

    if (checkError) {
      console.error("Error checking existing protocols:", checkError);
    }

    const hasRecentProtocol = existingProtocols && existingProtocols.length > 0;
    const isAdjustment = !!adjustments || !!evolutionAdjustments;
    
    // Monthly limit logic for clients:
    // - First protocol: Can generate (no previous protocol this month)
    // - After 30 days: Can ONLY generate if they submitted evolution photos (checkin)
    // - Admin: Can always generate/regenerate
    if (hasRecentProtocol && !isAdmin) {
      // Check if client submitted evolution photos (checkin) after their last protocol
      const lastProtocolDate = existingProtocols[0].created_at;
      
      const { data: recentCheckin, error: checkinError } = await supabaseClient
        .from("checkins")
        .select("id, created_at, foto_url")
        .eq("user_id", targetUserId)
        .gt("created_at", lastProtocolDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (checkinError) {
        console.error("Error checking recent checkin:", checkinError);
      }
      
      const hasSubmittedEvolutionPhotos = recentCheckin && recentCheckin.foto_url;
      
      if (!hasSubmittedEvolutionPhotos) {
        // Client has protocol this month but hasn't submitted evolution photos - BLOCKED
        console.log(`Client ${user.id} hasn't submitted evolution photos since last protocol. Only admin can regenerate.`);
        return createErrorResponse(
          req, 
          `Para gerar um novo protocolo, envie suas fotos de evolução na página Evolução. Apenas após o envio das fotos você poderá gerar novos protocolos.`, 
          400
        );
      }
      
      console.log(`Client ${user.id} has submitted evolution photos. Allowing new ${tipo} protocol generation.`);
    }
    
    if (hasRecentProtocol && isAdmin) {
      // Admin can regenerate with or without adjustments
      console.log(`Admin regenerating ${tipo} protocol for user ${targetUserId}. Adjustment: ${isAdjustment}`);
    }

    if (hasRecentProtocol && isAdjustment) {
      console.log(`Admin regenerating ${tipo} protocol with adjustments for user ${userId}`);
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

    // P1 FIX: Buscar lista de exercícios da tabela exercise_gifs
    // para que a IA use nomes padronizados e tenha os GIFs corretos
    let exerciseVideos: Record<string, string> = {};
    let exerciseNames: string[] = [];
    
    if (tipo === "treino") {
      // CORREÇÃO: Buscar de exercise_gifs (406 ativos) ao invés de exercise_videos (vazia)
      const { data: gifs } = await supabaseClient
        .from("exercise_gifs")
        .select("exercise_name_pt, gif_url")
        .eq('status', 'active')
        .not('gif_url', 'is', null);
      
      if (gifs) {
        gifs.forEach((g: { exercise_name_pt: string; gif_url: string }) => {
          if (g.exercise_name_pt && g.gif_url) {
            exerciseVideos[g.exercise_name_pt.toLowerCase()] = g.gif_url;
            exerciseNames.push(g.exercise_name_pt);
          }
        });
        console.log(`Loaded ${gifs.length} exercise GIFs from database`);
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

    console.log(`Generating ${tipo} protocol for user ${targetUserId}, plan: ${planType}, weeks: ${durationWeeks}`);

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
      normalizeTreinoProtocol(protocolData);
      const treinoResult = validateTreinoProtocol(protocolData);
      validationResult = { valid: treinoResult.valid, errors: treinoResult.errors };
      
      // Auto-correction loop for treino (similar to nutrition)
      if (!treinoResult.valid && treinoResult.failedCriteria.length > 0) {
        console.log(`[treino-correction] Failed criteria: ${treinoResult.failedCriteria.join(", ")}. Attempting auto-correction...`);
        
        let correctionAttempts = 0;
        const maxCorrectionAttempts = 3;
        let currentData = protocolData;
        
        while (correctionAttempts < maxCorrectionAttempts) {
          correctionAttempts++;
          console.log(`[treino-correction] Attempt ${correctionAttempts}/${maxCorrectionAttempts}`);
          
          const correctionPrompt = `O protocolo de treino gerado FALHOU nos seguintes critérios obrigatórios:
${treinoResult.failedCriteria.map(c => `- ${c}`).join("\n")}

Erros específicos:
${treinoResult.errors.map(e => `- ${e}`).join("\n")}

PROTOCOLO ATUAL (corrija e retorne COMPLETO):
${JSON.stringify(currentData, null, 2).substring(0, 15000)}

INSTRUÇÕES DE CORREÇÃO:
- Corrija TODOS os critérios que falharam
- Mantenha todos os campos que já estavam corretos
- Retorne o JSON COMPLETO corrigido
- OBRIGATÓRIO: estrutura_semanal (dias da semana mapeados para treinos)
- OBRIGATÓRIO: carga_inicial e instrucao_tecnica em CADA exercício
- OBRIGATÓRIO: volume_semanal_detalhado (séries por grupo muscular como números)
- OBRIGATÓRIO: progressao_4_semanas (4 semanas, semana 4 = DELOAD com redução 30-40%)
- OBRIGATÓRIO: justificativa com campos volume, divisao, progressao

CORREÇÃO AUTOMÁTICA APLICADA:
- Liste as correções feitas`;

          try {
            const corrResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: correctionPrompt },
                ],
              }),
            });

            if (corrResp.ok) {
              const corrData = await corrResp.json();
              const corrContent = corrData.choices?.[0]?.message?.content || "";
              const cleanCorrContent = corrContent.replace(/```json\n?|\n?```/g, "").trim();
              try {
                const correctedData = JSON.parse(cleanCorrContent);
                normalizeTreinoProtocol(correctedData);
                const revalidation = validateTreinoProtocol(correctedData);
                console.log(`[treino-correction] Re-validation: ${revalidation.failedCriteria.length} criteria still failing`);
                
                if (revalidation.valid) {
                  protocolData = correctedData;
                  validationResult = { valid: true, errors: [] };
                  console.log(`[treino-correction] ✅ All criteria passed after correction ${correctionAttempts}`);
                  break;
                } else {
                  currentData = correctedData;
                  protocolData = correctedData;
                  validationResult = { valid: revalidation.valid, errors: revalidation.errors };
                }
              } catch (parseErr) {
                console.error(`[treino-correction] JSON parse error:`, parseErr);
              }
            } else {
              await corrResp.text();
              console.warn(`[treino-correction] AI correction call failed`);
            }
          } catch (corrErr) {
            console.error(`[treino-correction] Error in correction attempt:`, corrErr);
          }
        }
        
        if (!validationResult.valid) {
          console.warn(`[treino-correction] ⚠️ Protocol still incomplete after ${correctionAttempts} corrections. Saving with warning.`);
        }
      }
    } else if (tipo === "nutricao") {
      // Nutrition uses expanded validation with correction loop
      const nutResult = validateNutricaoProtocol(protocolData);
      validationResult = { valid: nutResult.valid, errors: nutResult.errors };
      
      if (!nutResult.valid && nutResult.failedCriteria.length > 0) {
        console.log(`[nutrition-correction] Failed criteria: ${nutResult.failedCriteria.join(", ")}. Attempting auto-correction...`);
        
        let correctionAttempts = 0;
        const maxCorrectionAttempts = 3;
        let currentData = protocolData;
        
        while (correctionAttempts < maxCorrectionAttempts) {
          correctionAttempts++;
          console.log(`[nutrition-correction] Attempt ${correctionAttempts}/${maxCorrectionAttempts}`);
          
          const correctionPrompt = `O protocolo nutricional gerado FALHOU nos seguintes critérios obrigatórios:
${nutResult.failedCriteria.map(c => `- ${c}`).join("\n")}

Erros específicos:
${nutResult.errors.map(e => `- ${e}`).join("\n")}

PROTOCOLO ATUAL (corrija e retorne COMPLETO):
${JSON.stringify(currentData, null, 2).substring(0, 15000)}

INSTRUÇÕES:
- Corrija TODOS os critérios que falharam
- Mantenha todos os campos que já estavam corretos
- Retorne o JSON COMPLETO corrigido, não apenas as correções
- NÃO altere horários das refeições
- Garanta que macros_diarios, plano_dia_treino, plano_dia_descanso, refeicao_pre_sono (3 opções), hidratacao, lista_compras_semanal e substituicoes estejam presentes`;

          try {
            const corrResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: correctionPrompt },
                ],
              }),
            });

            if (corrResp.ok) {
              const corrData = await corrResp.json();
              const corrContent = corrData.choices?.[0]?.message?.content || "";
              const cleanCorrContent = corrContent.replace(/```json\n?|\n?```/g, "").trim();
              try {
                const correctedData = JSON.parse(cleanCorrContent);
                const revalidation = validateNutricaoProtocol(correctedData);
                console.log(`[nutrition-correction] Re-validation: ${revalidation.failedCriteria.length} criteria still failing`);
                
                if (revalidation.valid) {
                  protocolData = correctedData;
                  validationResult = { valid: true, errors: [] };
                  console.log(`[nutrition-correction] ✅ All criteria passed after correction ${correctionAttempts}`);
                  break;
                } else {
                  currentData = correctedData;
                  protocolData = correctedData;
                  validationResult = { valid: revalidation.valid, errors: revalidation.errors };
                }
              } catch (parseErr) {
                console.error(`[nutrition-correction] JSON parse error:`, parseErr);
              }
            } else {
              await corrResp.text();
              console.warn(`[nutrition-correction] AI correction call failed`);
            }
          } catch (corrErr) {
            console.error(`[nutrition-correction] Error in correction attempt:`, corrErr);
          }
        }
        
        if (!validationResult.valid) {
          console.warn(`[nutrition-correction] ⚠️ Protocol still incomplete after ${correctionAttempts} corrections. Saving with warning.`);
        }
      }
    } else {
      validationResult = validateMindsetProtocol(protocolData);
    }

    if (!validationResult.valid) {
      console.error(`Schema validation failed for ${tipo}:`, validationResult.errors);
      console.error("First errors:", validationResult.errors.slice(0, 3));
    }
    
    console.log(`Schema validation ${validationResult.valid ? 'passed' : 'completed with warnings'} for ${tipo}`);

    // Função auxiliar para normalizar nomes de exercícios para matching
    const normalizeExerciseName = (name: string): string => {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\b(com|na|no|de|do|da|em|para|ao|os|as|um|uma|uns|umas)\b/g, "") // Remove preposições/artigos
        .replace(/\(.*?\)/g, "") // Remove conteúdo entre parênteses
        .replace(/\s+/g, " ")
        .trim();
    };

    // Enriquecer exercícios com URLs de GIF do banco de dados
    // Suporte para novo formato (treinos com letras) e formato legado (semanas)
    if (tipo === "treino" && Object.keys(exerciseVideos).length > 0) {
      let enrichedCount = 0;
      
      // Criar mapa normalizado para matching flexível
      const normalizedExerciseMap: Record<string, string> = {};
      for (const [name, url] of Object.entries(exerciseVideos)) {
        normalizedExerciseMap[normalizeExerciseName(name)] = url;
      }

      const enrichExercises = (exercicios: any[]) => {
        exercicios.forEach((ex: any) => {
          if (ex.nome && !ex.video_url) {
            const nomeNormalizado = normalizeExerciseName(ex.nome);
            
            // Busca exata normalizada primeiro
            if (normalizedExerciseMap[nomeNormalizado]) {
              ex.video_url = normalizedExerciseMap[nomeNormalizado];
              enrichedCount++;
            } else {
              // Busca parcial normalizada
              for (const [exerciseName, url] of Object.entries(normalizedExerciseMap)) {
                if (nomeNormalizado.includes(exerciseName) || exerciseName.includes(nomeNormalizado)) {
                  ex.video_url = url;
                  enrichedCount++;
                  break;
                }
              }
            }
          }
        });
      };

      // Novo formato: treinos com letras (A, B, C, D)
      if (protocolData.treinos && Array.isArray(protocolData.treinos)) {
        protocolData.treinos.forEach((treino: any) => {
          if (treino.exercicios) {
            enrichExercises(treino.exercicios);
          }
        });
      }

      // Formato legado: semanas com dias
      if (protocolData.semanas && Array.isArray(protocolData.semanas)) {
        protocolData.semanas.forEach((semana: any) => {
          if (semana.dias) {
            semana.dias.forEach((dia: any) => {
              if (dia.exercicios) {
                enrichExercises(dia.exercicios);
              }
            });
          }
        });
      }

      console.log(`Exercise GIFs enriched: ${enrichedCount} exercises matched`);
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
        // CRITICAL: always persist for the resolved target user
        user_id: targetUserId,
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

    console.log(`Protocol ${tipo} generated and saved successfully for user ${targetUserId}`);

    // === AUDIT STEP (admin-triggered or automatic) ===
    let auditResult = null;
    try {
      // Fetch anamnese data for audit context
      const { data: anamneseData } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const isNutricaoAudit = tipo === "nutricao";
        const auditCriteria = isNutricaoAudit 
          ? ["macros_definidos","macros_por_refeicao","pre_treino_presente","pos_treino_presente","pre_sono_presente","hidratacao_presente","dia_treino_vs_descanso","lista_compras_gerada","substituicoes_geradas","compativel_anamnese"]
          : ["coherence_anamnese","coherence_objective","restriction_respect","weekly_volume","muscle_distribution","progression_defined","instruction_clarity","mindset_quality","safety_score","estrutura_semanal_presente","exercicios_completos","volume_detalhado_presente","progressao_4sem_presente","justificativa_presente"];
        
        const auditSystemPrompt = isNutricaoAudit
          ? `Você é um auditor especialista em nutrição esportiva. Avalie os 10 critérios (true/false): ${auditCriteria.join(", ")}. Inclua issues[] e corrections_applied[]. Responda APENAS com JSON.`
          : `Você é um auditor especialista em fisiologia do exercício. Avalie os 14 critérios (true/false): ${auditCriteria.join(", ")}. Os 5 novos critérios verificam: estrutura_semanal_presente (dias da semana mapeados), exercicios_completos (carga_inicial + instrucao_tecnica em cada exercício), volume_detalhado_presente (séries numéricas por grupo), progressao_4sem_presente (4 semanas com DELOAD), justificativa_presente (volume, divisao, progressao). Inclua issues[] e corrections_applied[]. Responda APENAS com JSON.`;

        const auditUserPrompt = `ANAMNESE: ${JSON.stringify({
          full_name: anamneseData?.full_name,
          age: anamneseData?.age,
          sexo: anamneseData?.sexo,
          weight: anamneseData?.weight,
          height: anamneseData?.height,
          objetivo_principal: anamneseData?.objetivo_principal || anamneseData?.goals,
          nivel_experiencia: anamneseData?.nivel_experiencia,
          injuries: anamneseData?.injuries || anamneseData?.restricoes_medicas,
          condicoes_saude: anamneseData?.condicoes_saude,
          dias_disponiveis: anamneseData?.dias_disponiveis,
        })}\n\nPROTOCOLO (${tipo}):\n${JSON.stringify(protocolData).substring(0, 12000)}`;

        const auditResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: auditSystemPrompt },
              { role: "user", content: auditUserPrompt },
            ],
          }),
        });

        if (auditResp.ok) {
          const auditData = await auditResp.json();
          const auditContent = auditData.choices?.[0]?.message?.content || "";
          try {
            const auditMatch = auditContent.match(/\{[\s\S]*\}/);
            if (auditMatch) {
              auditResult = JSON.parse(auditMatch[0]);
              let passed = 0;
              for (const c of auditCriteria) { if (auditResult[c] === true) passed++; }
              auditResult.final_score = Math.round((passed / auditCriteria.length) * 100);
              auditResult.classification = auditResult.final_score >= 95 ? "Excelente" : auditResult.final_score >= 85 ? "Muito bom" : auditResult.final_score >= 75 ? "Aceitável" : "Requer correção";
              auditResult.audited_at = new Date().toISOString();
              auditResult.audit_type = tipo;

              // Save audit result
              await supabaseClient
                .from("protocolos")
                .update({ audit_result: auditResult })
                .eq("id", savedProtocol.id);

              console.log(`[audit] Protocol ${savedProtocol.id} scored ${auditResult.final_score}/100`);
            }
          } catch (parseErr) {
            console.error("[audit] Failed to parse audit result:", parseErr);
          }
        } else {
          await auditResp.text();
          console.warn("[audit] AI audit call failed, skipping");
        }
      }
    } catch (auditErr) {
      console.error("[audit] Audit step failed (non-blocking):", auditErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      protocol: savedProtocol,
      data: protocolData,
      audit: auditResult,
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
