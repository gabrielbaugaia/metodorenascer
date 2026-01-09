import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[COMPLETE-GUEST-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    
    if (!session_id) {
      logStep("Missing session_id");
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Looking up pending login", { session_id });

    // Buscar pending_login não usado e não expirado
    const { data: pending, error: pendingError } = await supabase
      .from("pending_logins")
      .select("user_id, temp_password, used_at, expires_at")
      .eq("session_id", session_id)
      .maybeSingle();

    if (pendingError) {
      logStep("Error fetching pending login", { error: pendingError.message });
      return new Response(
        JSON.stringify({ error: "database_error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pending) {
      logStep("Pending login not found");
      return new Response(
        JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (pending.used_at) {
      logStep("Pending login already used");
      return new Response(
        JSON.stringify({ error: "already_used" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(pending.expires_at) < new Date()) {
      logStep("Pending login expired");
      return new Response(
        JSON.stringify({ error: "expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar email do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", pending.user_id)
      .single();

    if (profileError || !profile?.email) {
      logStep("Profile not found", { userId: pending.user_id });
      return new Response(
        JSON.stringify({ error: "profile_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como usado
    const { error: updateError } = await supabase
      .from("pending_logins")
      .update({ used_at: new Date().toISOString() })
      .eq("session_id", session_id);

    if (updateError) {
      logStep("Error marking as used", { error: updateError.message });
    }

    logStep("Guest checkout completed", { email: profile.email });

    return new Response(
      JSON.stringify({
        email: profile.email,
        temp_password: pending.temp_password,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("Error", { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
