import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Price ID to plan type mapping
const PRICE_TO_PLAN: Record<string, { type: string; name: string }> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": { type: "embaixador", name: "ELITE Fundador" },
  "price_1ScZrECuFZvf5xFdfS9W8kvY": { type: "mensal", name: "Mensal" },
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": { type: "trimestral", name: "Trimestral" },
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": { type: "semestral", name: "Semestral" },
  "price_1ScZvCCuFZvf5xFdjrs51JQB": { type: "anual", name: "Anual" },
};

// Map price to MRR value in cents (normalized to monthly)
const PRICE_TO_MRR: Record<string, number> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": 4990,
  "price_1ScZrECuFZvf5xFdfS9W8kvY": 19700,
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": 16567,
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": 11617,
  "price_1ScZvCCuFZvf5xFdjrs51JQB": 8308,
};

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    console.error("[STRIPE-WEBHOOK] STRIPE_SECRET_KEY is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }
  
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const supabase: SupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");
    
    const body = await req.text();
    let event: Stripe.Event;
    
    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        logStep("Missing Stripe signature");
        return new Response("Missing signature", { status: 400 });
      }
      
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        logStep("Signature verification failed", { error: err instanceof Error ? err.message : String(err) });
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      event = JSON.parse(body);
      logStep("WARNING: Processing without signature verification (dev mode)");
    }
    
    logStep("Event received", { type: event.type, id: event.id });
    
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        let userId = session.metadata?.user_id;
        
        if (!userId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && "email" in customer && customer.email) {
            const { data } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customer.email)
              .maybeSingle();
            userId = data?.id;
          }
        }
        
        if (userId) {
          await upsertSubscription(stripe, supabase, subscriptionId, customerId, userId);
        } else {
          logStep("Could not find user for checkout session");
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;
        
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id, payments_count")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        
        if (existingSub?.user_id) {
          await upsertSubscription(stripe, supabase, subscriptionId, customerId, existingSub.user_id);
          
          await supabase
            .from("subscriptions")
            .update({ payments_count: (existingSub.payments_count || 0) + 1 })
            .eq("stripe_subscription_id", subscriptionId);
        } else {
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && "email" in customer && customer.email) {
            const { data } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customer.email)
              .maybeSingle();
            if (data?.id) {
              await upsertSubscription(stripe, supabase, subscriptionId, customerId, data.id);
            }
          }
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        
        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", invoice.subscription as string);
        
        logStep("Subscription marked as past_due");
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();
        
        if (existingSub?.user_id) {
          await upsertSubscription(stripe, supabase, subscription.id, subscription.customer as string, existingSub.user_id);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from("subscriptions")
          .update({ 
            status: "canceled", 
            canceled_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          })
          .eq("stripe_subscription_id", subscription.id);
        
        logStep("Subscription marked as canceled");
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function upsertSubscription(
  stripe: Stripe,
  supabase: SupabaseClient,
  subscriptionId: string,
  customerId: string,
  userId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const priceId = subscription.items.data[0]?.price?.id;
  const planInfo = priceId ? PRICE_TO_PLAN[priceId] : null;
  const mrrValue = priceId ? PRICE_TO_MRR[priceId] : null;
  const priceCents = subscription.items.data[0]?.price?.unit_amount || null;
  
  logStep("Upserting subscription", {
    userId,
    subscriptionId,
    priceId,
    planType: planInfo?.type,
    status: subscription.status
  });
  
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
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
      started_at: subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  
  if (error) {
    logStep("Error upserting subscription", { error: error.message });
  } else {
    logStep("Subscription upserted successfully");
  }
}
