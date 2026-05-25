// WhatsApp Cloud API webhook — Etapa 2
// - GET: verifica token de subscription da Meta
// - POST: salva payload bruto, identifica cliente pelo telefone, grava mensagens inbound
//         e atualiza/cria conversa do tipo 'whatsapp'.
// Nesta etapa NÃO envia resposta nem chama IA.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { runBot } from "../_shared/whatsappBot.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const log = (step: string, details?: unknown) => {
  const extra = details ? ` ${JSON.stringify(details)}` : "";
  console.log(`[whatsapp-webhook] ${step}${extra}`);
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Normaliza telefone: remove tudo que não é dígito.
function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

// Compara dois telefones aceitando diferenças de prefixo (DDI, 9 extra).
function phoneMatches(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // tail match nos últimos 10/11 dígitos
  const tail = (s: string, n: number) => s.slice(-n);
  return tail(na, 11) === tail(nb, 11) || tail(na, 10) === tail(nb, 10);
}

async function hashPayload(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Procura profile pelo telefone (campos `whatsapp` ou `telefone`).
async function findUserIdByPhone(
  supabase: ReturnType<typeof createClient>,
  phoneE164: string,
): Promise<string | null> {
  const normalized = normalizePhone(phoneE164);
  if (!normalized) return null;

  const tail = normalized.slice(-10);
  // Busca candidatos que contenham os últimos 10 dígitos em qualquer um dos dois campos.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, telefone, whatsapp")
    .or(`whatsapp.ilike.%${tail}%,telefone.ilike.%${tail}%`)
    .limit(20);

  if (error) {
    log("profile_lookup_error", { error: error.message });
    return null;
  }
  if (!data || data.length === 0) return null;

  for (const row of data as Array<{ id: string; telefone: string | null; whatsapp: string | null }>) {
    if (phoneMatches(row.whatsapp ?? "", phoneE164) || phoneMatches(row.telefone ?? "", phoneE164)) {
      return row.id;
    }
  }
  return null;
}

async function upsertContact(
  supabase: ReturnType<typeof createClient>,
  args: { phoneE164: string; waId?: string | null; displayName?: string | null; userId: string | null },
) {
  const { phoneE164, waId, displayName, userId } = args;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (waId) update.wa_id = waId;
  if (displayName) update.display_name = displayName;
  if (userId) update.user_id = userId;

  // tenta update por phone_e164
  const { data: existing, error: selErr } = await supabase
    .from("whatsapp_contacts")
    .select("id")
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (selErr) {
    log("contact_select_error", { error: selErr.message });
  }

  if (existing) {
    const { error } = await supabase
      .from("whatsapp_contacts")
      .update(update)
      .eq("id", (existing as { id: string }).id);
    if (error) log("contact_update_error", { error: error.message });
    return;
  }

  const { error } = await supabase.from("whatsapp_contacts").insert({
    phone_e164: phoneE164,
    wa_id: waId ?? null,
    display_name: displayName ?? null,
    user_id: userId,
  });
  if (error) log("contact_insert_error", { error: error.message });
}

// Garante uma conversa whatsapp para o user_id; retorna o id.
async function ensureConversa(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data: existing, error: selErr } = await supabase
    .from("conversas")
    .select("id, mensagens")
    .eq("user_id", userId)
    .eq("tipo", "whatsapp")
    .maybeSingle();

  if (selErr) {
    log("conversa_select_error", { error: selErr.message });
    return null;
  }
  if (existing) return (existing as { id: string }).id;

  const { data: inserted, error: insErr } = await supabase
    .from("conversas")
    .insert({ user_id: userId, tipo: "whatsapp", mensagens: [], status: "active" })
    .select("id")
    .single();

  if (insErr) {
    log("conversa_insert_error", { error: insErr.message });
    return null;
  }
  return (inserted as { id: string }).id;
}

