import {
  healthkitGetTodayMetrics,
  healthkitGetWorkoutsLast24h,
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
    let restingHr: number | null;
    let hrvMs: number | null;
    let source: 'apple' | 'apple_health';
    let date: string;

    if (realMetrics) {
      // Real HealthKit data available
      steps = realMetrics.steps;
      activeCalories = realMetrics.activeCalories;
      sleepMinutes = realMetrics.sleepMinutes;
      restingHr = realMetrics.restingHr;
      hrvMs = realMetrics.hrvMs;
      source = 'apple';
      date = realMetrics.date;
    } else {
      // Fallback to mock data
      const [mockSteps, mockCal, mockSleep, mockHr, mockHrv] = await Promise.all([
        getTodaySteps(),
        getTodayActiveCalories(),
        getTodaySleepMinutes(),
        getTodayRestingHR(),
        getTodayHRV(),
      ]);
      steps = mockSteps;
      activeCalories = mockCal;
      sleepMinutes = mockSleep;
      restingHr = mockHr;
      hrvMs = mockHrv;
      source = 'apple_health';
      date = now.toISOString().split('T')[0];
    }

    // 2. Try real workouts, fallback to mock
    let workouts: any[];
    const realWorkouts = await healthkitGetWorkoutsLast24h();
    if (realWorkouts.length > 0) {
      workouts = realWorkouts.map((w) => ({
        start_time: w.startTime,
        end_time: w.endTime,
        type: w.type,
        calories: w.calories ?? undefined,
        source: 'apple',
        external_id: w.externalId,
      }));
    } else {
      const mockWorkouts = await getWorkoutsLast24h();
      workouts = mockWorkouts.map((w) => ({
        start_time: w.start_time,
        end_time: w.end_time,
        type: w.type,
        calories: w.calories || undefined,
        source: w.source,
        external_id: w.external_id || undefined,
      }));
    }

    const payload = {
      date,
      daily: {
        steps,
        active_calories: activeCalories,
        sleep_minutes: sleepMinutes,
        resting_hr: restingHr ?? undefined,
        hrv_ms: hrvMs ?? undefined,
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
