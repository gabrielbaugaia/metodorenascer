import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, mapErrorToUserMessage } from "../_shared/cors.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("Authentication error from auth.getUser", { message: userError.message });

      if (userError.message.includes("Auth session missing")) {
        return new Response(
          JSON.stringify({
            subscribed: false,
            subscription_end: null,
            product_id: null,
            error: "unauthenticated",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check local subscription in database (including free/manual plans)
    const { data: localSub, error: localError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "free", "trialing"])
      .eq("access_blocked", false)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (localError) {
      logStep("Local subscription query error", { message: localError.message });
    }

    if (localSub && (!localSub.current_period_end || new Date(localSub.current_period_end) > new Date())) {
      logStep("Active local subscription found", {
        plan_type: localSub.plan_type,
        status: localSub.status,
        ends_at: localSub.current_period_end,
      });

      // For free/gratuito plans, return immediately without checking Stripe
      const isFreePlan = localSub.plan_type === "gratuito" || 
                         localSub.status === "free" || 
                         (localSub.stripe_customer_id && localSub.stripe_customer_id.startsWith("invite_"));

      if (isFreePlan) {
        logStep("Free plan detected, skipping Stripe check");
        return new Response(
          JSON.stringify({
            subscribed: true,
            subscription_end: localSub.current_period_end,
            product_id: null,
            plan_type: localSub.plan_type,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      // For paid plans with valid local subscription, still return success
      return new Response(
        JSON.stringify({
          subscribed: true,
          subscription_end: localSub.current_period_end,
          product_id: null,
          plan_type: localSub.plan_type,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ subscribed: false, subscription_end: null, product_id: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const customerId = customers.data[0].id;
    logStep("Stripe customer found", { customerId });

    // Check for active OR trialing subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscription = activeSubscriptions.data[0] || null;

    // If no active subscription, check for trialing
    if (!subscription) {
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      subscription = trialingSubscriptions.data[0] || null;
    }

    if (!subscription) {
      logStep("No active or trialing subscription found");
      
      // Update local subscription status
      await supabaseClient
        .from("subscriptions")
        .update({ status: "inactive" })
        .eq("user_id", user.id);

      // Also reset entitlements
      await supabaseClient
        .from("entitlements")
        .upsert({
          user_id: user.id,
          access_level: "none",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({ subscribed: false, subscription_end: null, product_id: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const productId = subscription.items.data[0]?.price?.product as string;
    
    logStep("Valid subscription found", { 
      subscriptionId: subscription.id,
      stripeStatus: subscription.status,
      endDate: subscriptionEnd,
      productId 
    });

    // Check if this user was referred and credit cashback to referrer
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("referred_by_code")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData?.referred_by_code) {
      // Check if referral exists and hasn't been credited yet
      const { data: referralData } = await supabaseClient
        .from("referrals")
        .select("id, discount_applied, referrer_id")
        .eq("referred_user_id", user.id)
        .eq("discount_applied", false)
        .maybeSingle();

      if (referralData) {
        logStep("Found uncredited referral, crediting cashback", { 
          referralId: referralData.id,
          referrerId: referralData.referrer_id 
        });

        // Increment referrer's cashback balance
        const { error: incrementError } = await supabaseClient
          .rpc("increment_cashback_balance", { 
            target_user_id: referralData.referrer_id 
          });

        if (incrementError) {
          // Fallback: manual increment if RPC doesn't exist
          const { data: referrerProfile } = await supabaseClient
            .from("profiles")
            .select("cashback_balance")
            .eq("id", referralData.referrer_id)
            .maybeSingle();

          const currentBalance = referrerProfile?.cashback_balance || 0;
          await supabaseClient
            .from("profiles")
            .update({ cashback_balance: currentBalance + 1 })
            .eq("id", referralData.referrer_id);
        }

        // Mark referral as credited
        await supabaseClient
          .from("referrals")
          .update({ 
            discount_applied: true, 
            discount_applied_at: new Date().toISOString() 
          })
          .eq("id", referralData.id);

        logStep("Cashback credited successfully");
      }
    }

    // Price ID to plan type mapping - STANDARDIZED names
    const PRICE_TO_PLAN: Record<string, { type: string; name: string }> = {
      "price_1ScZqTCuFZvf5xFdZuOBMzpt": { type: "elite_fundador", name: "ELITE FUNDADOR" },
      "price_1ScZrECuFZvf5xFdfS9W8kvY": { type: "mensal", name: "MENSAL" },
      "price_1ScZsTCuFZvf5xFdbW8kJeQF": { type: "trimestral", name: "TRIMESTRAL" },
      "price_1ScZtrCuFZvf5xFd8iXDfbEp": { type: "semestral", name: "SEMESTRAL" },
      "price_1ScZvCCuFZvf5xFdjrs51JQB": { type: "anual", name: "ANUAL" },
    };

    const priceId = subscription.items.data[0]?.price?.id;
    const planInfo = priceId ? PRICE_TO_PLAN[priceId] : null;
    const planType = planInfo?.type || "unknown";
    const planName = planInfo?.name || "Plano Desconhecido";

    logStep("Plan info resolved", { priceId, planType, planName });

    // Upsert subscription in local database
    const { error: upsertError } = await supabaseClient
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: "active",
        plan_type: planType,
        plan_name: planName,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      logStep("Error upserting subscription", { error: upsertError.message });
    }

    // Ensure entitlements are updated to "full" for active/trialing subscriptions
    const { error: entitlementError } = await supabaseClient
      .from("entitlements")
      .upsert({
        user_id: user.id,
        access_level: "full",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (entitlementError) {
      logStep("Error upserting entitlement", { error: entitlementError.message });
    } else {
      logStep("Entitlement updated to full");
    }

    return new Response(
      JSON.stringify({
        subscribed: true,
        subscription_end: subscriptionEnd,
        product_id: productId,
        customer_id: customerId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error);
    const userMessage = mapErrorToUserMessage(error);
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
