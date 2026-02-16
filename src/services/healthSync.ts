import {
  getTodaySteps,
  getTodayActiveCalories,
  getTodaySleepMinutes,
  getTodayRestingHR,
  getTodayHRV,
  getWorkoutsLast24h,
} from './healthkit';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export async function syncHealthData(token: string): Promise<SyncResult> {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const [steps, activeCalories, sleepMinutes, restingHr, hrvMs, workouts] =
      await Promise.all([
        getTodaySteps(),
        getTodayActiveCalories(),
        getTodaySleepMinutes(),
        getTodayRestingHR(),
        getTodayHRV(),
        getWorkoutsLast24h(),
      ]);

    const payload = {
      date,
      daily: {
        steps,
        active_calories: activeCalories,
        sleep_minutes: sleepMinutes,
        resting_hr: restingHr,
        hrv_ms: hrvMs,
        source: 'apple_health',
      },
      workouts,
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/health-sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return {
      success: true,
      message: 'Dados sincronizados com sucesso',
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro desconhecido ao sincronizar',
      timestamp: now.toISOString(),
    };
  }
}
