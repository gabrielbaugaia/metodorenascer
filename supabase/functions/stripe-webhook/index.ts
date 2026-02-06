import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const safeTimestampToISO = (timestamp: number | undefined | null, fallback?: number): string => {
  const ts = timestamp ?? fallback;
  if (!ts || typeof ts !== 'number' || isNaN(ts)) {
    return new Date().toISOString();
  }
  const date = new Date(ts * 1000);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

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

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// ---------- helpers ----------

async function syncEntitlement(
  supabase: SupabaseClient,
  userId: string,
  accessLevel: "none" | "trial_limited" | "full"
) {
  const { error } = await supabase
    .from("entitlements")
    .upsert(
      { user_id: userId, access_level: accessLevel, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) {
    logStep("Error syncing entitlement", { error: error.message, userId, accessLevel });
  } else {
    logStep("Entitlement synced", { userId, accessLevel });
  }
}

async function ensureTrialUsage(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("trial_usage")
    .upsert(
      { user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) {
    logStep("Error ensuring trial_usage row", { error: error.message });
  }
}

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
    status: subscription.status,
  });

  const normalizedStatus =
    subscription.status === "active" || subscription.status === "trialing"
      ? subscription.status === "trialing"
        ? "trialing"
        : "active"
      : subscription.status;

  const subData: Record<string, unknown> = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: normalizedStatus,
    plan_type: planInfo?.type || "unknown",
    plan_name: planInfo?.name || "Plano Desconhecido",
    price_cents: priceCents,
    mrr_value: mrrValue,
    current_period_start: safeTimestampToISO(subscription.current_period_start),
    current_period_end: safeTimestampToISO(subscription.current_period_end),
    started_at: safeTimestampToISO(subscription.start_date, subscription.created),
    updated_at: new Date().toISOString(),
  };

  // Save trial_end if present
  if (subscription.trial_end) {
    subData.trial_end = safeTimestampToISO(subscription.trial_end);
  }

  const { error } = await supabase
    .from("subscriptions")
    .upsert(subData, { onConflict: "user_id" });

  if (error) {
    logStep("Error upserting subscription", { error: error.message });
  } else {
    logStep("Subscription upserted successfully");
  }

  // Sync entitlements
  const accessLevel: "none" | "trial_limited" | "full" =
    subscription.status === "trialing"
      ? "trial_limited"
      : subscription.status === "active"
      ? "full"
      : "none";

  await syncEntitlement(supabase, userId, accessLevel);

  // If trialing, ensure trial_usage row exists
  if (subscription.status === "trialing") {
    await ensureTrialUsage(supabase, userId);
  }
}

async function findUserIdBySubscription(
  supabase: SupabaseClient,
  subscriptionId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  return data?.user_id || null;
}

async function findUserIdByCustomerEmail(
  stripe: Stripe,
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", customer.email)
    .maybeSingle();
  return data?.id || null;
}

// ---------- main handler ----------

serve(async (req) => {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    console.error("[STRIPE-WEBHOOK] STRIPE_SECRET_KEY is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
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
        return new Response("Missing signature", { status: 400 });
      }
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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
      // ========== CHECKOUT COMPLETED ==========
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        let userId = session.metadata?.user_id;

        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = !customer.deleted && "email" in customer ? customer.email : null;

        if (!userId || userId === "guest") {
          if (customerEmail) {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customerEmail)
              .maybeSingle();

            if (existingProfile) {
              userId = existingProfile.id;
              logStep("Found existing user by email", { userId, email: customerEmail });
            } else {
              logStep("Creating new account for guest", { email: customerEmail });
              const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

              const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: customerEmail,
                password: tempPassword,
                email_confirm: true,
              });

              if (createError) {
                logStep("Error creating user", { error: createError.message });
              } else if (newUser?.user) {
                userId = newUser.user.id;
                logStep("User created successfully", { userId });

                const customerName = !customer.deleted && "name" in customer ? customer.name : null;
                await supabase
                  .from("profiles")
                  .update({
                    email: customerEmail,
                    full_name: customerName || customerEmail.split("@")[0],
                  })
                  .eq("id", userId);

                await supabase.from("pending_logins").insert({
                  session_id: session.id,
                  user_id: userId,
                  temp_password: tempPassword,
                });
              }
            }
          }
        } else if (!userId && customerEmail) {
          const { data } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();
          userId = data?.id;
        }

        if (userId) {
          await upsertSubscription(stripe, supabase, subscriptionId, customerId, userId);
        } else {
          logStep("Could not find or create user for checkout session");
        }
        break;
      }

      // ========== SUBSCRIPTION CREATED ==========
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await findUserIdBySubscription(supabase, subscription.id)
          || await findUserIdByCustomerEmail(stripe, supabase, subscription.customer as string);

        if (userId) {
          await upsertSubscription(stripe, supabase, subscription.id, subscription.customer as string, userId);
        } else {
          logStep("Could not find user for subscription.created");
        }
        break;
      }

      // ========== INVOICE PAYMENT SUCCEEDED ==========
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
          const userId = await findUserIdByCustomerEmail(stripe, supabase, customerId);
          if (userId) {
            await upsertSubscription(stripe, supabase, subscriptionId, customerId, userId);
          }
        }
        break;
      }

      // ========== INVOICE PAYMENT FAILED ==========
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        logStep("Payment failed, blocking access", { subscriptionId: invoice.subscription });

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", invoice.subscription as string)
          .maybeSingle();

        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            access_blocked: true,
            blocked_reason: "Pagamento não realizado",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", invoice.subscription as string);

        if (sub?.user_id) {
          await syncEntitlement(supabase, sub.user_id, "none");
        }
        break;
      }

      // ========== SUBSCRIPTION UPDATED ==========
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

      // ========== SUBSCRIPTION DELETED ==========
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        logStep("Subscription deleted, blocking access", { subscriptionId: subscription.id });

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            access_blocked: true,
            blocked_reason: "Assinatura cancelada",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (sub?.user_id) {
          await syncEntitlement(supabase, sub.user_id, "none");
        }
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
