import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CHECK-FREE-EXPIRATION] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    logStep("Starting free subscription expiration check");

    // Find free subscriptions that have expired and haven't been blocked yet
    const now = new Date().toISOString();
    
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        invitation_expires_at,
        created_at
      `)
      .eq("status", "free")
      .eq("access_blocked", false)
      .lt("invitation_expires_at", now);

    if (fetchError) {
      logStep("Error fetching expired subscriptions", { error: fetchError.message });
      throw fetchError;
    }

    logStep("Found expired subscriptions", { count: expiredSubscriptions?.length || 0 });

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No expired subscriptions found",
        blocked: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const blockedUsers: string[] = [];

    for (const subscription of expiredSubscriptions) {
      // Check if user has accessed the system
      const { data: activity } = await supabase
        .from("user_activity")
        .select("last_access")
        .eq("user_id", subscription.user_id)
        .maybeSingle();

      const hasAccessed = activity?.last_access !== null;

      // Check if anamnese was completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("anamnese_completa, full_name, email")
        .eq("id", subscription.user_id)
        .maybeSingle();

      const anamneseComplete = profile?.anamnese_completa === true;

      logStep("Checking user", { 
        userId: subscription.user_id, 
        hasAccessed, 
        anamneseComplete,
        expiresAt: subscription.invitation_expires_at
      });

      // Block if hasn't accessed OR hasn't completed anamnese
      if (!hasAccessed || !anamneseComplete) {
        // Update subscription to blocked
        const { error: updateSubError } = await supabase
          .from("subscriptions")
          .update({
            access_blocked: true,
            blocked_reason: "Acesso expirado por inatividade após 7 dias"
          })
          .eq("id", subscription.id);

        if (updateSubError) {
          logStep("Error blocking subscription", { error: updateSubError.message });
          continue;
        }

        // Update profile status to blocked
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update({ client_status: "blocked" })
          .eq("id", subscription.user_id);

        if (updateProfileError) {
          logStep("Error updating profile status", { error: updateProfileError.message });
        }

        // Add notification to user's conversation
        const blockMessage = {
          role: "system",
          content: `⚠️ Seu acesso expirou após 7 dias sem uso do sistema. Para liberar seu acesso imediatamente, entre em contato com o administrador ou adquira um plano pago.`,
          timestamp: now
        };

        // Get or create conversation
        const { data: existingConvo } = await supabase
          .from("conversas")
          .select("id, mensagens")
          .eq("user_id", subscription.user_id)
          .eq("tipo", "suporte")
          .maybeSingle();

        if (existingConvo) {
          const messages = Array.isArray(existingConvo.mensagens) 
            ? existingConvo.mensagens 
            : [];
          messages.push(blockMessage);
          
          await supabase
            .from("conversas")
            .update({ mensagens: messages, updated_at: now })
            .eq("id", existingConvo.id);
        } else {
          await supabase
            .from("conversas")
            .insert({
              user_id: subscription.user_id,
              tipo: "suporte",
              mensagens: [blockMessage]
            });
        }

        blockedUsers.push(subscription.user_id);
        logStep("User blocked successfully", { userId: subscription.user_id });
      }
    }

    logStep("Expiration check completed", { blockedCount: blockedUsers.length });

    return new Response(JSON.stringify({ 
      message: "Expiration check completed",
      blocked: blockedUsers.length,
      blockedUsers
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Fatal error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
