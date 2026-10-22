import { z } from "https://esm.sh/zod@3.23.8";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { ASAAS_PLANS, adminClient, asaas, asaasEnv, hasAsaasKey, json } from "../_shared/asaas.ts";

const Body = z.object({
  plan_slug: z.enum(["start", "mensal", "premium", "elite"]),
  mode: z.enum(["subscription", "pix", "card"]),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(255),
  cpf_cnpj: z.string().regex(/^\d{11}$|^\d{14}$/),
  phone: z.string().regex(/^\d{10,11}$/).optional(),
  idempotency_key: z.string().uuid(),
});

Deno.serve(async (req) => {
  const pre = handleCorsPreflightRequest(req);
  if (pre) return pre;
  const cors = getCorsHeaders(req);
  try {
    if (!hasAsaasKey()) return json({ error: "Pagamentos ainda não configurados." }, 503, cors);
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, 400, cors);
    const b = parsed.data;
    const db = adminClient();

    const { data: settings } = await db.from("payment_settings").select("checkout_provider").eq("id", 1).maybeSingle();
    const isAdminTest = await (async () => {
      const token = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) return { userId: null as string | null, email: null as string | null, admin: false };
      const { data } = await db.auth.getUser(token);
      if (!data.user) return { userId: null, email: null, admin: false };
      const { data: role } = await db.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      return { userId: data.user.id, email: data.user.email ?? null, admin: !!role };
    })();
    // Enquanto o provedor oficial for Stripe, só admin consegue testar o checkout Asaas
    if (settings?.checkout_provider !== "asaas" && !isAdminTest.admin) {
      return json({ error: "Checkout indisponível." }, 403, cors);
    }

    const userId = isAdminTest.userId;
    const email = (isAdminTest.email && !isAdminTest.admin ? isAdminTest.email : b.email).toLowerCase();
    const plan = ASAAS_PLANS[b.plan_slug];
    if (!plan.modes.includes(b.mode)) return json({ error: "Forma de pagamento indisponível para este plano." }, 400, cors);

    // Idempotência
    const { data: prior } = await db.from("asaas_payment_orders").select("invoice_url").eq("idempotency_key", b.idempotency_key).maybeSingle();
    if (prior?.invoice_url) return json({ url: prior.invoice_url }, 200, cors);

    // Cliente Asaas (reaproveita)
    let customerId: string | null = null;
    const q = userId
      ? db.from("asaas_customers").select("asaas_customer_id").eq("user_id", userId)
      : db.from("asaas_customers").select("asaas_customer_id").ilike("email", email);
    const { data: cust } = await q.eq("environment", asaasEnv()).limit(1).maybeSingle();
    customerId = cust?.asaas_customer_id ?? null;
    if (!customerId) {
      const c = await asaas<{ id: string }>("/customers", {
        method: "POST",
        body: JSON.stringify({ name: b.name, email, cpfCnpj: b.cpf_cnpj, mobilePhone: b.phone, externalReference: userId ?? email, notificationDisabled: false }),
      });
      customerId = c.id;
      await db.from("asaas_customers").insert({ user_id: userId, email, asaas_customer_id: c.id, environment: asaasEnv() });
    }

    const today = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
    let valueCents = plan.value_cents;
    let promo = false;
    if (b.plan_slug === "start" && b.mode === "subscription") {
      const { data: ok } = await db.rpc("reserve_promotion_slot", { _slug: START_PROMO_SLUG, _key: b.idempotency_key });
      if (ok === true) {
        const { data: pr } = await db.from("plan_promotions").select("promo_value_cents").eq("slug", START_PROMO_SLUG).maybeSingle();
        if (pr?.promo_value_cents) { valueCents = pr.promo_value_cents; promo = true; }
      }
    }
    const value = valueCents / 100;
    let invoiceUrl: string, paymentId: string | null = null, subId: string | null = null, billingType: string;

    if (b.mode === "subscription") {
      billingType = "CREDIT_CARD"; // recorrente só no cartão
      const s = await asaas<{ id: string }>("/subscriptions", {
        method: "POST",
        body: JSON.stringify({ customer: customerId, billingType, value, nextDueDate: today, cycle: "MONTHLY", description: `Consultoria Gabriel Baú — ${plan.name}${promo ? " (condição fundador)" : ""}`, externalReference: b.idempotency_key }),
      });
      subId = s.id;
      if (promo) await db.from("plan_promotion_claims").update({ asaas_subscription_id: s.id }).eq("idempotency_key", b.idempotency_key);
      const pays = await asaas<{ data: { id: string; invoiceUrl: string }[] }>(`/subscriptions/${s.id}/payments`);
      paymentId = pays.data[0]?.id ?? null;
      invoiceUrl = pays.data[0]?.invoiceUrl;
      await db.from("asaas_subscriptions").insert({
        user_id: userId, email, asaas_customer_id: customerId, asaas_subscription_id: s.id, plan_slug: b.plan_slug,
        plan_name: plan.name, value_cents: valueCents, status: "pending", next_due_date: today, environment: asaasEnv(),
      });
    } else {
      billingType = b.mode === "pix" ? "PIX" : "CREDIT_CARD";
      const p = await asaas<{ id: string; invoiceUrl: string }>("/payments", {
        method: "POST",
        body: JSON.stringify({ customer: customerId, billingType, value, dueDate: today, description: `Consultoria Gabriel Baú — ${plan.name} (30 dias)`, externalReference: b.idempotency_key }),
      });
      paymentId = p.id;
      invoiceUrl = p.invoiceUrl;
    }
    if (!invoiceUrl) throw new Error("Fatura indisponível");

    await db.from("asaas_payment_orders").insert({
      user_id: userId, email, idempotency_key: b.idempotency_key, asaas_payment_id: paymentId, asaas_subscription_id: subId,
      plan_slug: b.plan_slug, value_cents: plan.value_cents, billing_type: billingType, invoice_url: invoiceUrl,
      due_date: today, environment: asaasEnv(),
    });
    return json({ url: invoiceUrl }, 200, cors);
  } catch (e) {
    console.error("[asaas-checkout]", e instanceof Error ? e.message : e);
    return json({ error: e instanceof Error ? e.message : "Erro ao criar cobrança" }, 500, cors);
  }
});
