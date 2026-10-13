// Asaas API helpers (server-only). Never import from frontend.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PUBLIC_APP_URL } from "./appConfig.ts";

// Planos reaproveitados da Landing Premium (mesmos valores do Stripe — ver priceMappings.ts)
export type AsaasMode = "subscription" | "pix" | "card";
// Planos vigentes. essencial/pro/consultoria mantidos só para registros antigos (não vendidos).
export const ASAAS_PLANS: Record<string, { name: string; value_cents: number; modes: AsaasMode[] }> = {
  start: { name: "START", value_cents: 19700, modes: ["subscription"] },
  mensal: { name: "MENSAL", value_cents: 29700, modes: ["pix", "card"] },
  premium: { name: "PREMIUM", value_cents: 69700, modes: ["pix", "card"] },
  elite: { name: "PREMIUM", value_cents: 69700, modes: ["pix", "card"] },
  consultoria: { name: "CONSULTORIA", value_cents: 19700, modes: [] },
  essencial: { name: "ESSENCIAL", value_cents: 9700, modes: [] },
  pro: { name: "PRO", value_cents: 29700, modes: [] },
};

export function asaasEnv(): "sandbox" | "production" {
  return Deno.env.get("ASAAS_ENV") === "production" ? "production" : "sandbox";
}

export function asaasBaseUrl(): string {
  return asaasEnv() === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

export function hasAsaasKey(): boolean {
  return !!Deno.env.get("ASAAS_API_KEY");
}

export async function asaas<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const key = Deno.env.get("ASAAS_API_KEY");
  if (!key) throw new Error("ASAAS_API_KEY não configurada");
  const res = await fetch(`${asaasBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "ConsultoriaGabrielBau",
      access_token: key,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.errors?.[0]?.description || `Asaas HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

export async function getGraceDays(db: SupabaseClient): Promise<number> {
  const { data } = await db.from("payment_settings").select("grace_days").eq("id", 1).maybeSingle();
  return data?.grace_days ?? 3;
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function computePaidUntil(dueDate: string | null | undefined): Date {
  const base = dueDate ? new Date(`${dueDate}T23:59:59-03:00`) : new Date();
  const start = base > new Date() ? base : new Date();
  return addMonths(start, 1);
}

async function resolveUserId(db: SupabaseClient, email: string, current: string | null): Promise<string | null> {
  if (current) return current;
  const { data: prof } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (prof?.id) return prof.id;
  // Conta nova: convite por e-mail para definir senha
  const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${PUBLIC_APP_URL}/redefinir-senha`,
  });
  if (error) {
    console.error("[asaas] invite error", error.message);
    return null;
  }
  return data.user?.id ?? null;
}

/** Libera acesso premium até paidUntil + tolerância. Idempotente. */
export async function grantAccess(
  db: SupabaseClient,
  opts: { email: string; userId: string | null; planSlug: string; planName: string; valueCents: number; paidUntil: Date; ref: string },
): Promise<string | null> {
  const userId = await resolveUserId(db, opts.email, opts.userId);
  if (!userId) return null;
  const grace = await getGraceDays(db);
  const accessUntil = new Date(opts.paidUntil.getTime() + grace * 86400000);

  // Linha local em subscriptions (lida por check-subscription/useSubscription). Marcador "asaas:<id>".
  const marker = `asaas:${opts.ref}`;
  const row = {
    user_id: userId,
    stripe_subscription_id: marker,
    status: "active",
    plan_type: opts.planSlug,
    plan_name: opts.planName,
    price_cents: opts.valueCents,
    mrr_value: opts.valueCents,
    current_period_end: accessUntil.toISOString(),
    access_blocked: false,
  };
  const { data: existing } = await db.from("subscriptions").select("id").eq("stripe_subscription_id", marker).maybeSingle();
  if (existing) await db.from("subscriptions").update(row).eq("id", existing.id);
  else await db.from("subscriptions").insert({ ...row, current_period_start: new Date().toISOString() });

  // Entitlement via override com expiração — não sobrescreve isenção admin mais longa
  const { data: ent } = await db.from("entitlements").select("override_level, override_expires_at").eq("user_id", userId).maybeSingle();
  const currentExp = ent?.override_expires_at ? new Date(ent.override_expires_at) : null;
  if (!currentExp || currentExp < accessUntil) {
    await db.from("entitlements").upsert(
      { user_id: userId, override_level: "full", override_expires_at: accessUntil.toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  }
  return userId;
}

export async function markCanceled(db: SupabaseClient, ref: string) {
  // Mantém acesso até o fim do período já pago (não revoga antecipadamente)
  await db.from("subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", `asaas:${ref}`);
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
