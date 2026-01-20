import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  createSuccessResponse,
  createErrorResponse,
} from "../_shared/cors.ts";

interface Exercise {
  nome: string;
  series?: number;
  repeticoes?: string;
  descanso?: string;
  video_url?: string;
  dicas?: string;
}

interface Day {
  dia: string;
  foco: string;
  exercicios: Exercise[];
}

interface Week {
  dias: Day[];
}

interface ProtocolContent {
  titulo?: string;
  nivel?: string;
  semanas?: Week[];
}

const isYouTubeUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
};

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(req, "Não autorizado", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return createErrorResponse(req, "Não autorizado", 401);
    }

    // Check admin role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roles?.role !== "admin") {
      return createErrorResponse(req, "Acesso negado. Apenas administradores.", 403);
    }

    console.log("Starting YouTube URL cleanup...");

    // Fetch all active training protocols
    const { data: protocols, error: protocolsError } = await supabaseClient
      .from("protocolos")
      .select("id, user_id, conteudo, titulo")
      .eq("tipo", "treino")
      .eq("ativo", true);

    if (protocolsError) {
      console.error("Error fetching protocols:", protocolsError);
      throw new Error("Erro ao buscar protocolos");
    }

    console.log(`Found ${protocols?.length || 0} active training protocols`);

    let protocolsUpdated = 0;
    let youtubeUrlsRemoved = 0;

    for (const protocol of protocols || []) {
      const content = protocol.conteudo as ProtocolContent;
      let protocolModified = false;

      if (content?.semanas) {
        for (const week of content.semanas) {
          if (week.dias) {
            for (const day of week.dias) {
              if (day.exercicios) {
                for (const exercise of day.exercicios) {
                  if (isYouTubeUrl(exercise.video_url)) {
                    console.log(`Removing YouTube URL from "${exercise.nome}" in protocol ${protocol.id}`);
                    exercise.video_url = "";
                    youtubeUrlsRemoved++;
                    protocolModified = true;
                  }
                }
              }
            }
          }
        }
      }

      if (protocolModified) {
        const { error: updateError } = await supabaseClient
          .from("protocolos")
          .update({ conteudo: content })
          .eq("id", protocol.id);

        if (updateError) {
          console.error(`Error updating protocol ${protocol.id}:`, updateError);
        } else {
          protocolsUpdated++;
          console.log(`Updated protocol ${protocol.id} (${protocol.titulo})`);
        }
      }
    }

    console.log(`Cleanup complete: ${youtubeUrlsRemoved} YouTube URLs removed from ${protocolsUpdated} protocols`);

    return createSuccessResponse(req, {
      success: true,
      message: `${youtubeUrlsRemoved} URLs do YouTube removidas de ${protocolsUpdated} protocolos`,
      protocolsUpdated,
      youtubeUrlsRemoved,
      totalProtocols: protocols?.length || 0,
    });
  } catch (error) {
    console.error("Clean YouTube URLs error:", error);
    return createErrorResponse(
      req,
      error instanceof Error ? error.message : "Erro interno",
      500
    );
  }
});
