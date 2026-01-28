import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, mapErrorToUserMessage } from "../_shared/cors.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for each plan
const VALID_PRICE_IDS = [
  "price_1ScZqTCuFZvf5xFdZuOBMzpt", // Embaixador
  "price_1ScZrECuFZvf5xFdfS9W8kvY", // Mensal
  "price_1ScZsTCuFZvf5xFdbW8kJeQF", // Trimestral
  "price_1ScZtrCuFZvf5xFd8iXDfbEp", // Semestral
  "price_1ScZvCCuFZvf5xFdjrs51JQB", // Anual
];

// Embaixador plan constants
const EMBAIXADOR_PRICE_ID = "price_1ScZqTCuFZvf5xFdZuOBMzpt";
const MAX_EMBAIXADOR_MEMBERS = 25;

// 10% discount coupon ID for referral cashback
const REFERRAL_DISCOUNT_PERCENT = 10;

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    logStep("Function started");

    // Get price_id and UTM data from request body
    const body = await req.json().catch(() => ({}));
    const priceId = body.price_id || "price_1ScZqTCuFZvf5xFdZuOBMzpt"; // Default to Embaixador
    const applyReferralDiscount = body.apply_referral_discount === true;
    const utmData = body.utm_data || {}; // UTM parameters from frontend
    
    if (!VALID_PRICE_IDS.includes(priceId)) {
      throw new Error("Invalid price ID");
    }
    logStep("Price ID received", { priceId, applyReferralDiscount, hasUtmData: Object.keys(utmData).length > 0 });

    // Use service role key to check embaixador count and cashback balance
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check Embaixador limit if user is trying to subscribe to that plan
    if (priceId === EMBAIXADOR_PRICE_ID) {
      const { count, error: countError } = await supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", "embaixador")
        .eq("status", "active");
      
      if (countError) {
        logStep("Error counting Embaixador subscriptions", { error: countError.message });
      }
      
      const currentCount = count || 0;
      logStep("Embaixador count checked", { currentCount, max: MAX_EMBAIXADOR_MEMBERS });
      
      if (currentCount >= MAX_EMBAIXADOR_MEMBERS) {
        return new Response(
          JSON.stringify({ 
            error: "O plano ELITE Fundador atingiu o limite de 25 membros. Por favor, escolha outro plano." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Check if user is authenticated (optional for guest checkout)
    let user: { id: string; email: string } | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader && authHeader !== "Bearer undefined" && authHeader !== "Bearer null") {
      const token = authHeader.replace("Bearer ", "");
      if (token && token !== "undefined" && token !== "null") {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (!userError && userData.user?.email) {
          user = { id: userData.user.id, email: userData.user.email };
          logStep("User authenticated", { userId: user.id, email: user.email });
        }
      }
    }

    // For guest users, proceed without authentication
    if (!user) {
      logStep("Guest checkout - no authentication");
    }

    // Check user's cashback balance (only for authenticated users)
    let cashbackBalance = 0;
    let hasCashback = false;

    if (user) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("cashback_balance")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        logStep("Error fetching profile", { error: profileError.message });
      }

      cashbackBalance = profileData?.cashback_balance || 0;
      hasCashback = cashbackBalance > 0;
      logStep("Cashback balance checked", { cashbackBalance, hasCashback });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists (only if user is authenticated)
    let customerId: string | undefined;
    
    if (user) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });

        // Check for active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          logStep("User already has active subscription");
          return new Response(
            JSON.stringify({ error: "Você já possui uma assinatura ativa." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
      }
    }

    // Create or retrieve a 10% discount coupon for referral cashback
    let discountCouponId: string | undefined;
    
    if (user && hasCashback && applyReferralDiscount) {
      try {
        // Try to retrieve existing coupon
        const existingCoupon = await stripe.coupons.retrieve("REFERRAL_CASHBACK_10");
        discountCouponId = existingCoupon.id;
        logStep("Using existing referral coupon", { couponId: discountCouponId });
      } catch {
        // Coupon doesn't exist, create it
        const newCoupon = await stripe.coupons.create({
          id: "REFERRAL_CASHBACK_10",
          percent_off: REFERRAL_DISCOUNT_PERCENT,
          duration: "once",
          name: "Desconto Indicação 10%",
        });
        discountCouponId = newCoupon.id;
        logStep("Created new referral coupon", { couponId: discountCouponId });
      }

      // Decrement cashback balance after applying
      const newBalance = Math.max(0, cashbackBalance - 1);
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ cashback_balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        logStep("Error updating cashback balance", { error: updateError.message });
      } else {
        logStep("Cashback balance updated", { oldBalance: cashbackBalance, newBalance });
      }
    }

    const origin = req.headers.get("origin") || "https://metodo.renascerapp.com.br";
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : (user?.email || undefined),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        user_id: user?.id || "guest",
        cashback_applied: hasCashback && applyReferralDiscount ? "true" : "false",
        // Include UTM parameters for attribution tracking
        utm_source: utmData.utm_source || "",
        utm_medium: utmData.utm_medium || "",
        utm_campaign: utmData.utm_campaign || "",
        utm_term: utmData.utm_term || "",
        utm_content: utmData.utm_content || "",
      },
    };

    // Apply discount if user has cashback and requested it
    if (discountCouponId) {
      sessionParams.discounts = [{ coupon: discountCouponId }];
      logStep("Applying referral discount to checkout", { couponId: discountCouponId });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url, discountApplied: !!discountCouponId });

    return new Response(JSON.stringify({ 
      url: session.url,
      cashback_available: hasCashback,
      discount_applied: !!discountCouponId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    const userMessage = mapErrorToUserMessage(error);
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
