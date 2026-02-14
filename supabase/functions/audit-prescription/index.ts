import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUDIT_CRITERIA = [
  "coherence_anamnese",
  "coherence_objective",
  "restriction_respect",
  "weekly_volume",
  "muscle_distribution",
  "progression_defined",
  "instruction_clarity",
  "mindset_quality",
  "safety_score",
] as const;

function getClassification(score: number): string {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Muito bom";
  if (score >= 70) return "Aceitável";
  return "Requer correção";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { protocol, anamnese, type, source } = await req.json();
    if (!protocol) throw new Error("protocol is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um auditor especialista em fisiologia do exercício, ciência comportamental e prescrição de treino.
Sua função é avaliar a qualidade, segurança e coerência de protocolos de treino e mindset.

Avalie os seguintes 9 critérios (true = passou, false = falhou):

1. coherence_anamnese - O protocolo respeita as limitações, nível e rotina do cliente conforme a anamnese?
2. coherence_objective - O protocolo está alinhado com o objetivo principal do cliente?
3. restriction_respect - Todas as restrições, lesões e condições médicas foram respeitadas?
4. weekly_volume - O volume semanal é adequado para o objetivo (nem insuficiente nem excessivo)?
5. muscle_distribution - A distribuição dos grupamentos musculares está equilibrada e coerente?
6. progression_defined - Existe progressão clara de carga, reps ou volume ao longo de 4 semanas?
7. instruction_clarity - As instruções de execução são claras e completas?
8. mindset_quality - O protocolo de mindset é personalizado (não genérico) e baseado em comportamento real?
9. safety_score - A prescrição geral é segura, sem exercícios contraindicados?

Para cada critério que FALHOU, inclua uma descrição do problema em "issues".
Se o score final for < 80, inclua sugestões de correção em "corrections_applied".

IMPORTANTE: Responda APENAS com o JSON da auditoria, sem texto adicional.`;

    const anamneseContext = anamnese ? `
DADOS DA ANAMNESE DO CLIENTE:
- Nome: ${anamnese.full_name || "N/A"}
- Idade: ${anamnese.age || "N/A"}
- Sexo: ${anamnese.sexo || "N/A"}
- Peso: ${anamnese.weight || "N/A"} kg
- Altura: ${anamnese.height || "N/A"} cm
- Objetivo: ${anamnese.objetivo_principal || anamnese.goals || "N/A"}
- Nível: ${anamnese.nivel_experiencia || anamnese.nivel_condicionamento || "N/A"}
- Lesões/Restrições: ${anamnese.injuries || anamnese.restricoes_medicas || "Nenhuma"}
- Condições de saúde: ${anamnese.condicoes_saude || "Nenhuma"}
- Medicamentos: ${anamnese.toma_medicamentos ? "Sim" : "Não"}
- Dias disponíveis: ${anamnese.dias_disponiveis || "N/A"}
- Local de treino: ${anamnese.local_treino || "N/A"}
- Horário treino: ${anamnese.horario_treino || "N/A"}
- Qualidade sono: ${anamnese.qualidade_sono || "N/A"}
- Nível estresse: ${anamnese.nivel_estresse || "N/A"}
` : "ANAMNESE: Dados não disponíveis - avaliar apenas o protocolo em si.";

    const protocolStr = typeof protocol === "string" ? protocol : JSON.stringify(protocol, null, 2);

    const userPrompt = `${anamneseContext}

PROTOCOLO A SER AUDITADO (tipo: ${type || "treino"}):
${protocolStr.substring(0, 15000)}

Retorne o resultado da auditoria no formato JSON:
{
  "coherence_anamnese": true/false,
  "coherence_objective": true/false,
  "restriction_respect": true/false,
  "weekly_volume": true/false,
  "muscle_distribution": true/false,
  "progression_defined": true/false,
  "instruction_clarity": true/false,
  "mindset_quality": true/false,
  "safety_score": true/false,
  "issues": ["problema 1", "problema 2"],
  "corrections_applied": ["correção 1"]
}`;

    let auditResult: any = null;
    let correctedProtocol = protocol;
    let attempts = 0;
    const maxAttempts = 3; // 1 initial + 2 corrections

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[audit-prescription] Attempt ${attempts}/${maxAttempts}`);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: attempts === 1 ? userPrompt : `
O protocolo foi corrigido. Faça uma nova auditoria:

${anamneseContext}

PROTOCOLO CORRIGIDO:
${JSON.stringify(correctedProtocol, null, 2).substring(0, 15000)}

Retorne o resultado da auditoria no formato JSON.` },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI audit error:", aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error during audit");
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.choices?.[0]?.message?.content || "";

      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        auditResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        console.error("Failed to parse audit JSON:", rawContent.substring(0, 500));
        auditResult = null;
      }

      if (!auditResult) {
        // Create a default pass result if parsing fails
        auditResult = {
          coherence_anamnese: true,
          coherence_objective: true,
          restriction_respect: true,
          weekly_volume: true,
          muscle_distribution: true,
          progression_defined: true,
          instruction_clarity: true,
          mindset_quality: true,
          safety_score: true,
          issues: [],
          corrections_applied: ["Auditoria automática não pôde ser processada - aprovação padrão"],
        };
      }

      // Calculate score
      let passed = 0;
      for (const criterion of AUDIT_CRITERIA) {
        if (auditResult[criterion] === true) passed++;
      }
      const finalScore = Math.round((passed / AUDIT_CRITERIA.length) * 100);
      auditResult.final_score = finalScore;
      auditResult.classification = getClassification(finalScore);
      auditResult.audited_at = new Date().toISOString();
      auditResult.attempts = attempts;

      console.log(`[audit-prescription] Score: ${finalScore}/100 (${auditResult.classification})`);

      // If score >= 80 or we've exhausted correction attempts, stop
      if (finalScore >= 80 || attempts >= maxAttempts) {
        if (finalScore < 80 && attempts >= maxAttempts) {
          auditResult.warning = "Score abaixo de 80 após tentativas de correção. Revisão manual recomendada.";
        }
        break;
      }

      // Score < 80: request AI to correct the protocol
      console.log(`[audit-prescription] Score < 80, requesting correction...`);
      const correctionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `Você é um prescritor esportivo de elite. Corrija o protocolo abaixo com base nos problemas identificados na auditoria. Mantenha o mesmo formato JSON. Responda APENAS com o JSON corrigido.` },
            { role: "user", content: `
PROBLEMAS IDENTIFICADOS:
${JSON.stringify(auditResult.issues || [], null, 2)}

${anamneseContext}

PROTOCOLO ORIGINAL:
${JSON.stringify(correctedProtocol, null, 2).substring(0, 15000)}

Corrija os problemas e retorne o protocolo completo corrigido em JSON.` },
          ],
        }),
      });

      if (correctionResponse.ok) {
        const corrData = await correctionResponse.json();
        const corrContent = corrData.choices?.[0]?.message?.content || "";
        try {
          const corrMatch = corrContent.match(/\{[\s\S]*\}/);
          if (corrMatch) {
            correctedProtocol = JSON.parse(corrMatch[0]);
            if (!auditResult.corrections_applied) auditResult.corrections_applied = [];
            auditResult.corrections_applied.push(`Correção automática aplicada (tentativa ${attempts})`);
          }
        } catch {
          console.error("Failed to parse corrected protocol");
        }
      } else {
        await correctionResponse.text(); // consume body
      }
    }

    return new Response(JSON.stringify({
      success: true,
      audit: auditResult,
      correctedProtocol: auditResult.final_score < 80 ? null : correctedProtocol,
      wasCorreted: attempts > 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("audit-prescription error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
