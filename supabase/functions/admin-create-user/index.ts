import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getCorsHeaders, 
  handleCorsPreflightRequest, 
  createErrorResponse, 
  createSuccessResponse,
  mapErrorToUserMessage 
} from "../_shared/cors.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the request is from an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(req, "Acesso não autorizado.", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return createErrorResponse(req, "Sessão inválida. Faça login novamente.", 401);
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return createErrorResponse(req, "Acesso não autorizado. Apenas administradores podem criar clientes.", 403);
    }

    // Get request body
    const { email, password, full_name, telefone, age, weight, height, goals, nivel_experiencia, plan_type, free_duration_days } = await req.json();

    if (!email || !full_name) {
      return createErrorResponse(req, "Email e nome são obrigatórios", 400);
    }

    // Generate a temporary password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + "A1!";

    // Create user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      const errorMessage = createError.message.toLowerCase().includes("already registered") 
        ? "Este email já está cadastrado."
        : createError.message.toLowerCase().includes("invalid email")
        ? "Email inválido."
        : "Erro ao criar cliente. Tente novamente.";
      return createErrorResponse(req, errorMessage, 400);
    }

    // Update profile with additional data
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        telefone: telefone || null,
        age: age || null,
        weight: weight || null,
        height: height || null,
        goals: goals || null,
        nivel_experiencia: nivel_experiencia || null,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Create subscription if plan_type is provided
    if (plan_type) {
      // Default duration for free is customizable, others are fixed
      const baseDurations: Record<string, number> = {
        gratuito: free_duration_days || 30,
        elite_fundador: 30,
        mensal: 30,
        trimestral: 90,
        semestral: 180,
        anual: 365,
      };

      const planPrices: Record<string, number> = {
        gratuito: 0,
        elite_fundador: 4990,
        mensal: 19700,
        trimestral: 49700,
        semestral: 69700,
        anual: 99700,
      };

      const planNames: Record<string, string> = {
        gratuito: "GRATUITO",
        elite_fundador: "ELITE FUNDADOR",
        mensal: "MENSAL",
        trimestral: "TRIMESTRAL",
        semestral: "SEMESTRAL",
        anual: "ANUAL",
      };

      const durationDays = baseDurations[plan_type] || 30;
      const priceCents = planPrices[plan_type] || 0;
      const planName = planNames[plan_type] || plan_type.toUpperCase();
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + durationDays);

      await supabaseAdmin.from("subscriptions").insert({
        user_id: newUser.user.id,
        status: "active",
        plan_type,
        plan_name: planName,
        price_cents: priceCents,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        stripe_customer_id: `admin_created_${Date.now()}`,
      });
    }

    // Note: Password is intentionally NOT returned in response for security
    // Admin should communicate the password through a secure channel (e.g., in-person, encrypted message)
    // Or use password reset flow for the user
    return createSuccessResponse(req, { 
      success: true, 
      user: { 
        id: newUser.user.id, 
        email: newUser.user.email,
      },
      message: "Cliente criado com sucesso. Comunique a senha temporária de forma segura.",
      password_hint: "A senha temporária foi gerada. Anote-a agora pois não será exibida novamente."
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const userMessage = mapErrorToUserMessage(error);
    return createErrorResponse(req, userMessage);
  }
});
