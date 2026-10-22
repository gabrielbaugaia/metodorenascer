import { ASAAS_PLANS, adminClient, asaas, computePaidUntil, grantAccess, json, markCanceled } from "../_shared/asaas.ts";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const PAID = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const expected = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const got = req.headers.get("asaas-access-token") ?? "";
  if (!expected || !safeEqual(got, expected)) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.event) return json({ error: "invalid" }, 400);
  const db = adminClient();
  const payment = body.payment ?? null;
  const subscription = body.subscription ?? null;

  const { error: insErr } = await db.from("asaas_payment_events").insert({
    event_id: String(body.id), event_type: body.event,
    asaas_payment_id: payment?.id ?? null,
    asaas_subscription_id: payment?.subscription ?? subscription?.id ?? null,
    payload: body,
  });
  if (insErr) {
    if (insErr.code === "23505") return json({ ok: true, duplicate: true });
    console.error("[asaas-webhook] insert", insErr.message);
    return json({ error: "store" }, 500);
  }

  try {
    if (payment?.id) {
      // Nunca confiar só no payload: reconsulta o estado na API
      const p = await asaas<any>(`/payments/${payment.id}`);
      const subId: string | null = p.subscription ?? null;
      const { data: order } = await db.from("asaas_payment_orders").select("*").eq("asaas_payment_id", p.id).maybeSingle();
      const { data: sub } = subId
        ? await db.from("asaas_subscriptions").select("*").eq("asaas_subscription_id", subId).maybeSingle()
        : { data: null };

      // Cobranças recorrentes futuras não têm order: cria registro
      if (!order && sub) {
        await db.from("asaas_payment_orders").upsert({
          user_id: sub.user_id, email: sub.email, idempotency_key: `asaas-pay-${p.id}`, asaas_payment_id: p.id,
          asaas_subscription_id: subId, plan_slug: sub.plan_slug, value_cents: Math.round(p.value * 100),
          billing_type: p.billingType, invoice_url: p.invoiceUrl, due_date: p.dueDate, environment: sub.environment,
        }, { onConflict: "asaas_payment_id" });
      }
      const ownerEmail = sub?.email ?? order?.email;
      if (!ownerEmail) throw new Error("Pagamento sem cadastro correspondente");

      // Cruzamento: valor e cliente precisam bater
      const expectedCents = sub?.value_cents ?? order?.value_cents;
      if (expectedCents && Math.round(p.value * 100) < expectedCents) throw new Error("Valor divergente");

      const status = String(p.status);
      await db.from("asaas_payment_orders").update({
        status: status.toLowerCase(), paid_at: ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(status) ? new Date().toISOString() : null,
      }).eq("asaas_payment_id", p.id);

      if (PAID.has(body.event) && ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(status)) {
        const slug = sub?.plan_slug ?? order!.plan_slug;
        const plan = ASAAS_PLANS[slug];
        const paidUntil = computePaidUntil(p.dueDate);
        const uid = await grantAccess(db, {
          email: ownerEmail, userId: sub?.user_id ?? order?.user_id ?? null, planSlug: slug, planName: plan?.name ?? slug,
          valueCents: expectedCents ?? 0, paidUntil, ref: subId ?? p.id,
        });
        if (subId) await db.from("plan_promotion_claims").update({ status: "paid", paid_at: new Date().toISOString() }).eq("asaas_subscription_id", subId).eq("status", "reserved");
        if (sub) await db.from("asaas_subscriptions").update({ status: "active", paid_until: paidUntil.toISOString(), user_id: uid ?? sub.user_id }).eq("id", sub.id);
        if (order && !order.user_id && uid) await db.from("asaas_payment_orders").update({ user_id: uid }).eq("id", order.id);
      } else if (body.event === "PAYMENT_OVERDUE" && sub) {
        await db.from("asaas_subscriptions").update({ status: "past_due" }).eq("id", sub.id);
      } else if (["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"].includes(body.event)) {
        await markCanceled(db, subId ?? p.id);
        if (sub) await db.from("asaas_subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("id", sub.id);
      }
    } else if (subscription?.id && ["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"].includes(body.event)) {
      await db.from("asaas_subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("asaas_subscription_id", subscription.id);
      await markCanceled(db, subscription.id);
    }
    await db.from("asaas_payment_events").update({ processed: true }).eq("event_id", String(body.id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[asaas-webhook]", msg);
    await db.from("asaas_payment_events").update({ error: msg }).eq("event_id", String(body.id));
  }
  // Sempre 200 após registrar, para não travar a fila do Asaas; erros ficam visíveis no admin
  return json({ ok: true });
});
