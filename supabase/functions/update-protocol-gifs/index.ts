import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

interface ExerciseGif {
  exercise_name_pt: string;
  gif_url: string;
}

interface Exercise {
  nome: string;
  video_url?: string;
  [key: string]: unknown;
}

interface Day {
  exercicios?: Exercise[];
  [key: string]: unknown;
}

interface Week {
  dias?: Day[];
  [key: string]: unknown;
}

interface ProtocolContent {
  semanas?: Week[];
  treinos?: Day[];
  [key: string]: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(req, "Não autorizado - sessão não encontrada", 401);
    }

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

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return createErrorResponse(req, "Acesso negado - apenas administradores", 403);
    }

    console.log("Admin user:", user.id, "starting protocol GIF update");

    // Fetch all active GIFs
    const { data: gifs, error: gifsError } = await supabaseClient
      .from("exercise_gifs")
      .select("exercise_name_pt, gif_url")
      .eq("status", "active")
      .not("gif_url", "is", null);

    if (gifsError) {
      console.error("Error fetching GIFs:", gifsError);
      throw new Error("Erro ao buscar GIFs");
    }

    // Create lookup map
    const gifMap: Record<string, string> = {};
    (gifs || []).forEach((g: ExerciseGif) => {
      if (g.exercise_name_pt && g.gif_url) {
        gifMap[g.exercise_name_pt.toLowerCase()] = g.gif_url;
      }
    });

    console.log(`Loaded ${Object.keys(gifMap).length} GIFs for matching`);

    // Fetch all active training protocols
    const { data: protocols, error: protocolsError } = await supabaseClient
      .from("protocolos")
      .select("id, conteudo, user_id")
      .eq("tipo", "treino")
      .eq("ativo", true);

    if (protocolsError) {
      console.error("Error fetching protocols:", protocolsError);
      throw new Error("Erro ao buscar protocolos");
    }

    console.log(`Found ${protocols?.length || 0} active training protocols to update`);

    let updatedCount = 0;
    let totalExercisesUpdated = 0;

    for (const protocol of protocols || []) {
      const content = protocol.conteudo as ProtocolContent;
      let protocolModified = false;
      let exercisesUpdated = 0;

      // Helper function to update exercises
      const updateExercises = (exercises: Exercise[]) => {
        exercises.forEach((ex) => {
          if (ex.nome) {
            const nomeNormalizado = ex.nome.toLowerCase().trim();
            
            // Try exact match first
            if (gifMap[nomeNormalizado]) {
              if (ex.video_url !== gifMap[nomeNormalizado]) {
                ex.video_url = gifMap[nomeNormalizado];
                exercisesUpdated++;
                protocolModified = true;
              }
            } else {
              // Try partial match
              for (const [exerciseName, url] of Object.entries(gifMap)) {
                if (nomeNormalizado.includes(exerciseName) || exerciseName.includes(nomeNormalizado)) {
                  if (ex.video_url !== url) {
                    ex.video_url = url;
                    exercisesUpdated++;
                    protocolModified = true;
                  }
                  break;
                }
              }
            }
          }
        });
      };

      // Handle new format (semanas)
      if (content.semanas) {
        content.semanas.forEach((semana) => {
          if (semana.dias) {
            semana.dias.forEach((dia) => {
              if (dia.exercicios) {
                updateExercises(dia.exercicios);
              }
            });
          }
        });
      }

      // Handle legacy format (treinos)
      if (content.treinos) {
        content.treinos.forEach((treino) => {
          if (treino.exercicios) {
            updateExercises(treino.exercicios);
          }
        });
      }

      // Save updated protocol
      if (protocolModified) {
        const { error: updateError } = await supabaseClient
          .from("protocolos")
          .update({ conteudo: content })
          .eq("id", protocol.id);

        if (updateError) {
          console.error(`Error updating protocol ${protocol.id}:`, updateError);
        } else {
          updatedCount++;
          totalExercisesUpdated += exercisesUpdated;
          console.log(`Updated protocol ${protocol.id} for user ${protocol.user_id}: ${exercisesUpdated} exercises`);
        }
      }
    }

    console.log(`Update complete: ${updatedCount} protocols updated, ${totalExercisesUpdated} exercises enriched`);

    return createSuccessResponse(req, {
      success: true,
      protocolsUpdated: updatedCount,
      exercisesEnriched: totalExercisesUpdated,
      totalProtocols: protocols?.length || 0,
      availableGifs: Object.keys(gifMap).length,
    });
  } catch (error) {
    console.error("Update protocol GIFs error:", error);
    return createErrorResponse(req, "Erro ao atualizar GIFs dos protocolos", 500);
  }
});
