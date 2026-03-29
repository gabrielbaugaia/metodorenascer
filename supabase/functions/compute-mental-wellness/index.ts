import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";

function clamp(x: number, min: number, max: number) { return Math.max(min, Math.min(max, x)); }
function safeMean(v: number[]) { return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }

async function computeWellness(supabase: any, userId: string, today: string) {
  const d30ago = new Date(new Date(today).getTime() - 30 * 86400000).toISOString().split("T")[0];
  const d7ago = new Date(new Date(today).getTime() - 7 * 86400000).toISOString().split("T")[0];
  const d3ago = new Date(new Date(today).getTime() - 3 * 86400000).toISOString().split("T")[0];

  const [cogRes, dayLogsRes, healthRes] = await Promise.all([
    supabase.from("sis_cognitive_checkins").select("*").eq("user_id", userId).gte("date", d30ago).lte("date", today).order("date"),
    supabase.from("manual_day_logs").select("date, sleep_hours, stress_level, energy_focus").eq("user_id", userId).gte("date", d30ago).lte("date", today).order("date"),
    supabase.from("health_daily").select("date, hrv_ms, resting_hr, avg_hr_bpm").eq("user_id", userId).gte("date", d30ago).lte("date", today).order("date"),
  ]);

  const cog = cogRes.data || [];
  const dayLogs = dayLogsRes.data || [];
  const health = healthRes.data || [];
  const alerts: any[] = [];

  // 1. Burnout Index (stress high + sleep low + HRV declining + irritability high)
  let burnoutIndex = 0;
  const recent7Cog = cog.filter((c: any) => c.date >= d7ago);
  const recent7Logs = dayLogs.filter((l: any) => l.date >= d7ago);
  const recent7Health = health.filter((h: any) => h.date >= d7ago);

  if (recent7Cog.length >= 3 || recent7Logs.length >= 3) {
    const stressScores = recent7Logs.map((l: any) => (l.stress_level ?? 50) / 100);
    const sleepScores = recent7Logs.map((l: any) => l.sleep_hours ? clamp(1 - l.sleep_hours / 8, 0, 1) : 0.5);
    const irritScores = recent7Cog.map((c: any) => ((c.irritability ?? 3) - 1) / 4);
    const hrvDecline = recent7Health.length >= 3
      ? (recent7Health[0]?.hrv_ms && recent7Health[recent7Health.length - 1]?.hrv_ms
        ? clamp((recent7Health[0].hrv_ms - recent7Health[recent7Health.length - 1].hrv_ms) / 30, 0, 1)
        : 0)
      : 0;

    burnoutIndex = clamp(
      (safeMean(stressScores) * 30 +
       safeMean(sleepScores) * 25 +
       safeMean(irritScores) * 25 +
       hrvDecline * 20),
      0, 100
    );

    if (burnoutIndex >= 70) {
      alerts.push({ priority: "alta", message: "Índice de burnout elevado", action: "Priorize descanso, reduza intensidade dos treinos e busque atividades restaurativas" });
    }
  }

  // 2. Compulsion Risk (low food_discipline + high stress + alcohol)
  let compulsionRisk = 0;
  if (recent7Cog.length >= 3) {
    const lowDisciplineDays = recent7Cog.filter((c: any) => (c.food_discipline ?? 3) <= 2).length;
    const alcoholDays = recent7Cog.filter((c: any) => c.alcohol).length;
    const highStressDays = recent7Logs.filter((l: any) => (l.stress_level ?? 50) >= 70).length;

    compulsionRisk = clamp(
      (lowDisciplineDays / Math.max(recent7Cog.length, 1)) * 40 +
      (alcoholDays / Math.max(recent7Cog.length, 1)) * 30 +
      (highStressDays / Math.max(recent7Logs.length, 1)) * 30,
      0, 100
    );

    if (compulsionRisk >= 60) {
      alerts.push({ priority: "media", message: "Padrão de compulsão alimentar detectado", action: "Planeje refeições com antecedência nos dias de mais estresse" });
    }
  }

  // 3. Sleep-Mood Correlation
  let sleepMoodCorrelation = 0;
  const pairedData = dayLogs
    .filter((l: any) => l.sleep_hours != null)
    .map((l: any) => {
      const cogDay = cog.find((c: any) => c.date === l.date);
      return cogDay ? { sleep: l.sleep_hours, energy: cogDay.mental_energy ?? 3 } : null;
    })
    .filter(Boolean) as { sleep: number; energy: number }[];

  if (pairedData.length >= 5) {
    const lowSleepDays = pairedData.filter(d => d.sleep < 6);
    const goodSleepDays = pairedData.filter(d => d.sleep >= 7);
    const avgEnergyLowSleep = lowSleepDays.length ? safeMean(lowSleepDays.map(d => d.energy)) : 3;
    const avgEnergyGoodSleep = goodSleepDays.length ? safeMean(goodSleepDays.map(d => d.energy)) : 3;
    const diff = avgEnergyGoodSleep - avgEnergyLowSleep;
    sleepMoodCorrelation = clamp(diff * 25, 0, 100);
  }

  // 4. Body-Mind Divergence
  let bodyMindDivergence = 0;
  const recent3Cog = cog.filter((c: any) => c.date >= d3ago);
  const recent3Health = health.filter((h: any) => h.date >= d3ago);
  if (recent3Cog.length >= 2 && recent3Health.length >= 2) {
    const avgCogWellness = safeMean(recent3Cog.map((c: any) => 
      safeMean([(c.mental_energy ?? 3), (c.mental_clarity ?? 3), (c.focus ?? 3)]) / 5
    ));
    const avgHrvNorm = recent3Health.filter((h: any) => h.hrv_ms).length
      ? safeMean(recent3Health.filter((h: any) => h.hrv_ms).map((h: any) => clamp(h.hrv_ms / 80, 0, 1)))
      : 0.5;
    bodyMindDivergence = clamp(Math.abs(avgCogWellness - avgHrvNorm) * 200, 0, 100);
  }

  // 5. Motivation Trend (declining training_motivation over 7 days)
  let motivationTrend = 0;
  if (recent7Cog.length >= 4) {
    const half = Math.floor(recent7Cog.length / 2);
    const firstHalf = recent7Cog.slice(0, half).map((c: any) => c.training_motivation ?? c.mental_energy ?? 3);
    const secondHalf = recent7Cog.slice(half).map((c: any) => c.training_motivation ?? c.mental_energy ?? 3);
    const decline = safeMean(firstHalf) - safeMean(secondHalf);
    motivationTrend = clamp(decline * 25, 0, 100);
    
    if (motivationTrend >= 50) {
      alerts.push({ priority: "media", message: "Motivação em queda progressiva", action: "Considere variar o tipo de treino ou reduzir volume temporariamente" });
    }
  }

  // 6. Resilience Index (how quickly stress returns to baseline)
  let resilienceIndex = 50;
  const stressHighPeriods: number[] = [];
  let inHighStress = false;
  let daysInHigh = 0;
  for (const l of dayLogs) {
    if ((l.stress_level ?? 50) >= 70) {
      inHighStress = true;
      daysInHigh++;
    } else if (inHighStress) {
      stressHighPeriods.push(daysInHigh);
      inHighStress = false;
      daysInHigh = 0;
    }
  }
  if (stressHighPeriods.length > 0) {
    const avgRecovery = safeMean(stressHighPeriods);
    resilienceIndex = clamp(100 - avgRecovery * 20, 0, 100);
  }

  // Social isolation check
  const recentIsolation = recent7Cog.filter((c: any) => c.social_interaction === false).length;
  if (recentIsolation >= 5) {
    alerts.push({ priority: "alta", message: "Padrão de isolamento social detectado", action: "Busque interação social, mesmo que breve — uma caminhada com alguém pode ajudar" });
  }

  // Anxiety check
  const highAnxietyDays = recent7Cog.filter((c: any) => (c.anxiety ?? 3) >= 4).length;
  if (highAnxietyDays >= 4) {
    alerts.push({ priority: "alta", message: "Ansiedade elevada persistente", action: "Pratique técnicas de respiração diafragmática (4-7-8) e grounding antes de dormir" });
  }

  return {
    user_id: userId,
    date: today,
    burnout_index: Math.round(burnoutIndex * 100) / 100,
    compulsion_risk: Math.round(compulsionRisk * 100) / 100,
    sleep_mood_correlation: Math.round(sleepMoodCorrelation * 100) / 100,
    body_mind_divergence: Math.round(bodyMindDivergence * 100) / 100,
    motivation_trend: Math.round(motivationTrend * 100) / 100,
    resilience_index: Math.round(resilienceIndex * 100) / 100,
    alerts,
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
    const body = await req.json().catch(() => ({}));
    const { target_date, target_user_id } = body;

    let userId: string;

    if (token === serviceKey && target_user_id) {
      userId = target_user_id;
    } else {
      const { data: { user }, error: authErr } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
      if (authErr || !user) return createErrorResponse(req, "Não autorizado", 401);
      userId = user.id;
      if (target_user_id && target_user_id !== user.id) {
        const { data: roleData } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", user.id).eq("role", "admin").maybeSingle();
        if (!roleData) return createErrorResponse(req, "Não autorizado", 403);
        userId = target_user_id;
      }
    }

    const today = target_date || new Date().toISOString().split("T")[0];
    const result = await computeWellness(supabase, userId, today);

    const { error: upsertErr } = await supabase
      .from("mental_wellness_scores")
      .upsert(result, { onConflict: "user_id,date" });

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return createErrorResponse(req, "Erro ao salvar wellness score", 500);
    }

    return createSuccessResponse(req, result);
  } catch (err) {
    console.error("compute-mental-wellness error:", err);
    return createErrorResponse(req, "Erro interno", 500);
  }
});
