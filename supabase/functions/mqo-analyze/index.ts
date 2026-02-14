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

    // Verify admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { clientId, materialIds } = await req.json();
    if (!clientId) throw new Error("clientId is required");

    // Fetch client data
    const { data: client } = await supabase
      .from("mqo_clients")
      .select("*")
      .eq("id", clientId)
      .single();

    // Fetch materials
    let materialsInfo = "";
    if (materialIds?.length) {
      const { data: materials } = await supabase
        .from("mqo_materials")
        .select("*")
        .in("id", materialIds);
      
      if (materials?.length) {
        materialsInfo = materials.map(m => `- ${m.file_name} (${m.file_type})`).join("\n");
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Você é um analista de prescrição esportiva profissional. Analise os dados do cliente abaixo e gere uma avaliação técnica completa.

DADOS DO CLIENTE:
Nome: ${client?.name || "Não informado"}
${client?.trainer_direction ? `Direcionamento do treinador: ${client.trainer_direction}` : ""}

${materialsInfo ? `MATERIAIS ENVIADOS:\n${materialsInfo}` : "Nenhum material enviado ainda."}

Gere a análise nos seguintes campos (em português):
1. Resumo do cliente
2. Objetivos detectados
3. Pontos fortes
4. Pontos de atenção
5. Estratégia sugerida

Responda APENAS em JSON com estas chaves exatas:
{
  "summary": "...",
  "objectives": "...",
  "strengths": "...",
  "attention_points": "...",
  "suggested_strategy": "..."
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em prescrição de treinos e nutrição esportiva. Responda sempre em JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
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
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content };
    } catch {
      analysis = { summary: content };
    }

    // Update client with analysis
    await supabase
      .from("mqo_clients")
      .update({
        summary: analysis.summary || null,
        objectives: analysis.objectives || null,
        strengths: analysis.strengths || null,
        attention_points: analysis.attention_points || null,
        suggested_strategy: analysis.suggested_strategy || null,
      })
      .eq("id", clientId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mqo-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
