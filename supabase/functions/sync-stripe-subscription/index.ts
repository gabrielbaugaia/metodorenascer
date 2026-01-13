import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-STRIPE-SUB] ${step}${detailsStr}`);
};

// Safe timestamp to ISO conversion helper
const safeTimestampToISO = (timestamp: number | undefined | null, fallback?: number): string => {
  const ts = timestamp ?? fallback;
  if (!ts || typeof ts !== 'number' || isNaN(ts)) {
    return new Date().toISOString();
  }
  const date = new Date(ts * 1000);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

// Price ID to plan type mapping
const PRICE_TO_PLAN: Record<string, { type: string; name: string }> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": { type: "embaixador", name: "ELITE Fundador" },
  "price_1ScZrECuFZvf5xFdfS9W8kvY": { type: "mensal", name: "Mensal" },
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": { type: "trimestral", name: "Trimestral" },
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": { type: "semestral", name: "Semestral" },
  "price_1ScZvCCuFZvf5xFdjrs51JQB": { type: "anual", name: "Anual" },
};

const PRICE_TO_MRR: Record<string, number> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": 4990,
  "price_1ScZrECuFZvf5xFdfS9W8kvY": 19700,
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": 16567,
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": 11617,
  "price_1ScZvCCuFZvf5xFdjrs51JQB": 8308,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    logStep("Admin verified", { adminId: userData.user.id });

    const { user_id, email } = await req.json();

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: "user_id or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user profile
    let userEmail = email;
    let userId = user_id;

    if (user_id && !email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("id", user_id)
        .maybeSingle();

      if (!profile?.email) {
        throw new Error("User profile not found or no email");
      }
      userEmail = profile.email;
      userId = profile.id;
    } else if (email && !user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (!profile) {
        throw new Error("User profile not found");
      }
      userId = profile.id;
      userEmail = profile.email;
    }

    logStep("User found", { userId, email: userEmail });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { email: userEmail });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Nenhum cliente Stripe encontrado para este email",
          email: userEmail,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customer = customers.data[0];
    logStep("Stripe customer found", { customerId: customer.id });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    // Prefer active, then trialing, then most recent
    let targetSub = subscriptions.data.find((s: Stripe.Subscription) => s.status === "active");
    if (!targetSub) {
      targetSub = subscriptions.data.find((s: Stripe.Subscription) => s.status === "trialing");
    }
    if (!targetSub && subscriptions.data.length > 0) {
      targetSub = subscriptions.data[0]; // Most recent
    }

    if (!targetSub) {
      logStep("No subscriptions found in Stripe");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Nenhuma assinatura encontrada no Stripe",
          customerId: customer.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Subscription found", { 
      subscriptionId: targetSub.id, 
      status: targetSub.status,
      priceId: targetSub.items.data[0]?.price?.id,
    });

    // Get plan info
    const priceId = targetSub.items.data[0]?.price?.id;
    const planInfo = priceId ? PRICE_TO_PLAN[priceId] : null;
    const mrrValue = priceId ? PRICE_TO_MRR[priceId] : null;
    const priceCents = targetSub.items.data[0]?.price?.unit_amount || null;

    // Determine status
    let dbStatus = targetSub.status;
    if (targetSub.status === "active" || targetSub.status === "trialing") {
      dbStatus = "active";
    }

    // Upsert subscription
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: customer.id,
      stripe_subscription_id: targetSub.id,
      status: dbStatus,
      plan_type: planInfo?.type || "unknown",
      plan_name: planInfo?.name || "Plano Desconhecido",
      price_cents: priceCents,
      mrr_value: mrrValue,
      current_period_start: safeTimestampToISO(targetSub.current_period_start),
      current_period_end: safeTimestampToISO(targetSub.current_period_end),
      started_at: safeTimestampToISO(targetSub.start_date, targetSub.created),
      access_blocked: false,
      blocked_reason: null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" });

    if (upsertError) {
      throw new Error(`Error upserting subscription: ${upsertError.message}`);
    }

    logStep("Subscription synced successfully", { 
      userId, 
      status: dbStatus, 
      planType: planInfo?.type 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Assinatura sincronizada com sucesso",
        subscription: {
          status: dbStatus,
          planType: planInfo?.type,
          planName: planInfo?.name,
          stripeStatus: targetSub.status,
          currentPeriodEnd: subscriptionData.current_period_end,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
