import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Given a raw detected_date from OCR, normalize it to fall within the last 10 days.
 * The OCR often returns wrong years (2020, 2024, 2025) because the screenshot
 * only shows day/month or weekday. We fix the year to the current one and
 * verify the date is recent.
 */
function normalizeDate(rawDate: string | null): { date: string | null; ambiguous: boolean } {
  if (!rawDate) return { date: null, ambiguous: false };

  // Parse the raw date
  const parts = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return { date: null, ambiguous: true };

  const [, yearStr, monthStr, dayStr] = parts;
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // Try current year first
  let candidateYear = currentYear;
  let candidate = new Date(candidateYear, month - 1, day);

  // If the candidate is in the future (more than 1 day ahead), try previous year
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  if (candidate > tomorrow) {
    candidateYear = currentYear - 1;
    candidate = new Date(candidateYear, month - 1, day);
  }

  // Check if it's within the last 10 days
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  tenDaysAgo.setHours(0, 0, 0, 0);

  const withinWindow = candidate >= tenDaysAgo && candidate <= tomorrow;

  // Format the normalized date
  const normalizedDate = `${candidateYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // If the original year matched, it's not ambiguous and within window
  const originalYear = parseInt(yearStr, 10);
  const yearWasChanged = originalYear !== candidateYear;

  return {
    date: normalizedDate,
    ambiguous: yearWasChanged || !withinWindow,
  };
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
            content: `You are a fitness data extraction assistant. You analyze screenshots from fitness apps (Apple Fitness, Google Fit, Samsung Health, Garmin, etc.) and extract numeric health metrics visible on screen. Always use the extract_fitness_data tool to return structured data. If a value is not visible in the image, set it to null. For distance, always convert to kilometers.

Also look for cardiovascular metrics:
- Resting heart rate (FC de repouso / Resting HR) in BPM
- Heart rate variability (VFC / HRV) in milliseconds
- Average daily heart rate (BPM médio / Avg HR) in BPM

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
                text: `Analyze this fitness app screenshot. Extract all visible health metrics (steps, active calories, exercise minutes, standing hours, distance in km, resting heart rate, HRV, average heart rate) AND the date shown on screen. Remember: today is ${todayStr}, use year ${currentYear} for any detected dates.`,
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
                  resting_hr: {
                    type: ["number", "null"],
                    description: "Resting heart rate in BPM",
                  },
                  hrv_ms: {
                    type: ["number", "null"],
                    description: "Heart rate variability (HRV) in milliseconds",
                  },
                  avg_hr_bpm: {
                    type: ["number", "null"],
                    description: "Average daily heart rate in BPM",
                  },
                  detected_date: {
                    type: ["string", "null"],
                    description: `Date shown in the screenshot in YYYY-MM-DD format. Use year ${currentYear}. null if not visible.`,
                  },
                },
                required: ["steps", "active_calories", "exercise_minutes", "standing_hours", "distance_km", "resting_hr", "hrv_ms", "avg_hr_bpm", "detected_date"],
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

    // Post-process: normalize the date to prevent wrong years
    const { date: normalizedDate, ambiguous } = normalizeDate(extracted.detected_date);
    extracted.detected_date = normalizedDate;
    extracted.date_ambiguous = ambiguous;

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
