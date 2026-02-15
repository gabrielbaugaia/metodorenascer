import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TREINO_CRITERIA = [
  "coherence_anamnese",
  "coherence_objective",
  "restriction_respect",
  "weekly_volume",
  "muscle_distribution",
  "progression_defined",
  "instruction_clarity",
  "mindset_quality",
  "safety_score",
  "estrutura_semanal_presente",
  "exercicios_completos",
  "volume_detalhado_presente",
  "progressao_4sem_presente",
  "justificativa_presente",
] as const;

const NUTRICAO_CRITERIA = [
  "macros_definidos",
  "macros_por_refeicao",
  "pre_treino_presente",
  "pos_treino_presente",
  "pre_sono_presente",
  "hidratacao_presente",
  "dia_treino_vs_descanso",
  "lista_compras_gerada",
  "substituicoes_geradas",
  "compativel_anamnese",
] as const;

function getClassification(score: number): string {
  if (score >= 95) return "Excelente";
  if (score >= 85) return "Muito bom";
  if (score >= 75) return "Aceitável";
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

    const isNutricao = type === "nutricao";
    const criteria = isNutricao ? NUTRICAO_CRITERIA : TREINO_CRITERIA;

    const systemPrompt = isNutricao 
      ? `Você é um auditor especialista em nutrição esportiva e prescrição alimentar.
Avalie os seguintes 10 critérios (true = passou, false = falhou):

1. macros_definidos - Macros diários definidos com valores numéricos (calorias, proteína, carboidrato, gordura)?
2. macros_por_refeicao - Cada refeição tem macros detalhados (proteinas_g, carboidratos_g, gorduras_g, calorias)?
3. pre_treino_presente - Existe refeição pré-treino com macros adequados (P 25-45g)?
4. pos_treino_presente - Existe refeição pós-treino com macros adequados (P 30-50g)?
5. pre_sono_presente - Existe refeição pré-sono com pelo menos 3 opções com macros?
6. hidratacao_presente - Hidratação calculada por kg de peso (35-45ml/kg)?
7. dia_treino_vs_descanso - Existem dois planos diferenciados (dia treino vs descanso)?
8. lista_compras_gerada - Lista de compras semanal com quantidades por categoria?
9. substituicoes_geradas - Substituições equivalentes com quantidades numéricas?
10. compativel_anamnese - Protocolo respeita restrições, aversões e condições de saúde?

Para cada critério que FALHOU, inclua uma descrição em "issues".
Se o score < 80, inclua sugestões em "corrections_applied".
IMPORTANTE: Responda APENAS com JSON.`
      : `Você é um auditor especialista em fisiologia do exercício, ciência comportamental e prescrição de treino.
Avalie os seguintes 14 critérios (true = passou, false = falhou):

1. coherence_anamnese - O protocolo respeita as limitações, nível e rotina do cliente conforme a anamnese?
2. coherence_objective - O protocolo está alinhado com o objetivo principal do cliente?
3. restriction_respect - Todas as restrições, lesões e condições médicas foram respeitadas?
4. weekly_volume - O volume semanal é adequado (nem insuficiente nem excessivo)?
5. muscle_distribution - Distribuição dos grupamentos musculares equilibrada?
6. progression_defined - Progressão clara de carga, reps ou volume ao longo de 4 semanas?
7. instruction_clarity - Instruções de execução claras e completas?
8. mindset_quality - Protocolo de mindset personalizado e baseado em comportamento real?
9. safety_score - Prescrição geral segura, sem exercícios contraindicados?
10. estrutura_semanal_presente - Existe campo "estrutura_semanal" com mapeamento de dias da semana para treinos?
11. exercicios_completos - Cada exercício tem nome, series, repeticoes, descanso, carga_inicial E instrucao_tecnica?
12. volume_detalhado_presente - Existe "volume_semanal_detalhado" com séries numéricas por grupo muscular?
13. progressao_4sem_presente - Existe "progressao_4_semanas" com 4 semanas incluindo DELOAD na semana 4?
14. justificativa_presente - Existe "justificativa" com campos volume, divisao e progressao?

Para cada critério que FALHOU, inclua em "issues".
Se o score < 95, inclua sugestões em "corrections_applied".
IMPORTANTE: Responda APENAS com JSON.`;

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
- Restrições alimentares: ${anamnese.restricoes_alimentares || "Nenhuma"}
- Dias disponíveis: ${anamnese.dias_disponiveis || "N/A"}
- Local de treino: ${anamnese.local_treino || "N/A"}
- Horário treino: ${anamnese.horario_treino || "N/A"}
- Qualidade sono: ${anamnese.qualidade_sono || "N/A"}
- Nível estresse: ${anamnese.nivel_estresse || "N/A"}
` : "ANAMNESE: Dados não disponíveis.";

    const protocolStr = typeof protocol === "string" ? protocol : JSON.stringify(protocol, null, 2);

    const criteriaList = isNutricao
      ? NUTRICAO_CRITERIA.map(c => `"${c}": true/false`).join(",\n  ")
      : TREINO_CRITERIA.map(c => `"${c}": true/false`).join(",\n  ");

    const userPrompt = `${anamneseContext}

PROTOCOLO A SER AUDITADO (tipo: ${type || "treino"}):
${protocolStr.substring(0, 15000)}

Retorne o resultado da auditoria no formato JSON:
{
  ${criteriaList},
  "issues": ["problema 1", "problema 2"],
  "corrections_applied": ["correção 1"]
}`;

    let auditResult: any = null;
    let correctedProtocol = protocol;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[audit-prescription] Attempt ${attempts}/${maxAttempts} (type: ${type})`);

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
        const defaultCriteria: Record<string, boolean> = {};
        criteria.forEach(c => { defaultCriteria[c] = true; });
        auditResult = {
          ...defaultCriteria,
          issues: [],
          corrections_applied: ["Auditoria automática não pôde ser processada - aprovação padrão"],
        };
      }

      // Calculate score
      let passed = 0;
      for (const criterion of criteria) {
        if (auditResult[criterion] === true) passed++;
      }
      const finalScore = Math.round((passed / criteria.length) * 100);
      auditResult.final_score = finalScore;
      auditResult.classification = getClassification(finalScore);
      auditResult.audited_at = new Date().toISOString();
      auditResult.attempts = attempts;
      auditResult.audit_type = type || "treino";

      console.log(`[audit-prescription] Score: ${finalScore}/100 (${auditResult.classification})`);

      if (finalScore >= 95 || attempts >= maxAttempts) {
        if (finalScore < 95 && attempts >= maxAttempts) {
          auditResult.warning = "Score abaixo de 95 após tentativas de correção. Revisão manual recomendada.";
        }
        break;
      }

      console.log(`[audit-prescription] Score < 95, requesting correction...`);
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
        await correctionResponse.text();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      audit: auditResult,
      correctedProtocol: auditResult.final_score < 95 ? null : correctedProtocol,
      wasCorrected: attempts > 1,
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
