import { platform } from './platform';
import {
  healthkitGetTodayMetrics,
  healthkitGetWorkoutsLast24h,
  getTodayRestingHR,
  getTodayHRV,
  getWorkoutsLast24h as getAppleWorkouts,
  getTodaySteps as getAppleSteps,
  getTodayActiveCalories as getAppleCalories,
  getTodaySleepMinutes as getAppleSleep,
} from './healthkit';
import {
  healthConnectGetTodayMetrics,
  healthConnectGetWorkoutsLast24h,
  getHealthConnectMockSteps,
  getHealthConnectMockCalories,
  getHealthConnectMockSleep,
  getHealthConnectMockHR,
  getHealthConnectMockHRV,
  getHealthConnectWorkoutsWithFallback,
} from './healthConnect';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type HealthSource = 'apple' | 'apple_health' | 'google' | 'health_connect' | 'mock';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  source: HealthSource;
}

export async function syncHealthData(token: string): Promise<SyncResult> {
  const now = new Date();

  try {
    let steps: number;
    let activeCalories: number;
    let sleepMinutes: number;
    let restingHr: number | null;
    let hrvMs: number | null;
    let source: HealthSource;
    let date: string;
    let workouts: any[];

    if (platform === 'ios') {
      // ---- iOS: HealthKit ----
      const realMetrics = await healthkitGetTodayMetrics();

      if (realMetrics) {
        steps = realMetrics.steps;
        activeCalories = realMetrics.activeCalories;
        sleepMinutes = realMetrics.sleepMinutes;
        restingHr = realMetrics.restingHr;
        hrvMs = realMetrics.hrvMs;
        source = 'apple';
        date = realMetrics.date;
      } else {
        const [mockSteps, mockCal, mockSleep, mockHr, mockHrv] = await Promise.all([
          getAppleSteps(),
          getAppleCalories(),
          getAppleSleep(),
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
        const mockWk = await getAppleWorkouts();
        workouts = mockWk.map((w) => ({
          start_time: w.start_time,
          end_time: w.end_time,
          type: w.type,
          calories: w.calories || undefined,
          source: w.source,
          external_id: w.external_id || undefined,
        }));
      }
    } else if (platform === 'android') {
      // ---- Android: Health Connect ----
      const realMetrics = await healthConnectGetTodayMetrics();

      if (realMetrics) {
        steps = realMetrics.steps;
        activeCalories = realMetrics.activeCalories;
        sleepMinutes = realMetrics.sleepMinutes;
        restingHr = realMetrics.restingHr;
        hrvMs = realMetrics.hrvMs;
        source = 'google';
        date = realMetrics.date;
      } else {
        const [mockSteps, mockCal, mockSleep, mockHr, mockHrv] = await Promise.all([
          getHealthConnectMockSteps(),
          getHealthConnectMockCalories(),
          getHealthConnectMockSleep(),
          getHealthConnectMockHR(),
          getHealthConnectMockHRV(),
        ]);
        steps = mockSteps;
        activeCalories = mockCal;
        sleepMinutes = mockSleep;
        restingHr = mockHr;
        hrvMs = mockHrv;
        source = 'health_connect';
        date = now.toISOString().split('T')[0];
      }

      const realWorkouts = await healthConnectGetWorkoutsLast24h();
      if (realWorkouts.length > 0) {
        workouts = realWorkouts.map((w) => ({
          start_time: w.startTime,
          end_time: w.endTime,
          type: w.type,
          calories: w.calories ?? undefined,
          source: 'google',
          external_id: w.externalId,
        }));
      } else {
        const mockWk = await getHealthConnectWorkoutsWithFallback();
        workouts = mockWk.map((w) => ({
          start_time: w.start_time,
          end_time: w.end_time,
          type: w.type,
          calories: w.calories || undefined,
          source: w.source,
          external_id: w.external_id || undefined,
        }));
      }
    } else {
      // ---- Web: mock fallback (uses iOS mock functions for backward compat) ----
      const [mockSteps, mockCal, mockSleep, mockHr, mockHrv] = await Promise.all([
        getAppleSteps(),
        getAppleCalories(),
        getAppleSleep(),
        getTodayRestingHR(),
        getTodayHRV(),
      ]);
      steps = mockSteps;
      activeCalories = mockCal;
      sleepMinutes = mockSleep;
      restingHr = mockHr;
      hrvMs = mockHrv;
      source = 'mock';
      date = now.toISOString().split('T')[0];

      const mockWk = await getAppleWorkouts();
      workouts = mockWk.map((w) => ({
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

    const messageMap: Record<string, string> = {
      apple: 'Dados do Apple Health sincronizados com sucesso',
      apple_health: 'Dados sincronizados com sucesso (mock iOS)',
      google: 'Dados do Health Connect sincronizados com sucesso',
      health_connect: 'Dados sincronizados com sucesso (mock Android)',
      mock: 'Dados sincronizados com sucesso (mock)',
    };

    return {
      success: true,
      message: messageMap[source] || 'Dados sincronizados com sucesso',
      timestamp: now.toISOString(),
      source,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro desconhecido ao sincronizar',
      timestamp: now.toISOString(),
      source: 'mock',
    };
  }
}
