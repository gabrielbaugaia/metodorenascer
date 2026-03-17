import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-WELCOME-CREDENTIALS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, temp_password, plan_name } = await req.json();

    if (!email || !temp_password) {
      return new Response(
        JSON.stringify({ error: "email and temp_password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Sending welcome email", { email, plan_name });

    const loginUrl = "https://metodorenascer.lovable.app/auth";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111;border-radius:12px;padding:40px;border:1px solid #222;">
      <h1 style="color:#d4af37;margin:0 0 8px;font-size:24px;text-align:center;">
        🎉 Bem-vindo ao Método Renascer!
      </h1>
      <p style="color:#999;text-align:center;margin:0 0 32px;font-size:14px;">
        ${plan_name ? `Plano: ${plan_name}` : "Sua assinatura foi ativada com sucesso"}
      </p>

      <p style="color:#ccc;font-size:15px;line-height:1.6;">
        Sua conta foi criada automaticamente. Use as credenciais abaixo para acessar a plataforma:
      </p>

      <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #333;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">E-mail</p>
        <p style="color:#fff;font-size:16px;margin:0 0 16px;font-family:monospace;">${email}</p>
        
        <p style="color:#888;font-size:12px;margin:0 0 4px;">Senha provisória</p>
        <p style="color:#d4af37;font-size:18px;margin:0;font-family:monospace;font-weight:bold;">${temp_password}</p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:#d4af37;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">
          Acessar Plataforma
        </a>
      </div>

      <p style="color:#666;font-size:12px;text-align:center;margin:24px 0 0;">
        Recomendamos alterar sua senha após o primeiro acesso em Configurações.<br>
        Em caso de dúvidas, entre em contato pelo suporte da plataforma.
      </p>
    </div>

    <p style="color:#444;font-size:11px;text-align:center;margin-top:20px;">
      © ${new Date().getFullYear()} Método Renascer. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Método Renascer <noreply@renascerapp.com.br>",
        to: [email],
        subject: "🔑 Suas credenciais de acesso — Método Renascer",
        html: htmlContent,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      logStep("Resend error", { status: res.status, response: resData });
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Email sent successfully", { id: resData.id, email });

    return new Response(
      JSON.stringify({ success: true, id: resData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("Error", { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
