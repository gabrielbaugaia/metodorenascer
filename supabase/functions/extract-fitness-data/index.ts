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
  const normalizedDate = `${candidateYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const originalYear = parseInt(yearStr, 10);
  const yearWasChanged = originalYear !== candidateYear;
  return { date: normalizedDate, ambiguous: yearWasChanged };
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
            content: `You are a fitness data extraction assistant. You analyze screenshots from fitness apps (Apple Fitness, Google Fit, Samsung Health, Garmin, Athlytic, AutoSleep, Heart Analyzer, HeartWatch, Whoop, Oura, etc.) and extract numeric health metrics visible on screen.

IMPORTANT: You must determine if the screenshot shows:
1. A SINGLE DAY view — showing metrics for one specific day
2. A PERIOD/TREND view — showing a chart/calendar with data for MULTIPLE days (e.g., HeartWatch HRV trend over 21 days)

CARDIOVASCULAR METRICS — Map these labels to the correct fields:
- resting_hr: "FC de repouso", "Resting HR", "BPM ao despertar", "BPM ao acordar", "Waking HR", "Waking BPM", "FC ao acordar", "Resting Heart Rate"
- hrv_ms: "VFC", "HRV", "VFC ao despertar", "VFC ao acordar", "Waking HRV", "Heart Rate Variability", "Variabilidade"
- avg_hr_bpm: "BPM diário", "BPM médio", "Avg HR", "Daily HR", "Average Heart Rate", "FC média", "Média BPM"
- sleeping_hr: "BPM ao dormir", "Sleeping HR", "Sleep HR", "FC ao dormir", "FC durante sono", "Sleeping Heart Rate", "BPM sleeping"
- sleeping_hrv: "VFC ao dormir", "Sleeping HRV", "Sleep HRV", "VFC durante sono", "HRV ao dormir"
- min_hr: "BPM mínima", "Min HR", "Min BPM", "Minimum Heart Rate", "FC mínima", "MinMax" (use the lower value)
- max_hr: "BPM máxima", "Max HR", "Max BPM", "Maximum Heart Rate", "FC máxima", "MinMax" (use the higher value)
- sedentary_hr: "BPM sedentária", "Sedentary HR", "Sedentary BPM", "FC sedentária", "Resting/Sedentary"

HeartWatch specific mappings:
- "BPM ao despertar" → resting_hr
- "VFC ao despertar" → hrv_ms
- "BPM diário" → avg_hr_bpm
- "BPM ao dormir" → sleeping_hr
- "VFC ao dormir" → sleeping_hrv
- "MinMax bpm" → min_hr and max_hr
- "BPM sedentária" → sedentary_hr

CRITICAL RULES FOR PERIOD/TREND SCREENSHOTS:
- If the image shows a chart, calendar or grid with values for MULTIPLE DAYS (e.g., a bar chart with daily HRV values, a calendar with daily readings), you MUST use the extract_multi_day_data tool.
- Extract EACH individual day's value separately into the days array.
- The period average/summary shown (e.g., "Média 31", "Average 65 bpm") goes into summary_average — NEVER into a daily value.
- Read dates from month labels, day numbers, and axis labels. Use year ${currentYear} unless clearly from a previous year.
- If you see "11 / 137" or "X / Y" format, it typically means current_value / range or score — extract the individual daily values from the chart/calendar, not these summary numbers.
- Common period headers: "23 de fev. - 5 de abr.", "Últimos 21 dias", "Last 30 days" — use these to determine the date range.

CRITICAL RULES FOR SINGLE DAY SCREENSHOTS:
- Use the extract_fitness_data tool for single-day views.
- Today's date is ${todayStr}. The current year is ${currentYear}.
- If no year visible, use ${currentYear}. If date would be future, use ${currentYear - 1}.
- If no date visible, set detected_date to null.

Do NOT leave cardiovascular fields null if they are visible in the image.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this fitness app screenshot. Determine if it shows a SINGLE DAY or a PERIOD/TREND with multiple days.

If SINGLE DAY: use extract_fitness_data to return all visible metrics.
If PERIOD/TREND (chart/calendar with multiple days): use extract_multi_day_data to return individual daily values and the period summary.

Look for: steps, active calories, exercise minutes, standing hours, distance km, resting HR, HRV, avg HR, sleeping HR, sleeping HRV, min/max HR, sedentary HR.

