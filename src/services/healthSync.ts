import {
  healthkitGetTodayMetrics,
  getTodayRestingHR,
  getTodayHRV,
  getWorkoutsLast24h,
  getTodaySteps,
  getTodayActiveCalories,
  getTodaySleepMinutes,
} from './healthkit';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  source: 'apple' | 'apple_health';
}

export async function syncHealthData(token: string): Promise<SyncResult> {
  const now = new Date();

  try {
    // 1. Try real HealthKit metrics first
    const realMetrics = await healthkitGetTodayMetrics();

    let steps: number;
    let activeCalories: number;
    let sleepMinutes: number;
    let source: 'apple' | 'apple_health';
    let date: string;

    if (realMetrics) {
      // Real HealthKit data available
      steps = realMetrics.steps;
      activeCalories = realMetrics.activeCalories;
      sleepMinutes = realMetrics.sleepMinutes;
      source = 'apple';
      date = realMetrics.date;
    } else {
      // Fallback to mock data
      [steps, activeCalories, sleepMinutes] = await Promise.all([
        getTodaySteps(),
        getTodayActiveCalories(),
        getTodaySleepMinutes(),
      ]);
      source = 'apple_health';
      date = now.toISOString().split('T')[0];
    }

    // 2. These remain mock for now (not in this phase)
    const [restingHr, hrvMs, workouts] = await Promise.all([
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
        source,
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
      message: realMetrics
        ? 'Dados do Apple Health sincronizados com sucesso'
        : 'Dados sincronizados com sucesso (mock)',
      timestamp: now.toISOString(),
      source,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro desconhecido ao sincronizar',
      timestamp: now.toISOString(),
      source: 'apple_health',
    };
  }
}
