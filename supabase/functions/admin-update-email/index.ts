import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  handleCorsPreflightRequest, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/cors.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(req, "Não autorizado", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return createErrorResponse(req, "Token inválido", 401);
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return createErrorResponse(req, "Acesso negado - apenas administradores", 403);
    }

    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      return createErrorResponse(req, "userId e newEmail são obrigatórios", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return createErrorResponse(req, "Formato de email inválido", 400);
    }

    console.log(`Updating email for user ${userId} to ${newEmail}`);

    // Update the user's email using admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        email: newEmail,
        email_confirm: true 
      }
    );

    if (updateError) {
      console.error("Error updating email:", updateError);
      
      let userMessage = "Erro ao atualizar email";
      const errorMessage = updateError.message.toLowerCase();
      
      if (errorMessage.includes("already") || errorMessage.includes("exists") || errorMessage.includes("duplicate")) {
        userMessage = "Este email já está em uso por outra conta.";
      } else if (errorMessage.includes("invalid")) {
        userMessage = "Formato de email inválido.";
      }
      
      return createErrorResponse(req, userMessage, 400);
    }

    // Also update the email in the profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile email:", profileError);
      // Don't fail the request, auth email was updated successfully
    }

    console.log(`Email updated successfully for user ${userId}`);

    return createSuccessResponse(req, { 
      success: true, 
      message: "Email atualizado com sucesso",
      newEmail: updatedUser.user.email
    });
  } catch (error: unknown) {
    console.error("Error in admin-update-email:", error);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