Today is ${todayStr}, year ${currentYear}.`,
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
              description: "Extract fitness metrics from a SINGLE DAY screenshot",
              parameters: {
                type: "object",
                properties: {
                  steps: { type: ["number", "null"], description: "Number of steps walked" },
                  active_calories: { type: ["number", "null"], description: "Active calories burned" },
                  exercise_minutes: { type: ["number", "null"], description: "Minutes of exercise" },
                  standing_hours: { type: ["number", "null"], description: "Hours standing" },
                  distance_km: { type: ["number", "null"], description: "Distance in km" },
                  resting_hr: { type: ["number", "null"], description: "Resting/waking heart rate bpm" },
                  hrv_ms: { type: ["number", "null"], description: "Waking HRV in ms" },
                  avg_hr_bpm: { type: ["number", "null"], description: "Average daily heart rate bpm" },
                  sleeping_hr: { type: ["number", "null"], description: "Sleeping heart rate bpm" },
                  sleeping_hrv: { type: ["number", "null"], description: "Sleeping HRV in ms" },
                  min_hr: { type: ["number", "null"], description: "Minimum heart rate bpm" },
                  max_hr: { type: ["number", "null"], description: "Maximum heart rate bpm" },
                  sedentary_hr: { type: ["number", "null"], description: "Sedentary heart rate bpm" },
                  detected_date: {
                    type: ["string", "null"],
                    description: `Date in YYYY-MM-DD format. Use year ${currentYear}. null if not visible.`,
                  },
                },
                required: ["steps", "active_calories", "exercise_minutes", "standing_hours", "distance_km", "resting_hr", "hrv_ms", "avg_hr_bpm", "sleeping_hr", "sleeping_hrv", "min_hr", "max_hr", "sedentary_hr", "detected_date"],
                additionalProperties: false,
              },
            },
          },
          {
            type: "function",
            function: {
              name: "extract_multi_day_data",
              description: "Extract data from a PERIOD/TREND screenshot showing multiple days (e.g., HeartWatch HRV chart, weekly calendar). Each visible daily value should be a separate entry in the days array.",
              parameters: {
                type: "object",
                properties: {
                  metric_type: {
                    type: "string",
                    enum: ["hrv_ms", "resting_hr", "avg_hr_bpm", "sleeping_hr", "sleeping_hrv", "min_hr", "max_hr", "sedentary_hr", "steps", "active_calories", "sleep_minutes", "exercise_minutes"],
                    description: "Which metric this period chart is showing",
                  },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "Date in YYYY-MM-DD format" },
                        value: { type: "number", description: "The metric value for this specific day" },
                      },
                      required: ["date", "value"],
                    },
                    description: "Individual daily values visible in the chart/calendar. Extract each day separately.",
                  },
                  summary_average: {
                    type: ["number", "null"],
                    description: "The period average shown (e.g., 'Média 31'). This is NOT a daily value.",
                  },
                  summary_period_days: {
                    type: ["number", "null"],
                    description: "Number of days in the period (e.g., 21 for '21 dias')",
                  },
                  range_start: {
                    type: ["string", "null"],
                    description: "Start date of the period in YYYY-MM-DD format",
                  },
                  range_end: {
                    type: ["string", "null"],
                    description: "End date of the period in YYYY-MM-DD format",
                  },
                },
                required: ["metric_type", "days"],
                additionalProperties: false,
              },
            },
          },
        ],
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

    const fnName = toolCall.function.name;
    const extracted = JSON.parse(toolCall.function.arguments);

    if (fnName === "extract_multi_day_data") {
      // Multi-day response: normalize dates in days array
      const normalizedDays = (extracted.days || []).map((d: { date: string; value: number }) => {
        const { date, ambiguous } = normalizeDate(d.date);
        return { date: date || d.date, value: d.value, date_ambiguous: ambiguous };
      });

      // Also normalize range dates
      const rangeStart = extracted.range_start ? normalizeDate(extracted.range_start).date : null;
      const rangeEnd = extracted.range_end ? normalizeDate(extracted.range_end).date : null;

      return new Response(JSON.stringify({
        mode: "multi_day",
        metric_type: extracted.metric_type,
        days: normalizedDays,
        summary_average: extracted.summary_average ?? null,
        summary_period_days: extracted.summary_period_days ?? null,
        range_start: rangeStart,
        range_end: rangeEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single day response (original behavior)
    const { date: normalizedDate, ambiguous } = normalizeDate(extracted.detected_date);
    extracted.detected_date = normalizedDate;
    extracted.date_ambiguous = ambiguous;
    extracted.mode = "single_day";

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
