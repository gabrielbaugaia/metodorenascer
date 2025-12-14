import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the request is from an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { email, password, full_name, telefone, age, weight, height, goals, nivel_experiencia, plan_type } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a temporary password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + "A1!";

    // Create user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Create subscription if plan_type is provided and not 'free'
    if (plan_type && plan_type !== "free") {
      const planDurations: Record<string, number> = {
        elite_founder: 30,
        mensal: 30,
        trimestral: 90,
        semestral: 180,
        anual: 365,
      };

      const planPrices: Record<string, number> = {
        elite_founder: 4990,
        mensal: 19700,
        trimestral: 49700,
        semestral: 69700,
        anual: 99700,
      };

      const durationDays = planDurations[plan_type] || 30;
      const priceCents = planPrices[plan_type] || 4990;
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + durationDays);

      await supabaseAdmin.from("subscriptions").insert({
        user_id: newUser.user.id,
        status: "active",
        plan_type,
        price_cents: priceCents,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        stripe_customer_id: `admin_created_${Date.now()}`,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email,
          temporary_password: userPassword,
        },
        message: "Cliente criado com sucesso"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