async function appendConversaMessage(
  supabase: ReturnType<typeof createClient>,
  conversaId: string,
  message: { role: "user" | "assistant"; content: string; channel: string; timestamp: string },
) {
  const { data: row, error } = await supabase
    .from("conversas")
    .select("mensagens")
    .eq("id", conversaId)
    .maybeSingle();
  if (error || !row) {
    log("conversa_fetch_error", { error: error?.message });
    return;
  }
  const arr = Array.isArray((row as { mensagens: unknown }).mensagens)
    ? ((row as { mensagens: unknown[] }).mensagens as unknown[])
    : [];
  arr.push(message);
  const { error: updErr } = await supabase
    .from("conversas")
    .update({ mensagens: arr, updated_at: new Date().toISOString() })
    .eq("id", conversaId);
  if (updErr) log("conversa_append_error", { error: updErr.message });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ---------- GET: verificação do webhook ----------
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (!expected) {
      log("verify_missing_secret");
      return new Response("verify token not configured", { status: 500, headers: corsHeaders });
    }
    if (mode === "subscribe" && token === expected && challenge) {
      log("verify_ok");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }
    log("verify_failed", { mode, hasToken: !!token });
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  // ---------- POST: webhook de mensagens ----------
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let rawBody = "";
  let payload: any;
  try {
    rawBody = await req.text();
    payload = JSON.parse(rawBody);
  } catch (e) {
    log("invalid_json", { error: (e as Error).message });
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Salvar evento bruto com deduplicação
  try {
    const event_hash = await hashPayload(rawBody);
    const { error: eventErr } = await supabase
      .from("whatsapp_webhook_events")
      .insert({ event_hash, payload_json: payload });
    if (eventErr && !eventErr.message.toLowerCase().includes("duplicate")) {
      log("event_insert_error", { error: eventErr.message });
    }
  } catch (e) {
    log("event_hash_error", { error: (e as Error).message });
  }

  // 2. Extrair mensagens. Estrutura WhatsApp Cloud API:
  //    payload.entry[].changes[].value.messages[] / .contacts[]
  try {
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value ?? {};
        const messages = Array.isArray(value?.messages) ? value.messages : [];
        const contacts = Array.isArray(value?.contacts) ? value.contacts : [];

        if (messages.length === 0) continue; // ignora eventos de status

        for (const msg of messages) {
          const waMessageId: string | undefined = msg?.id;
          const fromPhoneRaw: string | undefined = msg?.from; // ex: "5511999999999"
          const fromPhone = fromPhoneRaw ? `+${normalizePhone(fromPhoneRaw)}` : null;
          const type: string = msg?.type ?? "text";
          const body: string | null =
            type === "text" ? (msg?.text?.body ?? null) : null;

          const contact = contacts.find((c: any) => c?.wa_id === fromPhoneRaw) ?? contacts[0];
          const displayName: string | null = contact?.profile?.name ?? null;
          const waId: string | null = contact?.wa_id ?? fromPhoneRaw ?? null;

          if (!fromPhone) {
            log("message_skipped_no_phone", { waMessageId });
            continue;
          }

          // Deduplicação por wa_message_id
          if (waMessageId) {
            const { data: existingMsg } = await supabase
              .from("whatsapp_messages")
              .select("id")
              .eq("wa_message_id", waMessageId)
              .maybeSingle();
            if (existingMsg) {
              log("message_duplicate", { waMessageId });
              continue;
            }
          }

          const userId = await findUserIdByPhone(supabase, fromPhone);
          await upsertContact(supabase, {
            phoneE164: fromPhone,
            waId,
            displayName,
            userId,
          });

          let conversaId: string | null = null;
          if (userId) {
            conversaId = await ensureConversa(supabase, userId);
          }

          const { error: msgErr } = await supabase.from("whatsapp_messages").insert({
            user_id: userId,
            conversa_id: conversaId,
            wa_message_id: waMessageId ?? null,
            direction: "inbound",
            from_phone: fromPhone,
            to_phone: value?.metadata?.display_phone_number
              ? `+${normalizePhone(value.metadata.display_phone_number)}`
              : null,
            message_type: type,
            body,
            payload_json: msg,
            status: "received",
          });
          if (msgErr) log("message_insert_error", { error: msgErr.message });

          if (conversaId && body) {
            await appendConversaMessage(supabase, conversaId, {
              role: "user",
              content: body,
              channel: "whatsapp",
              timestamp: new Date().toISOString(),
            });
          }

          log("message_saved", { waMessageId, userId, conversaId, hasBody: !!body });
        }
      }
    }
  } catch (e) {
    log("processing_error", { error: (e as Error).message });
    // Mesmo com erro de processamento retornamos 200 para a Meta não reentregar em loop.
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
