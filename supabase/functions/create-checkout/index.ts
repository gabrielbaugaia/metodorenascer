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

// 10% discount coupon ID for referral cashback
const REFERRAL_DISCOUNT_PERCENT = 10;

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    logStep("Function started");

    // Get price_id from request body
    const body = await req.json().catch(() => ({}));
    const priceId = body.price_id || "price_1ScZqTCuFZvf5xFdZuOBMzpt"; // Default to Embaixador
    const applyReferralDiscount = body.apply_referral_discount === true;
    
    if (!VALID_PRICE_IDS.includes(priceId)) {
      throw new Error("Invalid price ID");
    }
    logStep("Price ID received", { priceId, applyReferralDiscount });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key to read/update cashback balance
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check user's cashback balance
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("cashback_balance")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError.message });
    }

    const cashbackBalance = profileData?.cashback_balance || 0;
    const hasCashback = cashbackBalance > 0;
    logStep("Cashback balance checked", { cashbackBalance, hasCashback });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
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

    // Create or retrieve a 10% discount coupon for referral cashback
    let discountCouponId: string | undefined;
    
    if (hasCashback && applyReferralDiscount) {
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

    const origin = req.headers.get("origin") || "https://lxdosmjenbaugmhyfanx.lovableproject.com";
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        user_id: user.id,
        cashback_applied: hasCashback && applyReferralDiscount ? "true" : "false",
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
