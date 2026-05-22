// whatsapp-send — Etapa 3
// Envia mensagens via WhatsApp Cloud API e persiste outbound em whatsapp_messages.
// Restrito a admins (verify_jwt=true + checagem de role).

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.23.8";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { requireAdminOrService } from "../_shared/auth.ts";

const log = (step: string, details?: unknown) => {
  const extra = details ? ` ${JSON.stringify(details)}` : "";
  console.log(`[whatsapp-send] ${step}${extra}`);
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const GRAPH_VERSION = "v21.0";

const BodySchema = z.object({
  to: z.string().trim().regex(/^\+?\d{8,15}$/, "to deve ser telefone E.164"),
  user_id: z.string().uuid().optional(),
  conversa_id: z.string().uuid().optional(),
  type: z.literal("text").default("text"),
  body: z.string().trim().min(1).max(4096),
});

function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}
function phoneMatches(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const tail = (s: string, n: number) => s.slice(-n);
  return tail(na, 11) === tail(nb, 11) || tail(na, 10) === tail(nb, 10);
}

async function findUserIdByPhone(
  supabase: ReturnType<typeof createClient>,
  phoneE164: string,
): Promise<string | null> {
  const normalized = normalizePhone(phoneE164);
  if (!normalized) return null;
  const tail = normalized.slice(-10);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, telefone, whatsapp")
    .or(`whatsapp.ilike.%${tail}%,telefone.ilike.%${tail}%`)
    .limit(20);
  if (error || !data) return null;
  for (const row of data as Array<{ id: string; telefone: string | null; whatsapp: string | null }>) {
    if (phoneMatches(row.whatsapp ?? "", phoneE164) || phoneMatches(row.telefone ?? "", phoneE164)) {
      return row.id;
    }
  }
  return null;
}

async function ensureConversa(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("conversas")
    .select("id")
    .eq("user_id", userId)
    .eq("tipo", "whatsapp")
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;
  const { data: inserted, error } = await supabase
    .from("conversas")
    .insert({ user_id: userId, tipo: "whatsapp", mensagens: [], status: "active" })
    .select("id")
    .single();
  if (error) {
    log("conversa_insert_error", { error: error.message });
    return null;
  }
  return (inserted as { id: string }).id;
}

async function appendConversaMessage(
  supabase: ReturnType<typeof createClient>,
  conversaId: string,
  message: { role: "user" | "assistant"; content: string; channel: string; timestamp: string },
) {
  const { data: row } = await supabase
    .from("conversas")
    .select("mensagens")
    .eq("id", conversaId)
    .maybeSingle();
  if (!row) return;
  const arr = Array.isArray((row as { mensagens: unknown }).mensagens)
    ? ((row as { mensagens: unknown[] }).mensagens as unknown[])
    : [];
  arr.push(message);
  await supabase
    .from("conversas")
    .update({ mensagens: arr, updated_at: new Date().toISOString() })
    .eq("id", conversaId);
}

Deno.serve(async (req) => {
  const pre = handleCorsPreflightRequest(req);
  if (pre) return pre;
  const cors = getCorsHeaders(req);
  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  // 1. Auth: admin ou service-role
  const auth = await requireAdminOrService(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  // 2. Secrets
  if (!WA_TOKEN || !WA_PHONE_ID) {
    log("missing_secrets");
    return new Response(
      JSON.stringify({ error: "whatsapp_not_configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  // 3. Validar body
  let parsed: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    const result = BodySchema.safeParse(raw);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "invalid_body", details: result.error.flatten().fieldErrors }),
        { status: 400, headers: jsonHeaders },
      );
    }
    parsed = result.data;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const toDigits = normalizePhone(parsed.to);
  const toE164 = `+${toDigits}`;

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 4. Chamar Cloud API da Meta
  const metaUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${WA_PHONE_ID}/messages`;
  let metaResponseJson: any = null;
  let metaStatus = 0;
  try {
    const metaRes = await fetch(metaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toDigits,
        type: "text",
        text: { preview_url: false, body: parsed.body },
      }),
    });
    metaStatus = metaRes.status;
    metaResponseJson = await metaRes.json().catch(() => ({}));
  } catch (e) {
    log("meta_fetch_error", { error: (e as Error).message });
    metaResponseJson = { error: (e as Error).message };
  }

  const okMeta = metaStatus >= 200 && metaStatus < 300;
  const waMessageId: string | null = okMeta ? metaResponseJson?.messages?.[0]?.id ?? null : null;

  // 5. Resolver user_id / conversa_id
  let userId: string | null = parsed.user_id ?? null;
  if (!userId) {
    userId = await findUserIdByPhone(supabase, toE164);
  }
  let conversaId: string | null = parsed.conversa_id ?? null;
  if (!conversaId && userId) {
    conversaId = await ensureConversa(supabase, userId);
  }

  // 6. Persistir outbound (mesmo em falha, p/ auditoria)
  const { error: insErr } = await supabase.from("whatsapp_messages").insert({
    user_id: userId,
    conversa_id: conversaId,
    wa_message_id: waMessageId,
    direction: "outbound",
    from_phone: null,
    to_phone: toE164,
    message_type: "text",
    body: parsed.body,
    payload_json: metaResponseJson ?? {},
    status: okMeta ? "sent" : "failed",
  });
  if (insErr) log("message_insert_error", { error: insErr.message });

  // 7. Refletir na conversa
  if (okMeta && conversaId) {
    await appendConversaMessage(supabase, conversaId, {
      role: "assistant",
      content: parsed.body,
      channel: "whatsapp",
      timestamp: new Date().toISOString(),
    });
  }

  if (!okMeta) {
    log("meta_error", { metaStatus, metaResponseJson });
    return new Response(
      JSON.stringify({ ok: false, error: "meta_send_failed", meta_status: metaStatus, meta: metaResponseJson }),
      { status: 502, headers: jsonHeaders },
    );
  }

  log("sent", { waMessageId, userId, conversaId });
  return new Response(
    JSON.stringify({ ok: true, wa_message_id: waMessageId, user_id: userId, conversa_id: conversaId }),
    { status: 200, headers: jsonHeaders },
  );
});
