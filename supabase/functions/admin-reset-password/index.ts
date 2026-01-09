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

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return createErrorResponse(req, "userId e newPassword são obrigatórios", 400);
    }

    if (newPassword.length < 6) {
      return createErrorResponse(req, "A senha deve ter pelo menos 6 caracteres", 400);
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      
      // Map known error messages to user-friendly Portuguese messages
      let userMessage = "Erro ao atualizar senha";
      const errorMessage = updateError.message.toLowerCase();
      
      if (errorMessage.includes("weak") || errorMessage.includes("compromised") || errorMessage.includes("pwned")) {
        userMessage = "Senha muito fraca ou já foi comprometida em vazamentos de dados. Use uma senha mais forte com letras maiúsculas, minúsculas, números e símbolos (ex: Cliente@2024!).";
      } else if (errorMessage.includes("same") || errorMessage.includes("different")) {
        userMessage = "A nova senha não pode ser igual à senha atual.";
      } else if (errorMessage.includes("short") || errorMessage.includes("length") || errorMessage.includes("at least")) {
        userMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (errorMessage.includes("common") || errorMessage.includes("simple")) {
        userMessage = "Senha muito comum. Use uma combinação única de caracteres.";
      }
      
      return createErrorResponse(req, userMessage, 400);
    }

    return createSuccessResponse(req, { success: true, message: "Senha atualizada com sucesso" });
  } catch (error: unknown) {
    console.error("Error in admin-reset-password:", error);
    return createErrorResponse(req, "Erro interno", 400);
  }
});
