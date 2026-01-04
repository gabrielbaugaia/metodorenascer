import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-ADMIN] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return createErrorResponse(req, "Não autorizado", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify user token
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Invalid token", { error: userError?.message });
      return createErrorResponse(req, "Token inválido", 401);
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Check admin role in user_roles table
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      logStep("Error checking role", { error: roleError.message });
      return createErrorResponse(req, "Erro ao verificar permissões", 500);
    }

    const isAdmin = !!roleData;
    logStep("Admin check result", { userId, isAdmin });

    return createSuccessResponse(req, { 
      is_admin: isAdmin,
      user_id: userId 
    });

  } catch (error) {
    console.error("[VERIFY-ADMIN] Error:", error);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
