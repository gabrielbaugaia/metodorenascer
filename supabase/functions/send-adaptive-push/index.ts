import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

const PROFILE_MESSAGES: Record<string, { title: string; body: string }> = {
  consistent: {
    title: "🔥 Padrão forte",
    body: "Sua consistência está construindo momentum. Continue assim.",
  },
  explorer: {
    title: "🧠 Experimento rápido",
    body: "Tente uma ação de 2 minutos agora. Pequenos passos importam.",
  },
  resistant: {
    title: "⚡ Apenas comece",
    body: "Comece com 2 minutos de movimento. É tudo que precisa.",
  },
  executor: {
    title: "🎯 Pronto",
    body: "Sua próxima ação está esperando. Vamos lá.",
  },
};

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch all behavior profiles
    const { data: profiles, error } = await supabase
      .from("behavior_profiles")
      .select("user_id, profile_type");

    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      return createSuccessResponse(req, { sent: 0, message: "No profiles found" });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      const msg = PROFILE_MESSAGES[profile.profile_type] || PROFILE_MESSAGES.executor;

      try {
        const { error: pushErr } = await supabase.functions.invoke("send-push", {
          body: {
            user_id: profile.user_id,
            notification_type: "custom",
            title: msg.title,
            body: msg.body,
          },
        });

        if (pushErr) {
          errors.push(`${profile.user_id}: ${pushErr.message}`);
        } else {
          sentCount++;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${profile.user_id}: ${msg}`);
      }
    }

    return createSuccessResponse(req, {
      sent: sentCount,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("send-adaptive-push error:", err);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
