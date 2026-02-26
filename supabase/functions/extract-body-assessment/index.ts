import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, client_id } = await req.json();
    if (!url || !client_id) {
      return new Response(JSON.stringify({ error: "url and client_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Scrape URL using Firecrawl
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scraping body assessment URL:", url);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error("Firecrawl error:", scrapeResponse.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao acessar o link da avaliação" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";

    if (!markdown || markdown.length < 50) {
      return new Response(JSON.stringify({ error: "Conteúdo insuficiente extraído do link" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Use AI to extract structured data
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
          {
            role: "system",
            content:
              "You are a body composition data extraction assistant. You analyze text from body composition reports (Anovator, InBody, Tanita, etc.) and extract all available metrics. Always use the extract_body_assessment tool to return structured data. If a value is not found, set it to null. Use metric units (cm, kg). For percentages, return the number without the % sign.",
          },
          {
            role: "user",
            content: `Extract all body composition and anthropometric data from this report:\n\n${markdown.substring(0, 8000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_body_assessment",
              description: "Extract body composition metrics from a report",
              parameters: {
                type: "object",
                properties: {
                  weight: { type: ["number", "null"], description: "Weight in kg" },
                  height: { type: ["number", "null"], description: "Height in cm" },
                  bmi: { type: ["number", "null"], description: "BMI value" },
                  body_fat_pct: { type: ["number", "null"], description: "Body fat percentage" },
                  muscle_pct: { type: ["number", "null"], description: "Muscle percentage" },
                  subcutaneous_fat_pct: { type: ["number", "null"], description: "Subcutaneous fat percentage" },
                  visceral_fat: { type: ["number", "null"], description: "Visceral fat level" },
                  protein_pct: { type: ["number", "null"], description: "Protein percentage" },
                  hydration_pct: { type: ["number", "null"], description: "Hydration/water percentage" },
                  bone_mass_kg: { type: ["number", "null"], description: "Bone mass in kg" },
                  bmr_kcal: { type: ["number", "null"], description: "Basal metabolic rate in kcal" },
                  waist_hip_ratio: { type: ["number", "null"], description: "Waist-hip ratio" },
                  body_age: { type: ["number", "null"], description: "Metabolic/body age" },
                  fat_mass_kg: { type: ["number", "null"], description: "Fat mass in kg" },
                  muscle_mass_kg: { type: ["number", "null"], description: "Muscle mass in kg" },
                  waist_cm: { type: ["number", "null"], description: "Waist circumference in cm" },
                  hip_cm: { type: ["number", "null"], description: "Hip circumference in cm" },
                  arm_circumference_cm: { type: ["number", "null"], description: "Arm circumference in cm" },
                  thigh_circumference_cm: { type: ["number", "null"], description: "Thigh circumference in cm" },
                  shoulder_width_cm: { type: ["number", "null"], description: "Shoulder width in cm" },
                  trunk_length_cm: { type: ["number", "null"], description: "Trunk/upper body length in cm" },
                  leg_length_cm: { type: ["number", "null"], description: "Leg length in cm" },
                  wingspan_cm: { type: ["number", "null"], description: "Arm wingspan in cm" },
                  body_type: { type: ["string", "null"], description: "Body type classification" },
                  segment_analysis: {
                    type: ["object", "null"],
                    description: "Muscle and fat per body segment (arms, legs, trunk)",
                  },
                  postural_analysis: {
                    type: ["object", "null"],
                    description: "Postural risk assessments (scoliosis, kyphosis, etc.)",
                  },
                  exercise_suggestions: {
                    type: ["object", "null"],
                    description: "Exercise plan suggestions from the report",
                  },
                  diet_suggestions: {
                    type: ["object", "null"],
                    description: "Diet/nutrition suggestions from the report",
                  },
                  assessed_at: {
                    type: ["string", "null"],
                    description: "Assessment date in ISO format if found",
                  },
                },
                required: ["weight", "height", "bmi", "body_fat_pct", "muscle_pct"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_body_assessment" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao analisar dados da avaliação" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "Não foi possível extrair os dados da avaliação" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Step 3: Save to database using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const assessmentRow = {
      user_id: client_id,
      source_url: url,
      source_name: "anovator",
      assessed_at: extracted.assessed_at || new Date().toISOString(),
      weight: extracted.weight,
      height: extracted.height,
      bmi: extracted.bmi,
      body_fat_pct: extracted.body_fat_pct,
      muscle_pct: extracted.muscle_pct,
      subcutaneous_fat_pct: extracted.subcutaneous_fat_pct,
      visceral_fat: extracted.visceral_fat,
      protein_pct: extracted.protein_pct,
      hydration_pct: extracted.hydration_pct,
      bone_mass_kg: extracted.bone_mass_kg,
      bmr_kcal: extracted.bmr_kcal,
      waist_hip_ratio: extracted.waist_hip_ratio,
      body_age: extracted.body_age,
      fat_mass_kg: extracted.fat_mass_kg,
      muscle_mass_kg: extracted.muscle_mass_kg,
      waist_cm: extracted.waist_cm,
      hip_cm: extracted.hip_cm,
      arm_circumference_cm: extracted.arm_circumference_cm,
      thigh_circumference_cm: extracted.thigh_circumference_cm,
      shoulder_width_cm: extracted.shoulder_width_cm,
      trunk_length_cm: extracted.trunk_length_cm,
      leg_length_cm: extracted.leg_length_cm,
      wingspan_cm: extracted.wingspan_cm,
      body_type: extracted.body_type,
      segment_analysis: extracted.segment_analysis,
      postural_analysis: extracted.postural_analysis,
      exercise_suggestions: extracted.exercise_suggestions,
      diet_suggestions: extracted.diet_suggestions,
      raw_data: extracted,
    };

    const { data: savedAssessment, error: insertError } = await supabaseAdmin
      .from("body_assessments")
      .insert(assessmentRow)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Erro ao salvar avaliação" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Also update the client profile with latest weight/height if available
    const profileUpdate: Record<string, any> = {};
    if (extracted.weight) profileUpdate.weight = extracted.weight;
    if (extracted.height) profileUpdate.height = extracted.height;
    
    // Update medidas with body composition data
    const medidas: Record<string, any> = {};
    if (extracted.waist_cm) medidas.cintura = extracted.waist_cm;
    if (extracted.hip_cm) medidas.quadril = extracted.hip_cm;
    if (extracted.arm_circumference_cm) medidas.braco = extracted.arm_circumference_cm;
    if (extracted.thigh_circumference_cm) medidas.coxa = extracted.thigh_circumference_cm;
    if (extracted.shoulder_width_cm) medidas.ombros = extracted.shoulder_width_cm;
    if (Object.keys(medidas).length > 0) profileUpdate.medidas = medidas;

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", client_id);
    }

    return new Response(JSON.stringify({ success: true, assessment: savedAssessment, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-body-assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
