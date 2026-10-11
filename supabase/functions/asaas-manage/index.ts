// Ações autenticadas: aluno (status/cancelar a própria) e admin (reconciliar/cancelar qualquer).
import { z } from "https://esm.sh/zod@3.23.8";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { adminClient, asaas, asaasEnv, hasAsaasKey, json, markCanceled } from "../_shared/asaas.ts";

const Body = z.object({
  action: z.enum(["my_status", "cancel", "reconcile", "env"]),
  subscription_id: z.string().max(64).optional(),
});

Deno.serve(async (req) => {
  const pre = handleCorsPreflightRequest(req);
  if (pre) return pre;
  const cors = getCorsHeaders(req);
  try {
    const db = adminClient();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Não autorizado" }, 401, cors);
    const { data: u } = await db.auth.getUser(token);
    if (!u.user) return json({ error: "Não autorizado" }, 401, cors);
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!role;
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400, cors);
    const { action, subscription_id } = parsed.data;

    if (action === "env") {
      if (!isAdmin) return json({ error: "Proibido" }, 403, cors);
      return json({ configured: hasAsaasKey(), webhook_token: !!Deno.env.get("ASAAS_WEBHOOK_TOKEN"), env: asaasEnv() }, 200, cors);
    }

    if (action === "my_status") {
      const { data } = await db.from("asaas_subscriptions").select("asaas_subscription_id, plan_name, value_cents, status, paid_until, next_due_date")
        .eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      let invoice_url: string | null = null;
      if (data) {
        const { data: o } = await db.from("asaas_payment_orders").select("invoice_url").eq("asaas_subscription_id", data.asaas_subscription_id)
          .neq("status", "received").neq("status", "confirmed").order("due_date", { ascending: false }).limit(1).maybeSingle();
        invoice_url = o?.invoice_url ?? null;
      }
      return json({ subscription: data, open_invoice_url: invoice_url }, 200, cors);
    }

    if (!subscription_id) return json({ error: "subscription_id obrigatório" }, 400, cors);
    const { data: sub } = await db.from("asaas_subscriptions").select("*").eq("asaas_subscription_id", subscription_id).maybeSingle();
    if (!sub) return json({ error: "Assinatura não encontrada" }, 404, cors);
    if (!isAdmin && sub.user_id !== u.user.id) return json({ error: "Proibido" }, 403, cors);

    if (action === "cancel") {
      await asaas(`/subscriptions/${subscription_id}`, { method: "DELETE" });
      await db.from("asaas_subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("id", sub.id);
      await markCanceled(db, subscription_id);
      return json({ ok: true }, 200, cors);
    }

    // reconcile (admin)
    if (!isAdmin) return json({ error: "Proibido" }, 403, cors);
    const remote = await asaas<any>(`/subscriptions/${subscription_id}`);
    const pays = await asaas<{ data: any[] }>(`/subscriptions/${subscription_id}/payments?limit=20`);
    const overdue = pays.data.some((p) => p.status === "OVERDUE");
    const status = remote.deleted || remote.status === "INACTIVE" ? "canceled" : overdue ? "past_due" : sub.status;
    await db.from("asaas_subscriptions").update({ status, next_due_date: remote.nextDueDate ?? sub.next_due_date }).eq("id", sub.id);
    return json({ ok: true, status, remote_status: remote.status, payments: pays.data.map((p) => ({ id: p.id, status: p.status, dueDate: p.dueDate, value: p.value })) }, 200, cors);
  } catch (e) {
    console.error("[asaas-manage]", e instanceof Error ? e.message : e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500, cors);
  }
});
