import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const allowedOrigins = [
  "https://metodorenascer.lovable.app",
  "https://renascerapp.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

interface SendPushRequest {
  user_id?: string;
  user_ids?: string[];
  notification_type: "workout_reminder" | "checkin_reminder" | "inactivity" | "workout_completed" | "custom";
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      throw new Error("VAPID keys não configuradas");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const body: SendPushRequest = await req.json();
    const { user_id, user_ids, notification_type, title, body: messageBody, data } = body;

    const targetUserIds = user_ids || (user_id ? [user_id] : []);

    if (targetUserIds.length === 0) {
      throw new Error("Nenhum usuário especificado");
    }

    // Buscar subscriptions dos usuários
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*, notification_preferences!inner(*)")
      .in("user_id", targetUserIds);

    if (subError) {
      console.error("Erro ao buscar subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma subscription encontrada", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filtrar por preferências
    const filteredSubscriptions = subscriptions.filter((sub) => {
      const prefs = sub.notification_preferences;
      if (!prefs?.push_enabled) return false;

      switch (notification_type) {
        case "workout_reminder":
          return prefs.workout_reminder_enabled;
        case "checkin_reminder":
          return prefs.checkin_reminder_enabled;
        case "inactivity":
          return prefs.inactivity_reminder_enabled;
        case "workout_completed":
          return prefs.workout_completed_enabled;
        case "custom":
          return true;
        default:
          return true;
      }
    });

    if (filteredSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Preferências desativadas para todos usuários", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Definir mensagem padrão
    let notificationTitle = title;
    let notificationBody = messageBody;

    if (!notificationTitle || !notificationBody) {
      switch (notification_type) {
        case "workout_reminder":
          notificationTitle = "🏋️ Hora de treinar!";
          notificationBody = "Seu treino está esperando. Vamos conquistar mais um dia!";
          break;
        case "checkin_reminder":
          notificationTitle = "📸 Check-in disponível!";
          notificationBody = "Já se passaram 30 dias. Registre sua evolução com novas fotos!";
          break;
        case "inactivity":
          notificationTitle = "👋 Sentimos sua falta!";
          notificationBody = "Faz alguns dias que você não aparece. Tudo bem por aí?";
          break;
        case "workout_completed":
          notificationTitle = "🏆 Parabéns, guerreiro!";
          notificationBody = "Treino concluído! Continue assim e os resultados virão.";
          break;
        default:
          notificationTitle = notificationTitle || "Método Renascer";
          notificationBody = notificationBody || "Você tem uma nova notificação";
      }
    }

    const payload: PushPayload = {
      title: notificationTitle,
      body: notificationBody,
      icon: "/favicon.ico",
      tag: notification_type,
      data: data || {},
    };

    // Enviar notificações usando Web Push
    let sentCount = 0;
    const errors: string[] = [];

    for (const sub of filteredSubscriptions) {
      try {
        // Criar JWT para VAPID
        const vapidHeaders = await createVapidHeaders(
          sub.endpoint,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
          "mailto:suporte@metodorenascer.com"
        );

        const pushResponse = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            ...vapidHeaders,
            "Content-Type": "application/json",
            "Content-Encoding": "aes128gcm",
          },
          body: JSON.stringify(payload),
        });

        if (pushResponse.ok || pushResponse.status === 201) {
          sentCount++;
          console.log(`Push enviado para user ${sub.user_id}`);
        } else if (pushResponse.status === 410 || pushResponse.status === 404) {
          // Subscription expirada, remover do banco
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`Subscription removida para user ${sub.user_id}`);
        } else {
          const errorText = await pushResponse.text();
          errors.push(`User ${sub.user_id}: ${pushResponse.status} - ${errorText}`);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erro ao enviar push para user ${sub.user_id}:`, error);
        errors.push(`User ${sub.user_id}: ${errorMessage}`);
      }
    }

    // Registrar no log de notificações
    for (const userId of targetUserIds) {
      await supabase.from("notification_logs").insert({
        user_id: userId,
        notification_type,
        message_content: `${notificationTitle}: ${notificationBody}`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: filteredSubscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao enviar notificação";
    console.error("Erro no send-push:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper para criar headers VAPID
async function createVapidHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  subject: string
): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 horas
    sub: subject,
  };

  const base64Header = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const unsignedToken = `${base64Header}.${base64Payload}`;
  
  // Importar chave privada
  const keyData = base64ToArrayBuffer(privateKey.replace(/-/g, "+").replace(/_/g, "/"));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const base64Signature = arrayBufferToBase64(signature).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsignedToken}.${base64Signature}`;

  return {
    Authorization: `vapid t=${jwt}, k=${publicKey}`,
    TTL: "86400",
  };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
