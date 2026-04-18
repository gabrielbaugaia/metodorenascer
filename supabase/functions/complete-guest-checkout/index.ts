import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/cors.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[COMPLETE-GUEST-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();

    if (!session_id || typeof session_id !== "string") {
      return createErrorResponse(req, "session_id is required", 400);
    }

    logStep("Looking up pending login", { session_id });

    // Atomic claim: only return the row if it hasn't been used yet AND is still valid.
    // We update used_at in the same statement to prevent race conditions and
    // double-retrieval of the credentials.
    const nowIso = new Date().toISOString();
    const { data: claimed, error: claimError } = await supabase
      .from("pending_logins")
      .update({ used_at: nowIso })
      .eq("session_id", session_id)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .select("user_id, temp_password")
      .maybeSingle();

    if (claimError) {
      logStep("Error claiming pending login", { error: claimError.message });
      return createErrorResponse(req, "database_error", 500);
    }

    if (!claimed) {
      // Either not found, already used, or expired — do not leak which one.
      logStep("Pending login unavailable (not found / used / expired)");
      return createErrorResponse(req, "invalid_or_expired", 410);
    }

    // Fetch email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", claimed.user_id)
      .single();

    if (profileError || !profile?.email) {
      logStep("Profile not found", { userId: claimed.user_id });
      return createErrorResponse(req, "profile_not_found", 404);
    }

    const tempPassword = claimed.temp_password;

    // Immediately wipe the plaintext password from the database so it can
    // never be retrieved again, even by an attacker with DB read access.
    const { error: wipeError } = await supabase
      .from("pending_logins")
      .update({ temp_password: "" })
      .eq("session_id", session_id);

    if (wipeError) {
      logStep("Warning: failed to wipe temp_password", { error: wipeError.message });
    }

    logStep("Guest checkout completed", { email: profile.email });

    return createSuccessResponse(req, {
      email: profile.email,
      temp_password: tempPassword,
    });
  } catch (error) {
    logStep("Error", { error: error instanceof Error ? error.message : String(error) });
    return createErrorResponse(req, "internal_error", 500);
  }
});
