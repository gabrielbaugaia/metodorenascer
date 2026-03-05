import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

function clamp(x: number, min: number, max: number) { return Math.max(min, Math.min(max, x)); }
function safeMean(v: number[]) { return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }
function safeStd(v: number[]) {
  if (v.length < 2) return 0;
  const m = safeMean(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1));
}
function zs(val: number, mean: number, sd: number) { return sd < 0.001 ? 0 : (val - mean) / sd; }
function map15(x: number) { return clamp(((x - 1) / 4) * 100, 0, 100); }

async function computeForDate(supabase: any, userId: string, today: string) {
  const d30ago = new Date(new Date(today).getTime() - 30 * 86400000).toISOString().split("T")[0];
  const d14ago = new Date(new Date(today).getTime() - 14 * 86400000).toISOString().split("T")[0];
  const d90ago = new Date(new Date(today).getTime() - 90 * 86400000).toISOString().split("T")[0];
  const d3ago = new Date(new Date(today).getTime() - 3 * 86400000).toISOString().split("T")[0];

  const [workoutSetsRes, workoutCompsRes, dayLogsRes, healthRes, bodyAssessRes, checkinsRes, cogRes, structRes, prevScoresRes] = await Promise.all([
    supabase.from("workout_set_logs").select("exercise_name, set_number, weight_kg, reps_done, created_at").eq("user_id", userId).gte("created_at", d30ago + "T00:00:00Z").lte("created_at", today + "T23:59:59Z"),
    supabase.from("workout_completions").select("workout_date, duration_minutes, exercises_completed").eq("user_id", userId).gte("workout_date", d30ago).lte("workout_date", today),
    supabase.from("manual_day_logs").select("date, sleep_hours, stress_level, energy_focus, rpe, trained_today").eq("user_id", userId).gte("date", d30ago).lte("date", today).order("date", { ascending: true }),
    supabase.from("health_daily").select("date, hrv_ms, resting_hr, sleep_minutes").eq("user_id", userId).gte("date", d30ago).lte("date", today),
    supabase.from("body_assessments").select("assessed_at, weight, body_fat_pct, waist_cm, muscle_mass_kg").eq("user_id", userId).gte("assessed_at", d30ago + "T00:00:00Z").order("assessed_at", { ascending: true }),
    supabase.from("checkins").select("data_checkin, peso_atual").eq("user_id", userId).gte("data_checkin", d30ago).order("data_checkin", { ascending: true }),
    supabase.from("sis_cognitive_checkins").select("*").eq("user_id", userId).gte("date", d30ago).lte("date", today).order("date", { ascending: true }),
    supabase.from("sis_structural_assessments").select("squat_score, hinge_score, overhead_score, mobility_score, date").eq("user_id", userId).gte("date", d90ago).lte("date", today).order("date", { ascending: false }).limit(1),
    supabase.from("sis_scores_daily").select("date, mechanical_score").eq("user_id", userId).gte("date", d14ago).lte("date", today).order("date", { ascending: true }),
  ]);

  const workoutSets = workoutSetsRes.data || [];
  const workoutComps = workoutCompsRes.data || [];
  const dayLogs = dayLogsRes.data || [];
  const healthDaily = healthRes.data || [];
  const bodyAssess = bodyAssessRes.data || [];
  const checkins = checkinsRes.data || [];
  const cogCheckins = cogRes.data || [];
  const structural = structRes.data || [];
  const prevScores = prevScoresRes.data || [];

  // ======= MECHANICAL SCORE =======
  let mechanicalScore: number | null = null;
  const dailyVolumes: Record<string, number> = {};
  for (const s of workoutSets) {
    const d = s.created_at?.split("T")[0];
    if (!d) continue;
    dailyVolumes[d] = (dailyVolumes[d] || 0) + (s.weight_kg || 0) * (s.reps_done || 0);
  }
  const dailyDurations: Record<string, number> = {};
  for (const c of workoutComps) {
    if (c.workout_date && c.duration_minutes) {
      dailyDurations[c.workout_date] = (dailyDurations[c.workout_date] || 0) + c.duration_minutes;
    }
  }

  const volDays = Object.entries(dailyVolumes);
  if (volDays.length > 0) {
    const vols = volDays.map(([, v]) => v);
    const volMean = safeMean(vols);
    const volSd = safeStd(vols);
    const todayVol = dailyVolumes[today];

    if (todayVol !== undefined) {
      const volComp = clamp(50 + 15 * zs(todayVol, volMean, volSd), 0, 100);
      const todayDur = dailyDurations[today] || 0;
      const density = todayDur > 0 ? todayVol / todayDur : 0;
      const densVals = volDays.map(([d]) => {
        const dur = dailyDurations[d] || 1;
        return (dailyVolumes[d] || 0) / dur;
      });
      const densComp = clamp(50 + 10 * zs(density, safeMean(densVals), safeStd(densVals)), 0, 100);
      const todayLog = dayLogs.find(l => l.date === today);
      const rpeComp = todayLog?.rpe ? clamp(100 - todayLog.rpe * 10, 0, 100) : 50;
      mechanicalScore = clamp(0.50 * volComp + 0.25 * densComp + 0.25 * rpeComp, 0, 100);
    }
  }

  // ======= RECOVERY SCORE =======
  const todayDayLog = dayLogs.find(l => l.date === today);
  const todayHealth = healthDaily.find((h: any) => h.date === today);
  let recoveryScore: number | null = null;

  const hrvVals = healthDaily.filter((h: any) => h.hrv_ms).map((h: any) => h.hrv_ms);
  const rhrVals = healthDaily.filter((h: any) => h.resting_hr).map((h: any) => h.resting_hr);

  if (todayDayLog || todayHealth) {
    const sleepH = todayDayLog?.sleep_hours || 0;
    const sleepComp = clamp((sleepH / 8) * 100, 0, 100);
    const stressLvl = todayDayLog?.stress_level || 3;
    const stressComp = (1 - (stressLvl - 1) / 4) * 100;
    const energyLvl = todayDayLog?.energy_focus || 3;
    const fatigueComp = map15(energyLvl);

    let hrvComp = 50;
    if (todayHealth?.hrv_ms && hrvVals.length >= 3) {
      hrvComp = clamp(50 + 15 * zs(todayHealth.hrv_ms, safeMean(hrvVals), safeStd(hrvVals)), 0, 100);
    }
    let rhrComp = 50;
    if (todayHealth?.resting_hr && rhrVals.length >= 3) {
      rhrComp = clamp(50 - 15 * zs(todayHealth.resting_hr, safeMean(rhrVals), safeStd(rhrVals)), 0, 100);
    }

    recoveryScore = clamp(
      0.25 * hrvComp + 0.10 * rhrComp + 0.30 * sleepComp + 0.20 * stressComp + 0.15 * fatigueComp,
      0, 100
    );
  }

  // ======= STRUCTURAL SCORE =======
  let structuralScore = 50;
  if (structural.length > 0) {
    const s = structural[0];
    const scores = [s.squat_score, s.hinge_score, s.overhead_score, s.mobility_score].filter(Boolean) as number[];
    if (scores.length > 0) {
      structuralScore = clamp(((safeMean(scores) - 1) / 4) * 100, 0, 100);
    }
  }

  // ======= BODY COMP SCORE =======
  let bodyCompScore = 50;
  const latestAssess = bodyAssess.length > 0 ? bodyAssess[bodyAssess.length - 1] : null;

  if (latestAssess?.body_fat_pct) {
    bodyCompScore = clamp(100 - latestAssess.body_fat_pct * 2, 0, 100);
  } else if (latestAssess?.waist_cm) {
    bodyCompScore = clamp(100 - (latestAssess.waist_cm - 70) * 2, 0, 100);
  }

  if (bodyAssess.length >= 2) {
    const firstW = bodyAssess[0].weight;
    const lastW = bodyAssess[bodyAssess.length - 1].weight;
    if (firstW && lastW) {
      const weightDelta = lastW - firstW;
      const trendBonus = clamp(-weightDelta * 5, -10, 10);
      bodyCompScore = clamp(bodyCompScore + trendBonus, 0, 100);
    }
  }

  // ======= COGNITIVE SCORE =======
  let cognitiveScore: number | null = null;
  const todayCog = cogCheckins.find(c => c.date === today);
  if (todayCog) {
    const irritInv = 6 - (todayCog.irritability || 3);
    const vals = [
      map15(todayCog.mental_energy || 3),
      map15(todayCog.mental_clarity || 3),
      map15(todayCog.focus || 3),
      map15(irritInv),
      map15(todayCog.food_discipline || 3),
    ];
    cognitiveScore = safeMean(vals);
    if (todayCog.alcohol) cognitiveScore = clamp(cognitiveScore - 5, 0, 100);
  }

  // ======= CONSISTENCY SCORE (Enhanced with Behavioral Discipline) =======
  const last14 = new Set<string>();
  const last14Cog = new Set<string>();
  const last14Recovery = new Set<string>();
  const last14Workouts = new Set<string>();
  const last14Sleep = new Set<string>();

  for (const l of dayLogs) {
    if (l.date >= d14ago) {
      last14.add(l.date);
      last14Recovery.add(l.date);
      if (l.sleep_hours != null) last14Sleep.add(l.date);
    }
  }
  for (const c of cogCheckins) { if (c.date >= d14ago) { last14.add(c.date); last14Cog.add(c.date); } }
  for (const d of Object.keys(dailyVolumes)) { if (d >= d14ago) { last14.add(d); last14Workouts.add(d); } }

  // Behavioral discipline components
  const workoutCompletionRate = last14Workouts.size / 14;
  const sleepLogFrequency = last14Sleep.size / 14;
  const mentalCheckinFrequency = last14Cog.size / 14;
  const dailyConsistency = last14.size / 14;

  // Streak bonus: scales from 0 to 15 points based on streak length (max at 30 days)
  let streakBonus = 0;
  const { data: streakData } = await supabase
    .from("sis_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .single();
  if (streakData?.current_streak) {
    streakBonus = clamp((streakData.current_streak / 30) * 15, 0, 15);
  }

  const consistencyScore = clamp(
    0.30 * workoutCompletionRate * 100 +
    0.20 * sleepLogFrequency * 100 +
    0.15 * mentalCheckinFrequency * 100 +
    0.25 * dailyConsistency * 100 +
    0.10 * (streakBonus / 15) * 100,
    0, 100
  );

  // ======= SHAPE INTELLIGENCE SCORE =======
  const mech = mechanicalScore ?? 50;
  const rec = recoveryScore ?? 50;
  const cog = cognitiveScore ?? 50;

  const sisScore = clamp(
    0.25 * mech + 0.20 * rec + 0.15 * structuralScore + 0.15 * bodyCompScore + 0.15 * cog + 0.10 * consistencyScore,
    0, 100
  );

  let classification = "Risco";
  if (sisScore >= 85) classification = "Elite";
  else if (sisScore >= 70) classification = "Alta Performance";
  else if (sisScore >= 50) classification = "Moderado";

  // ======= ALERTS =======
  const alerts: any[] = [];

  const recentHrv = healthDaily.filter((h: any) => h.date >= d3ago && h.hrv_ms);
  if (recentHrv.length >= 3 && hrvVals.length >= 7) {
    const hrvMean = safeMean(hrvVals);
    const hrvSdVal = safeStd(hrvVals);
    const belowBaseline = recentHrv.every((h: any) => zs(h.hrv_ms, hrvMean, hrvSdVal) < -1);
    if (belowBaseline) {
      alerts.push({ type: "hrv_low", priority: "alta", message: "HRV abaixo do baseline por 3 dias", action: "Priorize descanso e sono de qualidade" });
    }
  }

  if (recoveryScore !== null && recoveryScore < 60) {
    alerts.push({ type: "recovery_low", priority: "alta", message: "Score de recuperação baixo hoje", action: "Reduza intensidade e foque em sono" });
  }

  if (mechanicalScore !== null && prevScores.length >= 3) {
    const prevMech = prevScores.filter(s => s.mechanical_score).map(s => Number(s.mechanical_score));
    if (prevMech.length > 0) {
      const avg14 = safeMean(prevMech);
      if (mechanicalScore < avg14 - 10) {
        alerts.push({ type: "mechanical_drop", priority: "media", message: "Queda de performance mecânica vs últimos 14 dias", action: "Revise carga e recuperação" });
      }
    }
  }

  const recentSleep = dayLogs.filter(l => l.date >= d3ago && l.sleep_hours);
  if (recentSleep.length >= 3 && recentSleep.every(l => (l.sleep_hours || 0) < 6)) {
    alerts.push({ type: "sleep_deficit", priority: "alta", message: "Déficit de sono por 3 dias (<6h)", action: "Sono é o maior fator de recuperação. Priorize." });
  }

  const recentStress = dayLogs.filter(l => l.date >= d3ago && l.stress_level);
  if (recentStress.length >= 3 && recentStress.every(l => (l.stress_level || 0) >= 4)) {
    alerts.push({ type: "stress_high", priority: "media", message: "Estresse elevado por 3 dias consecutivos", action: "Considere práticas de gestão de estresse" });
  }

  // ======= BUILD SCORE ROW =======
  return {
    user_id: userId,
    date: today,
    mechanical_score: mechanicalScore !== null ? Math.round(mechanicalScore * 100) / 100 : null,
    recovery_score: recoveryScore !== null ? Math.round(recoveryScore * 100) / 100 : null,
    structural_score: Math.round(structuralScore * 100) / 100,
    body_comp_score: Math.round(bodyCompScore * 100) / 100,
    cognitive_score: cognitiveScore !== null ? Math.round(cognitiveScore * 100) / 100 : null,
    consistency_score: Math.round(consistencyScore * 100) / 100,
    shape_intelligence_score: Math.round(sisScore * 100) / 100,
    classification,
    alerts,
    _hasCogCheckin: !!todayCog,
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return createErrorResponse(req, "Não autorizado", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
    if (authErr || !user) return createErrorResponse(req, "Não autorizado", 401);

    const body = await req.json().catch(() => ({}));
    const { target_date, backfill, target_user_id } = body;

    // If target_user_id is passed, verify caller is admin
    let userId = user.id;
    if (target_user_id && target_user_id !== user.id) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) return createErrorResponse(req, "Não autorizado - admin required", 403);
      userId = target_user_id;
    }

    if (backfill) {
      // ---- BACKFILL MODE: compute for each of last 30 days ----
      const results: any[] = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
        try {
          const scoreRow = await computeForDate(supabase, userId, d);
          const { _hasCogCheckin, ...row } = scoreRow;

          const { error: upsertErr } = await supabase
            .from("sis_scores_daily")
            .upsert(row, { onConflict: "user_id,date" });

          if (!upsertErr) results.push(row);
        } catch (e) {
          console.error(`Backfill error for ${d}:`, e);
        }
      }
      return createSuccessResponse(req, { backfilled: results.length, dates: results.map(r => r.date) });
    }

    // ---- SINGLE DAY MODE ----
    const today = target_date || new Date().toISOString().split("T")[0];
    const scoreRow = await computeForDate(supabase, userId, today);
    const hasCogCheckin = scoreRow._hasCogCheckin;
    const { _hasCogCheckin: _, ...row } = scoreRow;

    const { error: upsertErr } = await supabase
      .from("sis_scores_daily")
      .upsert(row, { onConflict: "user_id,date" });

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return createErrorResponse(req, "Erro ao salvar score", 500);
    }

    // Update streaks if cognitive checkin today
    if (hasCogCheckin) {
      const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().split("T")[0];
      const { data: currentStreak } = await supabase
        .from("sis_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (currentStreak) {
        const newStreak = currentStreak.last_checkin_date === yesterday
          ? currentStreak.current_streak + 1
          : currentStreak.last_checkin_date === today
            ? currentStreak.current_streak
            : 1;
        const bestStreak = Math.max(newStreak, currentStreak.best_streak);
        await supabase.from("sis_streaks").update({
          current_streak: newStreak,
          best_streak: bestStreak,
          last_checkin_date: today,
        }).eq("user_id", userId);
      } else {
        await supabase.from("sis_streaks").insert({
          user_id: userId,
          current_streak: 1,
          best_streak: 1,
          last_checkin_date: today,
        });
      }
    }

    return createSuccessResponse(req, row);
  } catch (err) {
    console.error("compute-sis-score error:", err);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
