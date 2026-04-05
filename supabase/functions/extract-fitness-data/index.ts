import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeDate(rawDate: string | null): { date: string | null; ambiguous: boolean } {
  if (!rawDate) return { date: null, ambiguous: false };
  const parts = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return { date: null, ambiguous: true };
  const [, yearStr, monthStr, dayStr] = parts;
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  let candidateYear = currentYear;
  let candidate = new Date(candidateYear, month - 1, day);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  if (candidate > tomorrow) {
    candidateYear = currentYear - 1;
    candidate = new Date(candidateYear, month - 1, day);
  }
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  tenDaysAgo.setHours(0, 0, 0, 0);
  const withinWindow = candidate >= tenDaysAgo && candidate <= tomorrow;
  const normalizedDate = `${candidateYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const originalYear = parseInt(yearStr, 10);
  const yearWasChanged = originalYear !== candidateYear;
  return { date: normalizedDate, ambiguous: yearWasChanged || !withinWindow };
}

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

    if (image_base64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const base64Clean = image_base64.replace(/^data:image\/[a-z]+;base64,/, "");
    const currentYear = new Date().getFullYear();
    const todayStr = new Date().toISOString().split("T")[0];

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
            content: `You are a fitness data extraction assistant. You analyze screenshots from fitness apps (Apple Fitness, Google Fit, Samsung Health, Garmin, Athlytic, AutoSleep, Heart Analyzer, HeartWatch, Whoop, Oura, etc.) and extract numeric health metrics visible on screen. Always use the extract_fitness_data tool to return structured data. If a value is not visible in the image, set it to null. For distance, always convert to kilometers.

CARDIOVASCULAR METRICS — Map these labels to the correct fields:
- resting_hr: "FC de repouso", "Resting HR", "BPM ao despertar", "BPM ao acordar", "Waking HR", "Waking BPM", "FC ao acordar", "Resting Heart Rate"
- hrv_ms: "VFC", "HRV", "VFC ao despertar", "VFC ao acordar", "Waking HRV", "Heart Rate Variability", "Variabilidade"
- avg_hr_bpm: "BPM diário", "BPM médio", "Avg HR", "Daily HR", "Average Heart Rate", "FC média", "Média BPM"
- sleeping_hr: "BPM ao dormir", "Sleeping HR", "Sleep HR", "FC ao dormir", "FC durante sono", "Sleeping Heart Rate", "BPM sleeping"
- sleeping_hrv: "VFC ao dormir", "Sleeping HRV", "Sleep HRV", "VFC durante sono", "HRV ao dormir"
- min_hr: "BPM mínima", "Min HR", "Min BPM", "Minimum Heart Rate", "FC mínima", "MinMax" (use the lower value)
- max_hr: "BPM máxima", "Max HR", "Max BPM", "Maximum Heart Rate", "FC máxima", "MinMax" (use the higher value)
- sedentary_hr: "BPM sedentária", "Sedentary HR", "Sedentary BPM", "FC sedentária", "Resting/Sedentary"

IMPORTANT: Many wellness apps (HeartWatch, Athlytic, AutoSleep, Heart Analyzer) use different names for the same metrics. In HeartWatch specifically:
- "BPM ao despertar" is the waking/resting heart rate → map to resting_hr
- "VFC ao despertar" is waking HRV → map to hrv_ms
- "BPM diário" is the daily average → map to avg_hr_bpm
- "BPM ao dormir" is sleeping HR → map to sleeping_hr
- "VFC ao dormir" is sleeping HRV → map to sleeping_hrv
- "MinMax bpm" shows min and max → map to min_hr and max_hr respectively
- "BPM sedentária" is sedentary HR → map to sedentary_hr

Do NOT leave these null if they are visible in the image. Ignore wellness/readiness/recovery scores that are not one of the supported numeric health fields.

CRITICAL DATE RULES:
- Today's date is ${todayStr}. The current year is ${currentYear}.
- The user is uploading screenshots from THE LAST 7 DAYS. All dates MUST be within the last 10 days.
- If the screenshot shows a date like "Thursday" or "Thu", calculate the most recent past Thursday relative to today (${todayStr}).
- If the screenshot shows "Mar 13" or "13/03" without a year, ALWAYS use the current year ${currentYear}.
- NEVER return years like 2020, 2024, or 2025 unless it is actually that year. The current year is ${currentYear}.
- If no date is visible at all, set detected_date to null.
- The returned date MUST be in YYYY-MM-DD format using year ${currentYear} unless the date is clearly from a previous month that would make it future (in which case use ${currentYear - 1}).`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this fitness app screenshot. Extract ALL visible health metrics including: steps, active calories, exercise minutes, standing hours, distance in km, resting heart rate ("BPM ao despertar"/"Waking HR"), HRV ("VFC ao despertar"), average daily heart rate ("BPM diário"), sleeping heart rate ("BPM ao dormir"), sleeping HRV ("VFC ao dormir"), min/max heart rate ("MinMax bpm"), and sedentary heart rate ("BPM sedentária"). Also extract the date shown on screen. Remember: today is ${todayStr}, use year ${currentYear} for any detected dates. Pay special attention to cardiovascular data from wellness apps like HeartWatch, Athlytic, AutoSleep, and Heart Analyzer.`,
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
                  steps: { type: ["number", "null"], description: "Number of steps walked" },
                  active_calories: { type: ["number", "null"], description: "Active calories burned (not total/resting)" },
                  exercise_minutes: { type: ["number", "null"], description: "Minutes of exercise/activity" },
                  standing_hours: { type: ["number", "null"], description: "Hours standing / move hours" },
                  distance_km: { type: ["number", "null"], description: "Distance in kilometers" },
                  resting_hr: { type: ["number", "null"], description: "Resting/waking heart rate in BPM" },
                  hrv_ms: { type: ["number", "null"], description: "Waking heart rate variability (HRV) in ms" },
                  avg_hr_bpm: { type: ["number", "null"], description: "Average daily heart rate in BPM" },
                  sleeping_hr: { type: ["number", "null"], description: "Sleeping heart rate in BPM" },
                  sleeping_hrv: { type: ["number", "null"], description: "Sleeping HRV in ms" },
                  min_hr: { type: ["number", "null"], description: "Minimum heart rate of the day in BPM" },
                  max_hr: { type: ["number", "null"], description: "Maximum heart rate of the day in BPM" },
                  sedentary_hr: { type: ["number", "null"], description: "Sedentary heart rate in BPM" },
                  detected_date: {
                    type: ["string", "null"],
                    description: `Date shown in the screenshot in YYYY-MM-DD format. Use year ${currentYear}. null if not visible.`,
                  },
                },
                required: ["steps", "active_calories", "exercise_minutes", "standing_hours", "distance_km", "resting_hr", "hrv_ms", "avg_hr_bpm", "sleeping_hr", "sleeping_hrv", "min_hr", "max_hr", "sedentary_hr", "detected_date"],
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao analisar imagem" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Não foi possível ler os dados da imagem" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    const { date: normalizedDate, ambiguous } = normalizeDate(extracted.detected_date);
    extracted.detected_date = normalizedDate;
    extracted.date_ambiguous = ambiguous;

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-fitness-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
