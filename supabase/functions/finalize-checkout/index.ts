import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINALIZE-CHECKOUT] ${step}${detailsStr}`);
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

    const { session_id } = await req.json();
    
    if (!session_id) {
      logStep("Missing session_id");
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Processing session", { session_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "customer"],
    });

    logStep("Session retrieved", { 
      mode: session.mode,
      status: session.status,
      paymentStatus: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription,
    });

    if (session.mode !== "subscription") {
      return new Response(
        JSON.stringify({ error: "Not a subscription session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = typeof session.customer === "string" 
      ? session.customer 
      : session.customer?.id;
    
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

    if (!customerId || !subscriptionId) {
      throw new Error("Missing customer or subscription ID");
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    logStep("Subscription retrieved", {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price?.id,
    });

    // Get customer email
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = !customer.deleted && "email" in customer ? customer.email : null;

    if (!customerEmail) {
      throw new Error("Customer email not found");
    }

    logStep("Customer email", { email: customerEmail });

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Error finding profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error(`No profile found for email: ${customerEmail}`);
    }

    const userId = profile.id;
    logStep("User found", { userId });

    // Get plan info
    const priceId = subscription.items.data[0]?.price?.id;
    const planInfo = priceId ? PRICE_TO_PLAN[priceId] : null;
    const mrrValue = priceId ? PRICE_TO_MRR[priceId] : null;
    const priceCents = subscription.items.data[0]?.price?.unit_amount || null;

    // Upsert subscription in database
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: subscription.status === "active" || subscription.status === "trialing" ? "active" : subscription.status,
      plan_type: planInfo?.type || "unknown",
      plan_name: planInfo?.name || "Plano Desconhecido",
      price_cents: priceCents,
      mrr_value: mrrValue,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      started_at: subscription.start_date 
        ? new Date(subscription.start_date * 1000).toISOString() 
        : new Date().toISOString(),
      access_blocked: false,
      blocked_reason: null,
      updated_at: new Date().toISOString(),
    };

    logStep("Upserting subscription", {
      userId,
      status: subscriptionData.status,
      planType: subscriptionData.plan_type,
    });

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" });

    if (upsertError) {
      logStep("Error upserting subscription", { error: upsertError.message });
      throw new Error(`Error upserting subscription: ${upsertError.message}`);
    }

    logStep("Subscription finalized successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        status: subscriptionData.status,
        planType: subscriptionData.plan_type,
        planName: subscriptionData.plan_name,
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
