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
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] ========================================`);
  console.log(`[${requestId}] URGENT SUPPORT ALERT REQUEST`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);

  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Step 1: Checking RESEND_API_KEY...`);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error(`[${requestId}] ERROR: RESEND_API_KEY not configured`);
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    console.log(`[${requestId}] ✓ RESEND_API_KEY present: ${resendApiKey.slice(0, 8)}...`);
    
    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[${requestId}] Step 2: Parsing request body...`);
    const {
      userId,
      conversaId,
      clientName,
      clientEmail,
      messagePreview,
      keywordsDetected,
      urgencyReason
    }: UrgentAlertRequest = await req.json();
    
    console.log(`[${requestId}] Alert details:`);
    console.log(`[${requestId}] - Client: ${clientName}`);
    console.log(`[${requestId}] - Keywords: ${keywordsDetected.join(', ')}`);
    console.log(`[${requestId}] - Reason: ${urgencyReason}`);

    // 1. Save alert to database
    console.log(`[${requestId}] Step 3: Saving alert to database...`);
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
      console.error(`[${requestId}] ERROR saving alert:`, alertError);
    } else {
      console.log(`[${requestId}] ✓ Alert saved to database`);
    }

    // 2. Use fixed email while domain is not verified in Resend
    console.log(`[${requestId}] Step 4: Preparing email...`);
    const adminEmail = "gabrielbaugaia@gmail.com";
    console.log(`[${requestId}] Sending to: ${adminEmail} (domain not verified in Resend)`);

    // 3. Send urgent email alert
    const keywordsList = keywordsDetected.length > 0 
      ? keywordsDetected.join(", ") 
      : "Não identificadas";

    console.log(`[${requestId}] Step 5: Sending email via Resend...`);

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

    const elapsed = Date.now() - startTime;
    
    console.log(`[${requestId}] ========================================`);
    console.log(`[${requestId}] EMAIL SEND RESULT:`);
    console.log(`[${requestId}] Response:`, JSON.stringify(emailResponse, null, 2));
    
    if (emailResponse.error) {
      console.error(`[${requestId}] ❌ EMAIL SEND FAILED`);
      console.error(`[${requestId}] Error: ${emailResponse.error.message}`);
    } else {
      console.log(`[${requestId}] ✓ EMAIL SENT SUCCESSFULLY`);
      console.log(`[${requestId}] Email ID: ${emailResponse.data?.id}`);
    }
    console.log(`[${requestId}] Total time: ${elapsed}ms`);
    console.log(`[${requestId}] ========================================`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      requestId,
      elapsedMs: elapsed
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] ========================================`);
    console.error(`[${requestId}] ❌ CRITICAL ERROR in send-urgent-support-alert`);
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    console.error(`[${requestId}] Time elapsed: ${elapsed}ms`);
    console.error(`[${requestId}] ========================================`);
    
    return new Response(
      JSON.stringify({ error: error.message, requestId }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
