import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
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
      return createErrorResponse(req, "Apenas administradores podem deletar usuários.", 403);
    }

    // Get request body
    const { email } = await req.json();

    if (!email) {
      return createErrorResponse(req, "Email é obrigatório.", 400);
    }

    // Prevent deleting the admin user
    if (email === "baugabriel@icloud.com") {
      return createErrorResponse(req, "Não é possível deletar o usuário admin.", 400);
    }

    // Find user by email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return createErrorResponse(req, "Erro ao buscar usuários.");
    }

    const userToDelete = usersData.users.find(u => u.email === email);
    
    if (!userToDelete) {
      return createErrorResponse(req, "Usuário não encontrado.", 404);
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return createErrorResponse(req, "Erro ao deletar usuário.");
    }

    console.log(`User ${email} deleted successfully by admin ${requestingUser.email}`);

    return createSuccessResponse(req, { 
      success: true, 
      message: `Usuário ${email} deletado com sucesso!`
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const userMessage = mapErrorToUserMessage(error);
    return createErrorResponse(req, userMessage);
  }
});
