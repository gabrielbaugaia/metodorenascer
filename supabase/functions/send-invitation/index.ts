import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const allowedOrigins = [
  "https://lxdosmjenbaugmhyfanx.lovableproject.com",
  "https://metodorenascer.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Acesso não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem enviar convites." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { full_name, email, whatsapp, plan_type } = await req.json();

    if (!full_name || !email || !plan_type) {
      return new Response(
        JSON.stringify({ error: "Nome, email e plano são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique invitation code
    const inviteCode = `INV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    
    // Store invitation in database (create invitations table or use referral_codes)
    // For now, we'll create the user directly with pending status
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    
    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      if (createError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao criar convite." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with whatsapp
    if (whatsapp) {
      await supabaseAdmin
        .from("profiles")
        .update({ whatsapp, telefone: whatsapp })
        .eq("id", newUser.user.id);
    }

    // Create subscription based on plan
    const planConfig: Record<string, { days: number; price: number; name: string }> = {
      elite_founder: { days: 30, price: 4990, name: "Elite Fundador" },
      mensal: { days: 30, price: 19700, name: "Mensal" },
      trimestral: { days: 90, price: 49700, name: "Trimestral" },
      semestral: { days: 180, price: 69700, name: "Semestral" },
      anual: { days: 365, price: 99700, name: "Anual" },
    };

    const plan = planConfig[plan_type] || planConfig.mensal;
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + plan.days);

    await supabaseAdmin.from("subscriptions").insert({
      user_id: newUser.user.id,
      status: "active",
      plan_type,
      plan_name: plan.name,
      price_cents: plan.price,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      stripe_customer_id: `invite_${inviteCode}`,
    });

    // Generate invitation link
    const baseUrl = "https://metodorenascer.lovable.app";
    const inviteLink = `${baseUrl}/auth?invited=true&email=${encodeURIComponent(email)}`;

    // Send invitation email
    const emailResult = await resend.emails.send({
      from: "Método Renascer <onboarding@resend.dev>",
      to: [email],
      subject: "Seu convite para o Método Renascer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #FF4500; font-size: 28px; margin: 0;">MÉTODO RENASCER</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #333; border-radius: 12px; padding: 32px;">
              <h2 style="color: #ffffff; font-size: 24px; margin-top: 0;">Olá, ${full_name}!</h2>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
                Você foi convidado para fazer parte do <strong style="color: #FF4500;">Método Renascer</strong>!
              </p>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">
                Seu plano <strong style="color: #FF4500;">${plan.name}</strong> já está ativo e aguardando você.
              </p>
              
              <div style="background-color: #1a1a1a; border: 1px solid #444; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #999; margin: 0 0 8px 0; font-size: 14px;">Suas credenciais de acesso:</p>
                <p style="color: #ffffff; margin: 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;"><strong>Senha:</strong> ${tempPassword}</p>
              </div>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${inviteLink}" style="display: inline-block; background-color: #FF4500; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  ACESSAR MINHA CONTA
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; text-align: center; margin-top: 24px;">
                Após o primeiro acesso, recomendamos alterar sua senha.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
              <p>© 2024 Método Renascer. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inviteLink,
        inviteCode,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          temporary_password: tempPassword,
        },
        message: "Convite enviado com sucesso!"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao enviar convite. Tente novamente." }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
