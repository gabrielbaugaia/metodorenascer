import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

interface BehaviorMetrics {
  app_opens_14d: number;
  workouts_14d: number;
  sleep_logs_14d: number;
  mental_checkins_14d: number;
  body_logs_14d: number;
  streak_current: number;
  streak_best: number;
  active_days_14d: number;
}

function classifyProfile(m: BehaviorMetrics): { type: string; confidence: number } {
  const workoutsPerWeek = m.workouts_14d / 2;
  const appOpensPerWeek = m.app_opens_14d / 2;

  // Consistent: workouts >= 4/week
  if (workoutsPerWeek >= 4) {
    const confidence = Math.min(100, 60 + workoutsPerWeek * 5);
    return { type: "consistent", confidence };
  }

  // Explorer: high app usage, low workouts
  if (appOpensPerWeek > 5 && workoutsPerWeek < 2) {
    const confidence = Math.min(100, 50 + appOpensPerWeek * 3);
    return { type: "explorer", confidence };
  }

  // Resistant: low activity overall, few active days
  if (m.active_days_14d < 4 && workoutsPerWeek < 1) {
    return { type: "resistant", confidence: 60 };
  }

  // Executor: default fallback (2-3 workouts/week, steady usage)
  return { type: "executor", confidence: 50 + workoutsPerWeek * 10 };
}

function checkChallengeMilestones(streak: number): string[] {
  const milestones: string[] = [];
  if (streak >= 7) milestones.push("streak_10");
  if (streak >= 14) milestones.push("streak_21");
  if (streak >= 30) milestones.push("streak_30");
  return milestones;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return createErrorResponse(req, "Não autorizado", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await createClient(supabaseUrl, anonKey).auth.getUser(token);
    if (authErr || !user) return createErrorResponse(req, "Não autorizado", 401);

    const userId = user.id;
    const now = new Date();
    const d14ago = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    // Fetch data in parallel
    const [eventsRes, workoutsRes, dayLogsRes, cogRes, streakRes] = await Promise.all([
      supabase.from("events")
        .select("event_name, created_at")
        .eq("user_id", userId)
        .gte("created_at", d14ago + "T00:00:00Z")
        .in("event_name", ["app_open", "workout_completed", "mental_checkin", "body_log", "sleep_log", "reflection_completed"]),
      supabase.from("workout_completions")
        .select("workout_date")
        .eq("user_id", userId)
        .gte("workout_date", d14ago),
      supabase.from("manual_day_logs")
        .select("date, sleep_hours, energy_focus")
        .eq("user_id", userId)
        .gte("date", d14ago),
      supabase.from("sis_cognitive_checkins")
        .select("date")
        .eq("user_id", userId)
        .gte("date", d14ago),
      supabase.from("sis_streaks")
        .select("current_streak, best_streak")
        .eq("user_id", userId)
        .single(),
    ]);

    const events = eventsRes.data || [];
    const workouts = workoutsRes.data || [];
    const dayLogs = dayLogsRes.data || [];
    const cogCheckins = cogRes.data || [];
    const streak = streakRes.data;

    // Compute metrics
    const appOpens = events.filter(e => e.event_name === "app_open").length;
    const sleepLogs = dayLogs.filter(l => l.sleep_hours != null).length;
    const mentalCheckins = cogCheckins.length;
    const bodyLogs = events.filter(e => e.event_name === "body_log").length;

    // Active days = unique days with any activity
    const activeDays = new Set<string>();
    for (const e of events) activeDays.add(e.created_at?.split("T")[0]);
    for (const w of workouts) activeDays.add(w.workout_date);
    for (const l of dayLogs) activeDays.add(l.date);
    for (const c of cogCheckins) activeDays.add(c.date);

    const metrics: BehaviorMetrics = {
      app_opens_14d: appOpens,
      workouts_14d: workouts.length,
      sleep_logs_14d: sleepLogs,
      mental_checkins_14d: mentalCheckins,
      body_logs_14d: bodyLogs,
      streak_current: streak?.current_streak ?? 0,
      streak_best: streak?.best_streak ?? 0,
      active_days_14d: activeDays.size,
    };

    const { type, confidence } = classifyProfile(metrics);

    // Upsert behavior profile
    await supabase.from("behavior_profiles").upsert({
      user_id: userId,
      profile_type: type,
      confidence_score: Math.round(confidence),
      metrics_snapshot: metrics,
      computed_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Check challenge milestones
    const challengeTypes = checkChallengeMilestones(metrics.streak_current);
    const newChallenges: string[] = [];

    for (const challengeType of challengeTypes) {
      const { data: existing } = await supabase
        .from("adaptive_challenges")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_type", challengeType)
        .maybeSingle();

      if (!existing) {
        await supabase.from("adaptive_challenges").insert({
          user_id: userId,
          challenge_type: challengeType,
          status: "active",
        });
        newChallenges.push(challengeType);
      }
    }

    // Check if any active challenge should be completed
    const targetDays: Record<string, number> = { streak_10: 10, streak_21: 21, streak_30: 30 };
    const { data: activeChallenges } = await supabase
      .from("adaptive_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    for (const ch of activeChallenges || []) {
      const target = targetDays[ch.challenge_type];
      if (target && metrics.streak_current >= target) {
        await supabase.from("adaptive_challenges")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", ch.id);
      }
    }

    return createSuccessResponse(req, {
      profile_type: type,
      confidence_score: Math.round(confidence),
      metrics,
      new_challenges: newChallenges,
    });
  } catch (err) {
    console.error("classify-behavior error:", err);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
