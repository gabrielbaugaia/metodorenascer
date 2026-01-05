import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { 
  getCorsHeaders, 
  handleCorsPreflightRequest, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/cors.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return createErrorResponse(req, "Serviço de email não configurado.");
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
      return createErrorResponse(req, "Acesso não autorizado.", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return createErrorResponse(req, "Sessão inválida.", 401);
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return createErrorResponse(req, "Apenas administradores podem enviar convites.", 403);
    }

    // Get request body
    const { full_name, email, whatsapp, plan_type } = await req.json();

    if (!full_name || !email || !plan_type) {
      return createErrorResponse(req, "Nome, email e plano são obrigatórios.", 400);
    }

    // Generate unique invitation code
    const inviteCode = `INV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    
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
        return createErrorResponse(req, "Este email já está cadastrado.", 400);
      }
      return createErrorResponse(req, "Erro ao criar convite.", 400);
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
      free: { days: 365, price: 0, name: "Gratuito" },
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
      from: "Método Renascer <noreply@renascerapp.com.br>",
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

    return createSuccessResponse(req, { 
      success: true, 
      inviteLink,
      inviteCode,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        temporary_password: tempPassword,
      },
      message: "Convite enviado com sucesso!"
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    return createErrorResponse(req, "Erro ao enviar convite. Tente novamente.");
  }
});
