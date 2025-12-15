import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-USER-ACTIVITY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    logStep("Checking dates", { 
      now: now.toISOString(), 
      threeDaysAgo: threeDaysAgo.toISOString(),
      thirtyDaysAgo: thirtyDaysAgo.toISOString()
    });

    // Buscar mensagens automáticas ativas
    const { data: messages } = await supabaseClient
      .from("automated_messages")
      .select("*")
      .eq("is_active", true);

    const inactivityMessage = messages?.find(m => m.trigger_type === "inactivity_3_days");
    const photoReminderMessage = messages?.find(m => m.trigger_type === "photo_reminder_30_days");

    logStep("Messages loaded", { 
      inactivityMessage: !!inactivityMessage, 
      photoReminderMessage: !!photoReminderMessage 
    });

    // Buscar usuários inativos por 3+ dias (que ainda não receberam lembrete recente)
    const { data: inactiveUsers, error: inactiveError } = await supabaseClient
      .from("user_activity")
      .select("user_id, last_access, inactivity_reminder_sent_at")
      .lt("last_access", threeDaysAgo.toISOString())
      .or(`inactivity_reminder_sent_at.is.null,inactivity_reminder_sent_at.lt.${threeDaysAgo.toISOString()}`);

    if (inactiveError) {
      logStep("Error fetching inactive users", { error: inactiveError.message });
    }

    logStep("Inactive users found", { count: inactiveUsers?.length || 0 });

    // Buscar usuários que precisam enviar fotos (30+ dias desde última foto)
    const { data: photoUsers, error: photoError } = await supabaseClient
      .from("user_activity")
      .select("user_id, last_photo_submitted, photo_reminder_sent_at")
      .or(`last_photo_submitted.is.null,last_photo_submitted.lt.${thirtyDaysAgo.toISOString()}`)
      .or(`photo_reminder_sent_at.is.null,photo_reminder_sent_at.lt.${thirtyDaysAgo.toISOString()}`);

    if (photoError) {
      logStep("Error fetching photo users", { error: photoError.message });
    }

    logStep("Photo reminder users found", { count: photoUsers?.length || 0 });

    const notifications: Array<{
      user_id: string;
      notification_type: string;
      message_content: string;
    }> = [];

    // Processar usuários inativos
    if (inactiveUsers && inactivityMessage) {
      for (const user of inactiveUsers) {
        notifications.push({
          user_id: user.user_id,
          notification_type: "inactivity_3_days",
          message_content: inactivityMessage.message_content,
        });

        // Atualizar data do lembrete enviado
        await supabaseClient
          .from("user_activity")
          .update({ inactivity_reminder_sent_at: now.toISOString() })
          .eq("user_id", user.user_id);
      }
    }

    // Processar usuários que precisam enviar fotos
    if (photoUsers && photoReminderMessage) {
      for (const user of photoUsers) {
        // Verificar se já não enviamos notificação de inatividade para este usuário
        const alreadyNotified = notifications.some(n => n.user_id === user.user_id);
        
        if (!alreadyNotified) {
          notifications.push({
            user_id: user.user_id,
            notification_type: "photo_reminder_30_days",
            message_content: photoReminderMessage.message_content,
          });
        }

        // Atualizar data do lembrete enviado
        await supabaseClient
          .from("user_activity")
          .update({ photo_reminder_sent_at: now.toISOString() })
          .eq("user_id", user.user_id);
      }
    }

    // Inserir logs de notificação
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from("notification_logs")
        .insert(notifications);

      if (insertError) {
        logStep("Error inserting notifications", { error: insertError.message });
      } else {
        logStep("Notifications inserted", { count: notifications.length });
      }
    }

    // Também adicionar notificações às conversas dos usuários para aparecer no chat
    for (const notif of notifications) {
      const { data: existingConvo } = await supabaseClient
        .from("conversas")
        .select("id, mensagens")
        .eq("user_id", notif.user_id)
        .eq("tipo", "suporte")
        .maybeSingle();

      const newMessage = {
        role: "assistant",
        content: notif.message_content,
        timestamp: now.toISOString(),
        isSystemNotification: true,
      };

      if (existingConvo) {
        const messages = Array.isArray(existingConvo.mensagens) 
          ? existingConvo.mensagens 
          : [];
        
        await supabaseClient
          .from("conversas")
          .update({ 
            mensagens: [...messages, newMessage],
            updated_at: now.toISOString()
          })
          .eq("id", existingConvo.id);
      } else {
        await supabaseClient
          .from("conversas")
          .insert({
            user_id: notif.user_id,
            tipo: "suporte",
            mensagens: [newMessage],
          });
      }
    }

    logStep("Function completed", { notificationsSent: notifications.length });

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        inactiveUsersProcessed: inactiveUsers?.length || 0,
        photoRemindersProcessed: photoUsers?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
