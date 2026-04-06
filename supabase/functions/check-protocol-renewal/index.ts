import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active protocols with their user info
    const { data: protocols, error: protError } = await supabase
      .from("protocolos")
      .select("id, user_id, created_at, tipo")
      .eq("ativo", true);

    if (protError) throw protError;
    if (!protocols || protocols.length === 0) {
      return new Response(JSON.stringify({ message: "No active protocols" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let notificationsSent = 0;

    for (const protocol of protocols) {
      const createdAt = new Date(protocol.created_at);
      const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince < 28) continue;

      // Check user notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("protocol_renewal_enabled, push_enabled")
        .eq("user_id", protocol.user_id)
        .maybeSingle();

      if (prefs && prefs.protocol_renewal_enabled === false) continue;

      // Determine notification type
      const notificationType = daysSince >= 60 ? "protocol_expired" : "protocol_adjustment";

      // Check cooldown - don't resend if notified in last 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentNotif } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("user_id", protocol.user_id)
        .eq("notification_type", notificationType)
        .gte("sent_at", sevenDaysAgo)
        .limit(1);

      if (recentNotif && recentNotif.length > 0) continue;

      // Build notification content
      const title = daysSince >= 60
        ? "🔄 Protocolo expirado"
        : "📊 Ajuste de protocolo";

      const body = daysSince >= 60
        ? "Seu protocolo completou 60 dias. Envie fotos e medidas de evolução para gerar seu novo protocolo personalizado."
        : "Seu protocolo completou 30 dias. Envie seus dados de evolução para ajustarmos seu treino, dieta e mentalidade.";

      // Send push notification
      if (prefs?.push_enabled !== false) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", protocol.user_id);

        if (subs && subs.length > 0) {
          try {
            await supabase.functions.invoke("send-push", {
              body: {
                user_id: protocol.user_id,
                title,
                body,
                url: "/evolucao",
              },
            });
          } catch (e) {
            console.error("Push error for user", protocol.user_id, e);
          }
        }
      }

      // Send email notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", protocol.user_id)
        .maybeSingle();

      if (profile?.email) {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Método Renascer <noreply@renascerapp.com.br>",
                to: [profile.email],
                subject: title,
                html: `
                  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #c97a2a;">${title}</h2>
                    <p>Olá ${profile.full_name || ""},</p>
                    <p>${body}</p>
                    <p style="margin-top: 24px;">
                      <a href="https://metodorenascer.lovable.app/evolucao" 
                         style="background: #c97a2a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                        Enviar Evolução
                      </a>
                    </p>
                    <p style="color: #888; font-size: 12px; margin-top: 32px;">Método Renascer — Transformação Real</p>
                  </div>
                `,
              }),
            });
          } catch (e) {
            console.error("Email error for user", protocol.user_id, e);
          }
        }
      }

      // Log the notification
      await supabase.from("notification_logs").insert({
        user_id: protocol.user_id,
        notification_type: notificationType,
        message_content: body,
      });

      notificationsSent++;
    }

    return new Response(
      JSON.stringify({ success: true, notifications_sent: notificationsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-protocol-renewal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
