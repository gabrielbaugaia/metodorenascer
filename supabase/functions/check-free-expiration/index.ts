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

    const now = new Date().toISOString();
    const blockedUsers: string[] = [];

    // ===== RULE 1: Original - invitation_expires_at expired (7-day inactivity check) =====
    const { data: expiredByInvitation, error: fetchError1 } = await supabase
      .from("subscriptions")
      .select("id, user_id, invitation_expires_at, created_at")
      .eq("status", "free")
      .eq("access_blocked", false)
      .lt("invitation_expires_at", now);

    if (fetchError1) {
      logStep("Error fetching expired-by-invitation subscriptions", { error: fetchError1.message });
      throw fetchError1;
    }

    logStep("Found expired-by-invitation subscriptions", { count: expiredByInvitation?.length || 0 });

    for (const subscription of expiredByInvitation || []) {
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

      logStep("Checking user (invitation rule)", { 
        userId: subscription.user_id, 
        hasAccessed, 
        anamneseComplete,
        expiresAt: subscription.invitation_expires_at
      });

      // Block if hasn't accessed OR hasn't completed anamnese
      if (!hasAccessed || !anamneseComplete) {
        await blockUser(supabase, subscription.id, subscription.user_id, 
          "Acesso expirado por inatividade após 7 dias", now);
        blockedUsers.push(subscription.user_id);
        logStep("User blocked (invitation rule)", { userId: subscription.user_id });
      }
    }

    // ===== RULE 2: New - Free plan older than 30 days (absolute expiration) =====
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const { data: expiredBy30Days, error: fetchError2 } = await supabase
      .from("subscriptions")
      .select("id, user_id, created_at")
      .eq("status", "free")
      .eq("access_blocked", false)
      .lt("created_at", thirtyDaysAgoISO);

    if (fetchError2) {
      logStep("Error fetching expired-by-30-days subscriptions", { error: fetchError2.message });
      throw fetchError2;
    }

    // Filter out users already blocked by Rule 1
    const newToBlock = (expiredBy30Days || []).filter(
      (s) => !blockedUsers.includes(s.user_id)
    );

    logStep("Found expired-by-30-days subscriptions", { count: newToBlock.length });

    for (const subscription of newToBlock) {
      await blockUser(supabase, subscription.id, subscription.user_id, 
        "Plano gratuito expirado após 30 dias. Assine para continuar.", now);
      
      // Also set entitlements to 'none' (no trial override)
      const { error: entError } = await supabase
        .from("entitlements")
        .upsert({
          user_id: subscription.user_id,
          access_level: "none",
          override_level: null,
          override_expires_at: null,
          updated_at: now,
        }, { onConflict: "user_id" });

      if (entError) {
        logStep("Error updating entitlements", { error: entError.message, userId: subscription.user_id });
      }

      blockedUsers.push(subscription.user_id);
      logStep("User blocked (30-day rule)", { userId: subscription.user_id });
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

// Helper to block a user's subscription and update profile
async function blockUser(
  supabase: ReturnType<typeof createClient>,
  subscriptionId: string,
  userId: string,
  reason: string,
  now: string
) {
  // Update subscription to blocked
  const { error: updateSubError } = await supabase
    .from("subscriptions")
    .update({
      access_blocked: true,
      blocked_reason: reason,
    })
    .eq("id", subscriptionId);

  if (updateSubError) {
    logStep("Error blocking subscription", { error: updateSubError.message });
    return;
  }

  // Update profile status to blocked
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ client_status: "blocked" })
    .eq("id", userId);

  if (updateProfileError) {
    logStep("Error updating profile status", { error: updateProfileError.message });
  }

  // Add notification to user's conversation
  const blockMessage = {
    role: "system",
    content: `⚠️ ${reason}`,
    timestamp: now,
  };

  const { data: existingConvo } = await supabase
    .from("conversas")
    .select("id, mensagens")
    .eq("user_id", userId)
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
        user_id: userId,
        tipo: "suporte",
        mensagens: [blockMessage],
      });
  }
}
