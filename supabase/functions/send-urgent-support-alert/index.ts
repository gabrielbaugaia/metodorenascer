import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UrgentAlertRequest {
  userId: string;
  conversaId?: string;
  clientName: string;
  clientEmail?: string;
  messagePreview: string;
  keywordsDetected: string[];
  urgencyReason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      userId,
      conversaId,
      clientName,
      clientEmail,
      messagePreview,
      keywordsDetected,
      urgencyReason
    }: UrgentAlertRequest = await req.json();

    // 1. Save alert to database
    const { error: alertError } = await supabase
      .from("admin_support_alerts")
      .insert({
        user_id: userId,
        conversa_id: conversaId,
        alert_type: "urgent_support",
        urgency_level: "urgent",
        message_preview: messagePreview,
        keywords_detected: keywordsDetected,
      });

    if (alertError) {
      console.error("Error saving alert:", alertError);
    }

    // 2. Get admin email - first fetch admin users
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    let adminEmail = "contato@gabrielbau.com.br"; // fallback

    if (adminRoles && adminRoles.length > 0) {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", adminRoles[0].user_id)
        .single();
      
      if (adminProfile?.email) {
        adminEmail = adminProfile.email;
      }
    }

    // 3. Send urgent email alert
    const keywordsList = keywordsDetected.length > 0 
      ? keywordsDetected.join(", ") 
      : "Não identificadas";

    const emailResponse = await resend.emails.send({
      from: "Suporte Urgente <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🚨 SUPORTE URGENTE - ${clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: 600; color: #64748b; min-width: 120px; }
            .info-value { color: #1e293b; }
            .message-preview { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0; }
            .keywords { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
            .keyword { background: #fecaca; color: #991b1b; padding: 4px 12px; border-radius: 16px; font-size: 12px; }
            .cta-button { display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Alerta de Suporte Urgente</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Intervenção imediata necessária</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>Motivo da Urgência:</strong><br>
                ${urgencyReason}
              </div>

              <div class="info-row">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${clientName}</span>
              </div>
              
              ${clientEmail ? `
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${clientEmail}</span>
              </div>
              ` : ''}

              <div class="info-row">
                <span class="info-label">Palavras-chave:</span>
                <span class="info-value">
                  <div class="keywords">
                    ${keywordsDetected.map(k => `<span class="keyword">${k}</span>`).join('')}
                  </div>
                </span>
              </div>

              <h3 style="margin-top: 24px; margin-bottom: 8px;">Prévia da Mensagem:</h3>
              <div class="message-preview">
                "${messagePreview}"
              </div>

              <center>
                <a href="https://preview--formadeser.lovable.app/admin/suporte-chats" class="cta-button">
                  Ver Conversa Completa
                </a>
              </center>
            </div>
            <div class="footer">
              <p>Este é um email automático do sistema Método Gabriel Bau.</p>
              <p>Por favor, responda ao cliente o mais rápido possível.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Urgent alert email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-urgent-support-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
