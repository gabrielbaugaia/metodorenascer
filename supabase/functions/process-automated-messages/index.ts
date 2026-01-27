import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TargetAudience {
  type: string;
  plan_filter?: string;
  goal?: string;
}

interface AutomatedMessage {
  id: string;
  trigger_type: string;
  message_title: string;
  message_content: string;
  is_active: boolean;
  target_audience: TargetAudience;
  scheduled_at: string | null;
  schedule_recurring: string | null;
  min_days_since_signup: number | null;
  cooldown_days: number | null;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  objetivo_principal: string | null;
  data_nascimento: string | null;
  client_status: string | null;
  referred_by_code: string | null;
  created_at: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { messageId, sendNow } = await req.json().catch(() => ({}));

    console.log("[process-automated-messages] Processing", { messageId, sendNow });

    // Get messages to process (including new columns)
    let messagesQuery = supabase
      .from("automated_messages")
      .select("*, min_days_since_signup, cooldown_days")
      .eq("is_active", true);

    if (messageId) {
      messagesQuery = messagesQuery.eq("id", messageId);
    } else {
      // Get scheduled messages that are due
      messagesQuery = messagesQuery
        .not("scheduled_at", "is", null)
        .lte("scheduled_at", new Date().toISOString());
    }

    const { data: messages, error: messagesError } = await messagesQuery;
    
    if (messagesError) {
      console.error("[process-automated-messages] Error fetching messages:", messagesError);
      throw messagesError;
    }

