import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
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
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { date, daily, workouts } = body;

    if (!date || typeof date !== "string") {
      return new Response(
        JSON.stringify({ error: "date is required (YYYY-MM-DD)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let dailyUpserted = false;

    // Upsert daily data
    if (daily && typeof daily === "object") {
      const { error } = await supabase.from("health_daily").upsert(
        {
          user_id: userId,
          date,
          steps: daily.steps ?? 0,
          active_calories: daily.active_calories ?? 0,
          sleep_minutes: daily.sleep_minutes ?? 0,
          resting_hr: daily.resting_hr ?? null,
          hrv_ms: daily.hrv_ms ?? null,
          source: daily.source ?? "unknown",
        },
        { onConflict: "user_id,date" }
      );
      if (error) throw error;
      dailyUpserted = true;
    }

    // Insert workouts with dedup via external_id
    let workoutsInserted = 0;
    if (Array.isArray(workouts) && workouts.length > 0) {
      const newRows = [];

      for (const w of workouts) {
        const externalId = w.external_id || null;

        // Dedup: if external_id exists, check if already inserted
        if (externalId) {
          const { count } = await supabase
            .from("health_workouts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("external_id", externalId);

          if (count && count > 0) {
            continue; // already exists, skip
          }
        }

        newRows.push({
          user_id: userId,
          start_time: w.start_time,
          end_time: w.end_time,
          type: w.type,
          calories: w.calories ?? null,
          source: w.source ?? "unknown",
          external_id: externalId,
        });
      }

      if (newRows.length > 0) {
        const { data: inserted, error } = await supabase
          .from("health_workouts")
          .insert(newRows)
          .select("id");
        if (error) throw error;
        workoutsInserted = inserted?.length ?? 0;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        daily_upserted: dailyUpserted,
        workouts_inserted: workoutsInserted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
