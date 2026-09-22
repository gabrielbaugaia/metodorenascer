// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Shadow mode / simulação: roda o motor sem gerar nem salvar protocolo.
// Acesso restrito a admin. Nunca escreve em protocolos nem em treinos.
// A única escrita possível é o log da execução em prescription_runs.
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gatherEngineInputs } from "../_shared/prescription-engine/gather.ts";
import { buildPrescriptionPlan } from "../_shared/prescription-engine/engine.ts";
import { evaluateGate } from "../_shared/prescription-engine/gate.ts";
import { buildShadowDiff, currentVolumeFromProtocol } from "../_shared/prescription-engine/shadow.ts";
import { mergeEngineConfig } from "../_shared/prescription-engine/config.ts";
import { TEST_PROFILES, buildTestInputs } from "../_shared/prescription-engine/test-profiles.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { userId, profileKey, log } = body as { userId?: string; profileKey?: string; log?: boolean };

    // Configuração ativa do motor (mesma usada na geração real).
    let config = mergeEngineConfig(null);
    const { data: cfgRow } = await supabase
      .from("prescription_engine_config")
      .select("config")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cfgRow?.config) config = mergeEngineConfig(cfgRow.config);

    // ----- Perfil sintético de teste -----
    if (profileKey) {
      const profile = TEST_PROFILES.find((p) => p.key === profileKey);
      if (!profile) return json({ error: "Perfil de teste desconhecido" }, 400);
      const inputs = buildTestInputs(profile);
      const plan = buildPrescriptionPlan(inputs, config);
      const gate = evaluateGate(plan, inputs);
      return json({
        mode: "perfil_teste",
        profile: { key: profile.key, label: profile.label },
        inputs,
        plan,
        gate,
        diff: [],
        notes: [],
      });
    }

    // ----- Aluno real (shadow mode) -----
    if (!userId) return json({ error: "Informe userId ou profileKey" }, 400);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile) return json({ error: "Aluno não encontrado" }, 404);

    const gathered = await gatherEngineInputs(supabase, userId, profile);
    const plan = buildPrescriptionPlan(gathered.inputs, gathered.config);
    const gate = evaluateGate(plan, gathered.inputs);

    // Protocolo atual, somente leitura, apenas para comparação.
    const { data: current } = await supabase
      .from("protocolos")
      .select("id, created_at, titulo, conteudo, prescription_meta")
      .eq("user_id", userId)
      .eq("tipo", "treino")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentVolume = currentVolumeFromProtocol(current ?? null);
    const diff = buildShadowDiff(plan, currentVolume);

    let runId: string | null = null;
    if (log) {
      const { data: run } = await supabase
        .from("prescription_runs")
        .insert({
          user_id: userId,
          mode: "shadow",
          engine_version: plan.engineVersion,
          status: gate.status,
          review_reasons: gate.reasons,
          confidence: plan.confidence,
          inputs_snapshot: plan.inputsSnapshot,
          plan,
          previous_volume: currentVolume.volume,
          proposed_volume: Object.fromEntries(plan.muscles.map((m) => [m.muscle, m.directSets])),
          changes: diff,
          alerts: plan.safetyAlerts,
          overrides_applied: plan.overridesApplied,
          created_by: user.id,
        })
        .select("id")
        .maybeSingle();
      runId = run?.id ?? null;
    }

    return json({
      mode: "aluno",
      student: { id: userId, name: profile.full_name ?? null },
      inputs: gathered.inputs,
      notes: gathered.notes,
      plan,
      gate,
      diff,
      runId,
      currentProtocol: current
        ? {
          id: current.id,
          titulo: current.titulo,
          created_at: current.created_at,
          volumeSource: currentVolume.source,
        }
        : null,
    });
  } catch (err) {
    console.error("[simulate-prescription]", err);
    return json({ error: err instanceof Error ? err.message : "Erro inesperado" }, 500);
  }
});
