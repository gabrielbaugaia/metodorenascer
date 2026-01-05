import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] ========================================`);
  console.log(`[${requestId}] PASSWORD RESET REQUEST STARTED`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[${requestId}] Method: ${req.method}`);

  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate environment variables
    console.log(`[${requestId}] Step 1: Checking environment variables...`);
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!resendApiKey) {
      console.error(`[${requestId}] ERROR: RESEND_API_KEY not configured`);
      return new Response(JSON.stringify({ error: "Serviço de email não configurado" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] ERROR: Supabase credentials not configured`);
      return new Response(JSON.stringify({ error: "Serviço de banco de dados não configurado" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log(`[${requestId}] ✓ All environment variables present`);
    console.log(`[${requestId}] RESEND_API_KEY: ${resendApiKey.slice(0, 8)}...`);

    // 2. Initialize clients
    console.log(`[${requestId}] Step 2: Initializing clients...`);
    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[${requestId}] ✓ Resend and Supabase clients initialized`);

    // 3. Parse request body
    console.log(`[${requestId}] Step 3: Parsing request body...`);
    const { email }: PasswordResetRequest = await req.json();
    console.log(`[${requestId}] Email requested: ${email}`);

    if (!email || !email.includes("@")) {
      console.error(`[${requestId}] ERROR: Invalid email format`);
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 4. Check if user exists
    console.log(`[${requestId}] Step 4: Checking if user exists...`);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error(`[${requestId}] ERROR querying profile:`, profileError);
    }

    if (!profile) {
      console.log(`[${requestId}] User not found for email: ${email}`);
      // Return success anyway to prevent email enumeration
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Se o email existir, você receberá um link de recuperação" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[${requestId}] ✓ User found: ${profile.full_name} (ID: ${profile.id})`);

    // 5. Generate password reset link using Supabase Auth
    console.log(`[${requestId}] Step 5: Generating password reset link...`);
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://metodorenascer.lovable.app/redefinir-senha',
      }
    });

    if (resetError) {
      console.error(`[${requestId}] ERROR generating reset link:`, resetError);
      throw new Error("Erro ao gerar link de recuperação");
    }

    const resetLink = resetData.properties?.action_link;
    console.log(`[${requestId}] ✓ Reset link generated successfully`);
    console.log(`[${requestId}] Link preview: ${resetLink?.slice(0, 50)}...`);

    // 6. Send email via Resend
    console.log(`[${requestId}] Step 6: Sending email via Resend...`);
    console.log(`[${requestId}] To: ${email}`);
    console.log(`[${requestId}] From: Método Renascer <onboarding@resend.dev>`);

    // Use gabrielbaugaia@gmail.com while domain is not verified
    const recipientEmail = "gabrielbaugaia@gmail.com";
    console.log(`[${requestId}] NOTE: Sending to ${recipientEmail} (domain not verified in Resend)`);

    const emailResponse = await resend.emails.send({
      from: "Método Renascer <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: "🔑 Recuperação de Senha - Método Renascer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #ffffff; margin: 0; padding: 0; background: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { text-align: center; margin-bottom: 32px; }
            .logo h1 { color: #FF4500; font-size: 28px; margin: 0; letter-spacing: 2px; }
            .card { background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #333; border-radius: 16px; padding: 40px; }
            .greeting { font-size: 22px; margin-bottom: 16px; }
            .message { color: #cccccc; font-size: 16px; margin-bottom: 24px; }
            .cta-container { text-align: center; margin: 32px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #FF4500, #ff6b35); color: white; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 69, 0, 0.4); }
            .expire-notice { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; }
            .expire-notice p { margin: 0; color: #999; font-size: 14px; }
            .expire-notice strong { color: #FF4500; }
            .security-notice { color: #666; font-size: 13px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #333; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>🔥 MÉTODO RENASCER</h1>
            </div>
            
            <div class="card">
              <h2 class="greeting">Olá, ${profile.full_name || 'Guerreiro(a)'}!</h2>
              
              <p class="message">
                Recebemos uma solicitação para redefinir a senha da sua conta. 
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <div class="cta-container">
                <a href="${resetLink}" class="cta-button">
                  REDEFINIR MINHA SENHA
                </a>
              </div>
              
              <div class="expire-notice">
                <p>⏰ Este link expira em <strong>24 horas</strong></p>
              </div>
              
              <div class="security-notice">
                <p><strong>🔒 Dica de segurança:</strong> Se você não solicitou esta recuperação de senha, ignore este email. Sua conta permanece segura.</p>
                <p style="margin-top: 12px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                <p style="word-break: break-all; color: #FF4500; font-size: 12px;">${resetLink}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Método Renascer by Gabriel Bau</p>
              <p>Este é um email automático. Por favor, não responda.</p>
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
    console.log(`[${requestId}] ========================================`);
    
    if (emailResponse.error) {
      console.error(`[${requestId}] ❌ EMAIL SEND FAILED`);
      console.error(`[${requestId}] Error:`, JSON.stringify(emailResponse.error));
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Falha ao enviar email",
        details: emailResponse.error
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[${requestId}] ✓ EMAIL SENT SUCCESSFULLY`);
    console.log(`[${requestId}] Email ID: ${emailResponse.data?.id}`);
    console.log(`[${requestId}] Total time: ${elapsed}ms`);
    console.log(`[${requestId}] ========================================`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de recuperação enviado com sucesso!",
      emailId: emailResponse.data?.id,
      debug: {
        requestId,
        elapsedMs: elapsed,
        recipientNote: `Email enviado para ${recipientEmail} (verificar domínio em resend.com/domains para enviar para ${email})`
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] ========================================`);
    console.error(`[${requestId}] ❌ CRITICAL ERROR in send-password-reset`);
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    console.error(`[${requestId}] Time elapsed: ${elapsed}ms`);
    console.error(`[${requestId}] ========================================`);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        requestId,
        elapsedMs: elapsed
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
