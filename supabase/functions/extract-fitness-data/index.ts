import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { image_base64 } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate size (~5MB base64)
    if (image_base64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Strip data URI prefix if present
    const base64Clean = image_base64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You are a fitness data extraction assistant. You analyze screenshots from fitness apps (Apple Fitness, Google Fit, Samsung Health, Garmin, etc.) and extract numeric health metrics visible on screen. Always use the extract_fitness_data tool to return structured data. If a value is not visible in the image, set it to null. For distance, always convert to kilometers. Also extract the date shown in the screenshot if visible (e.g. 'Thursday', 'Feb 26', '26/02/2025') and convert it to YYYY-MM-DD format. If the date shows only a weekday name, calculate the most recent past occurrence of that weekday. If no date is visible, set detected_date to null.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this fitness app screenshot. Extract all visible health metrics (steps, active calories, exercise minutes, standing hours, distance in km) AND the date shown on screen.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Clean}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_fitness_data",
              description: "Extract fitness metrics and date from a screenshot",
              parameters: {
                type: "object",
                properties: {
                  steps: {
                    type: ["number", "null"],
                    description: "Number of steps walked",
                  },
                  active_calories: {
                    type: ["number", "null"],
                    description: "Active calories burned (not total/resting)",
                  },
                  exercise_minutes: {
                    type: ["number", "null"],
                    description: "Minutes of exercise/activity",
                  },
                  standing_hours: {
                    type: ["number", "null"],
                    description: "Hours standing / move hours",
                  },
                  distance_km: {
                    type: ["number", "null"],
                    description: "Distance in kilometers",
                  },
                  detected_date: {
                    type: ["string", "null"],
                    description: "Date shown in the screenshot in YYYY-MM-DD format. null if not visible.",
                  },
                },
                required: ["steps", "active_calories", "exercise_minutes", "standing_hours", "distance_km", "detected_date"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_fitness_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao analisar imagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Não foi possível ler os dados da imagem" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-fitness-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