    if (!messages || messages.length === 0) {
      console.log("[process-automated-messages] No messages to process");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;
    let totalSkipped = 0;
    const results: { messageId: string; sent: number; skipped: number; errors: string[] }[] = [];

    for (const message of messages as AutomatedMessage[]) {
      console.log(`[process-automated-messages] Processing message: ${message.message_title} (id: ${message.id})`);
      
      const audience = message.target_audience || { type: "all" };
      const errors: string[] = [];
      let skippedCount = 0;

      // Build query based on audience
      let profilesQuery = supabase.from("profiles").select("*");

      switch (audience.type) {
        case "active":
          profilesQuery = profilesQuery.eq("client_status", "active");
          break;
        case "inactive":
          profilesQuery = profilesQuery.in("client_status", ["paused", "blocked", "canceled"]);
          break;
        case "free_invites":
          profilesQuery = profilesQuery.not("referred_by_code", "is", null);
          break;
        case "inactive_after_signup":
          // Get users who haven't accessed after signup (no events)
          const { data: inactiveUsers } = await supabase.rpc("get_inactive_after_signup_users") || { data: [] };
          if (inactiveUsers && inactiveUsers.length > 0) {
            profilesQuery = profilesQuery.in("id", inactiveUsers.map((u: { id: string }) => u.id));
          } else {
            profilesQuery = profilesQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // No matches
          }
          break;
        case "birthday":
          // Get today's birthday users
          const today = new Date();
          const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          profilesQuery = profilesQuery.like("data_nascimento", `%-${monthDay}`);
          break;
        case "goal_emagrecimento":
          profilesQuery = profilesQuery.ilike("objetivo_principal", "%emagrec%");
          break;
        case "goal_hipertrofia":
          profilesQuery = profilesQuery.or("objetivo_principal.ilike.%hipertrofia%,objetivo_principal.ilike.%massa%,objetivo_principal.ilike.%musculo%");
          break;
        case "goal_condicionamento":
          profilesQuery = profilesQuery.ilike("objetivo_principal", "%condicionamento%");
          break;
        default:
          // "all" - no filter
          break;
      }

      // Apply plan filter if applicable
      if (audience.plan_filter && audience.plan_filter !== "all") {
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("user_id, plan_type")
          .eq("status", "active");

        if (subscriptions) {
          const freeUserIds = subscriptions
            .filter((s: { plan_type: string | null }) => s.plan_type === "free" || s.plan_type === "gratuito" || !s.plan_type)
            .map((s: { user_id: string }) => s.user_id);
          const paidUserIds = subscriptions
            .filter((s: { plan_type: string | null }) => s.plan_type && s.plan_type !== "free" && s.plan_type !== "gratuito")
            .map((s: { user_id: string }) => s.user_id);

          if (audience.plan_filter === "free") {
            profilesQuery = profilesQuery.in("id", freeUserIds.length > 0 ? freeUserIds : ["00000000-0000-0000-0000-000000000000"]);
          } else if (audience.plan_filter === "paid") {
            profilesQuery = profilesQuery.in("id", paidUserIds.length > 0 ? paidUserIds : ["00000000-0000-0000-0000-000000000000"]);
          }
        }
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) {
        console.error("[process-automated-messages] Error fetching profiles:", profilesError);
        errors.push(`Profile fetch error: ${profilesError.message}`);
        continue;
      }

      if (!profiles || profiles.length === 0) {
        console.log(`[process-automated-messages] No matching profiles for message: ${message.message_title}`);
        results.push({ messageId: message.id, sent: 0, skipped: 0, errors: ["No matching profiles"] });
        continue;
      }

      console.log(`[process-automated-messages] Found ${profiles.length} profiles for message: ${message.message_title}`);

      // Send to each profile
      for (const profile of profiles as Profile[]) {
        if (!profile.email) {
          errors.push(`No email for user ${profile.id}`);
          continue;
        }

        // === CHECK 1: min_days_since_signup ===
        const minDays = message.min_days_since_signup || 0;
        if (minDays > 0 && profile.created_at) {
          const daysSinceSignup = Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceSignup < minDays) {
            console.log(`[process-automated-messages] Skipping ${profile.email}: only ${daysSinceSignup} days since signup, needs ${minDays}`);
            skippedCount++;
            continue;
          }
        }

        // === CHECK 2: cooldown_days ===
        const cooldownDays = message.cooldown_days || 0;
        if (cooldownDays > 0) {
          const { data: lastSend } = await supabase
            .from("message_sends")
            .select("sent_at")
            .eq("message_id", message.id)
            .eq("user_id", profile.id)
            .order("sent_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (lastSend) {
            const daysSinceLastSend = Math.floor(
              (Date.now() - new Date(lastSend.sent_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceLastSend < cooldownDays) {
              console.log(`[process-automated-messages] Skipping ${profile.email}: cooldown active (${daysSinceLastSend}/${cooldownDays} days)`);
              skippedCount++;
              continue;
            }
          }
        }

        // === CHECK 3: Re-verify is_active before sending (prevent race condition) ===
        const { data: currentMessage } = await supabase
          .from("automated_messages")
          .select("is_active")
          .eq("id", message.id)
          .single();

        if (!currentMessage?.is_active) {
          console.log(`[process-automated-messages] Message ${message.id} was deactivated before send`);
          break; // Stop processing this message entirely
        }

        try {
          // Record the send attempt
          const { error: sendError } = await supabase.from("message_sends").insert({
            message_id: message.id,
            user_id: profile.id,
            status: "sent",
          });

          if (sendError) {
            errors.push(`DB error for ${profile.email}: ${sendError.message}`);
            continue;
          }

          // Send email if Resend is configured
          if (resend) {
            const personalizedContent = message.message_content
              .replace(/\{nome\}/gi, profile.full_name.split(' ')[0] || 'Cliente')
              .replace(/\{nome_completo\}/gi, profile.full_name || 'Cliente');

            await resend.emails.send({
              from: "Renascer <contato@renascerapp.com.br>",
              to: [profile.email],
              subject: message.message_title,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #333;">${message.message_title}</h1>
                  <div style="color: #666; line-height: 1.6;">
                    ${personalizedContent.replace(/\n/g, '<br>')}
                  </div>
                  <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px;">
                    Renascer - Sua jornada de transformação
                  </p>
                </div>
              `,
            });
          }

          totalSent++;
          console.log(`[process-automated-messages] Sent to ${profile.email}`);
        } catch (emailError) {
          const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
          errors.push(`Email error for ${profile.email}: ${errorMessage}`);
          
          // Update send status to failed
          await supabase.from("message_sends")
            .update({ status: "failed", error_message: errorMessage })
            .eq("message_id", message.id)
            .eq("user_id", profile.id);
        }
      }

      totalSkipped += skippedCount;
      results.push({ messageId: message.id, sent: totalSent, skipped: skippedCount, errors });

      // Update scheduled_at for recurring messages or clear for one-time
      if (message.schedule_recurring && message.schedule_recurring !== "once") {
        let nextDate = new Date(message.scheduled_at!);
        switch (message.schedule_recurring) {
          case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case "monthly":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        }
        await supabase
          .from("automated_messages")
          .update({ scheduled_at: nextDate.toISOString() })
          .eq("id", message.id);
      } else if (message.scheduled_at && !sendNow) {
        // Clear scheduled_at for one-time sends
        await supabase
          .from("automated_messages")
          .update({ scheduled_at: null })
          .eq("id", message.id);
      }
    }

    console.log(`[process-automated-messages] Completed: sent ${totalSent}, skipped ${totalSkipped}`);

    return new Response(JSON.stringify({ processed: messages.length, totalSent, totalSkipped, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[process-automated-messages] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
