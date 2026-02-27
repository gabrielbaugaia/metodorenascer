import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EXTERNAL-ANAMNESE] ${step}${detailsStr}`);
};

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, token, formData } = await req.json();

    // Action: validate - check token and return client name
    if (action === "validate") {
      logStep("Validating token", { token });

      const { data: tokenData, error } = await supabase
        .from("anamnese_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !tokenData) {
        logStep("Token not found");
        return createErrorResponse(req, "Link inválido ou expirado", 404);
      }

      if (tokenData.used_at) {
        logStep("Token already used");
        return createErrorResponse(req, "Este link já foi utilizado", 410);
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        logStep("Token expired");
        return createErrorResponse(req, "Este link expirou. Solicite um novo ao seu treinador.", 410);
      }

      // Get client name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", tokenData.user_id)
        .single();

      return createSuccessResponse(req, {
        valid: true,
        clientName: profile?.full_name || "Cliente",
        userId: tokenData.user_id,
      });
    }

    // Action: submit - save anamnese data
    if (action === "submit") {
      logStep("Submitting anamnese", { token });

      // Re-validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from("anamnese_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenData) {
        return createErrorResponse(req, "Link inválido", 404);
      }

      if (tokenData.used_at) {
        return createErrorResponse(req, "Este link já foi utilizado", 410);
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return createErrorResponse(req, "Este link expirou", 410);
      }

      const userId = tokenData.user_id;

      // Calculate age from birth date
      let age: number | null = null;
      if (formData.data_nascimento) {
        const birthDate = new Date(formData.data_nascimento);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Normalize nivel_experiencia
      const nivelMap: Record<string, string> = {
        'Sedentário': 'iniciante',
        'Iniciante': 'iniciante',
        'Intermediário': 'intermediario',
        'Avançado': 'avancado',
      };
      const nivelExperiencia = nivelMap[formData.nivel_condicionamento] || 'iniciante';

      // Build restrictions string
      const restricoesMedicas = [
        formData.injuries,
        formData.toma_medicamentos === "sim" ? `Medicamentos: ${formData.medicamentos_detalhes || ""}` : "",
      ].filter(Boolean).join(" | ");

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          age,
          data_nascimento: formData.data_nascimento || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          telefone: formData.whatsapp || null,
          sexo: formData.sexo || null,
          goals: formData.objetivo_principal || null,
          objetivo_principal: formData.objetivo_principal || null,
          ja_treinou_antes: formData.ja_treinou_antes === "sim",
          local_treino: formData.local_treino || null,
          availability: formData.dias_disponiveis || null,
          dias_disponiveis: formData.dias_disponiveis || null,
          nivel_experiencia: nivelExperiencia,
          nivel_condicionamento: formData.nivel_condicionamento || null,
          pratica_aerobica: formData.pratica_aerobica === "sim",
          escada_sem_cansar: formData.escada_sem_cansar || null,
          condicoes_saude: formData.condicoes_saude || null,
          injuries: formData.injuries || null,
          restricoes_medicas: restricoesMedicas || null,
          toma_medicamentos: formData.toma_medicamentos === "sim",
          refeicoes_por_dia: formData.refeicoes_por_dia || null,
          bebe_agua_frequente: formData.bebe_agua_frequente === "sim",
          restricoes_alimentares: formData.restricoes_alimentares || null,
          qualidade_sono: formData.qualidade_sono || null,
          nivel_estresse: formData.nivel_estresse || null,
          consome_alcool: formData.consome_alcool || null,
          fuma: formData.fuma || null,
          horario_treino: formData.horario_treino || null,
          horario_acorda: formData.horario_acorda || null,
          horario_dorme: formData.horario_dorme || null,
          observacoes_adicionais: formData.observacoes_adicionais || null,
          anamnese_completa: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        logStep("Profile update failed", { error: updateError.message });
        return createErrorResponse(req, "Erro ao salvar dados", 500);
      }

      // Mark token as used
      await supabase
        .from("anamnese_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      logStep("Anamnese submitted successfully", { userId });

      return createSuccessResponse(req, { success: true });
    }

    return createErrorResponse(req, "Ação inválida", 400);
  } catch (error) {
    console.error("[EXTERNAL-ANAMNESE] Error:", error);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
