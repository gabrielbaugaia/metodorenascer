import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { clientId, type, options } = await req.json();
    if (!clientId || !type) throw new Error("clientId and type required");

    const { data: client } = await supabase
      .from("mqo_clients")
      .select("*")
      .eq("id", clientId)
      .single();
    if (!client) throw new Error("Client not found");

    const frequency = options?.frequency || "3x por semana";
    const intensity = options?.intensity || "moderada";
    const considerFiles = options?.considerFiles ?? true;
    const prioritizeTrainer = options?.prioritizeTrainer ?? true;

    const typeLabels: Record<string, string> = {
      treino: "Protocolo de Treino",
      dieta: "Protocolo Nutricional",
      mentalidade: "Protocolo de Mentalidade",
    };

    const typePrompts: Record<string, string> = {
      treino: `Gere um protocolo de treino completo com:
- Divisão semanal (${frequency})
- Intensidade: ${intensity}
- Para cada dia: nome do treino, exercícios com séries, repetições, carga sugerida, descanso
- Aquecimento e alongamento
Retorne em JSON: { "title": "...", "days": [{ "name": "...", "focus": "...", "exercises": [{ "name": "...", "sets": "...", "reps": "...", "rest": "...", "notes": "..." }] }], "general_notes": "..." }`,

      dieta: `Gere um protocolo nutricional completo com:
- Plano alimentar diário (5-6 refeições)
- Macros estimados por refeição
- Alimentos alternativos
- Suplementação sugerida
Retorne em JSON: { "title": "...", "meals": [{ "name": "...", "time": "...", "foods": [{ "item": "...", "quantity": "...", "alternatives": "..." }], "macros": "..." }], "supplements": [...], "general_notes": "..." }`,

      mentalidade: `Gere um protocolo de mentalidade e mindset com:
- Rotinas diárias (manhã/noite)
- Exercícios de foco e disciplina
- Metas semanais comportamentais
- Técnicas de gestão emocional
Retorne em JSON: { "title": "...", "daily_routines": { "morning": [...], "evening": [...] }, "weekly_goals": [...], "techniques": [...], "general_notes": "..." }`,
    };

    let systemPrompt = `Você é um prescritor esportivo profissional de alto nível. Gere protocolos técnicos, detalhados e personalizados. Responda SEMPRE em JSON válido, em português.`;

    if (prioritizeTrainer && client.trainer_direction) {
      systemPrompt += `\n\n### INSTRUÇÃO PRIORITÁRIA DO TREINADOR ###\n${client.trainer_direction}\n### FIM DA INSTRUÇÃO PRIORITÁRIA ###\nEsta instrução tem prioridade MÁXIMA sobre qualquer inferência automática.`;
    }

    const contextParts = [
      `CLIENTE: ${client.name}`,
      client.summary ? `RESUMO: ${client.summary}` : "",
      client.objectives ? `OBJETIVOS: ${client.objectives}` : "",
      client.strengths ? `PONTOS FORTES: ${client.strengths}` : "",
      client.attention_points ? `PONTOS DE ATENÇÃO: ${client.attention_points}` : "",
      client.suggested_strategy ? `ESTRATÉGIA: ${client.suggested_strategy}` : "",
    ].filter(Boolean).join("\n");

    const userPrompt = `${contextParts}\n\n${typePrompts[type] || typePrompts.treino}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let protocolContent;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      protocolContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: rawContent };
    } catch {
      protocolContent = { raw: rawContent };
    }

    const title = protocolContent.title || `${typeLabels[type]} - ${client.name}`;

    // Save protocol
    const { data: protocol, error: insertError } = await supabase
      .from("mqo_protocols")
      .insert({
        client_id: clientId,
        type,
        title,
        content: protocolContent,
        status: "rascunho",
        generation_options: { frequency, intensity, considerFiles, prioritizeTrainer },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Save initial version
    await supabase.from("mqo_protocol_versions").insert({
      protocol_id: protocol.id,
      version_number: 1,
      content: protocolContent,
      status: "rascunho",
    });

    return new Response(JSON.stringify({ success: true, protocol }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mqo-generate-protocol error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
