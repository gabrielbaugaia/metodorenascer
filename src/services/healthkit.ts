import { registerPlugin } from '@capacitor/core';
import { platform } from './platform';

// ============================================================
// HealthKit Plugin Bridge (Capacitor – iOS) + Mock Fallback
// ============================================================

export type TodayMetrics = {
  date: string;
  steps: number;
  activeCalories: number;
  sleepMinutes: number;
  restingHr: number | null;
  hrvMs: number | null;
};

export interface HealthKitWorkout {
  startTime: string;
  endTime: string;
  type: string;
  calories: number | null;
  source: 'apple';
  externalId: string;
}

interface HealthKitPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ granted: boolean }>;
  getTodayMetrics(): Promise<TodayMetrics>;
  getWorkoutsLast24h(): Promise<{ workouts: HealthKitWorkout[] }>;
}

// ---------- helpers ----------

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateExternalId(startTime: string, endTime: string, type: string, source: string): string {
  return btoa(`${startTime}|${endTime}|${type}|${source}`).replace(/=/g, '');
}

// ---------- plugin registration (lazy, iOS only) ----------

let _plugin: HealthKitPluginInterface | null = null;

function getPlugin(): HealthKitPluginInterface | null {
  if (platform !== 'ios') return null;
  if (!_plugin) {
    try {
      _plugin = registerPlugin<HealthKitPluginInterface>('HealthKitPlugin');
    } catch {
      _plugin = null;
    }
  }
  return _plugin;
}

// ---------- module-level cache ----------

let _cachedMetrics: TodayMetrics | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 s

function isCacheValid(): boolean {
  return _cachedMetrics !== null && Date.now() - _cacheTimestamp < CACHE_TTL_MS;
}

// ---------- public API ----------

/** Check if HealthKit is available on this device */
export async function healthkitIsAvailable(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const { available } = await plugin.isAvailable();
    return available;
  } catch {
    return false;
  }
}

/** Request HealthKit permissions. Returns true if granted (or mock). */
export async function requestPermissions(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) {
    console.log('[HealthKit Mock] Permissions granted (mock)');
    return true;
  }
  try {
    const { granted } = await plugin.requestPermissions();
    return granted;
  } catch {
    console.warn('[HealthKit] requestPermissions failed, using mock fallback');
    return true;
  }
}

/**
 * Fetch all metrics in a single native call (includes restingHr and hrvMs).
 * Returns null when HealthKit is unavailable or on error (caller should use mock).
 */
export async function healthkitGetTodayMetrics(): Promise<TodayMetrics | null> {
  if (isCacheValid()) return _cachedMetrics;

  const plugin = getPlugin();
  if (!plugin) return null;

  try {
    const metrics = await plugin.getTodayMetrics();
    _cachedMetrics = metrics;
    _cacheTimestamp = Date.now();
    return metrics;
  } catch (err) {
    console.warn('[HealthKit] getTodayMetrics failed:', err);
    return null;
  }
}

/**
 * Fetch workouts from the last 24h via native plugin.
 * Returns empty array on failure (caller should use mock).
 */
export async function healthkitGetWorkoutsLast24h(): Promise<HealthKitWorkout[]> {
  const plugin = getPlugin();
  if (!plugin) return [];

  try {
    const result = await plugin.getWorkoutsLast24h();
    return result.workouts || [];
  } catch (err) {
    console.warn('[HealthKit] getWorkoutsLast24h failed:', err);
    return [];
  }
}

// ---------- individual metric helpers (backward-compatible) ----------

export async function getTodaySteps(): Promise<number> {
  const m = await healthkitGetTodayMetrics();
  return m ? m.steps : randomBetween(4000, 12000);
}

export async function getTodayActiveCalories(): Promise<number> {
  const m = await healthkitGetTodayMetrics();
  return m ? m.activeCalories : randomBetween(200, 700);
}

export async function getTodaySleepMinutes(): Promise<number> {
  const m = await healthkitGetTodayMetrics();
  return m ? m.sleepMinutes : randomBetween(300, 480);
}

export async function getTodayRestingHR(): Promise<number | null> {
  const m = await healthkitGetTodayMetrics();
  return m ? m.restingHr : randomBetween(55, 70);
}

export async function getTodayHRV(): Promise<number | null> {
  const m = await healthkitGetTodayMetrics();
  return m ? m.hrvMs : randomBetween(40, 80);
}

// ---------- workouts ----------

export interface MockWorkout {
  start_time: string;
  end_time: string;
  type: string;
  calories: number;
  source: string;
  external_id?: string;
}

export async function getWorkoutsLast24h(): Promise<MockWorkout[]> {
  const realWorkouts = await healthkitGetWorkoutsLast24h();
  if (realWorkouts.length > 0) {
    return realWorkouts.map((w) => ({
      start_time: w.startTime,
      end_time: w.endTime,
      type: w.type,
      calories: w.calories ?? 0,
      source: 'apple',
      external_id: w.externalId,
    }));
  }

  // Mock fallback
  const count = randomBetween(0, 2);
  const workouts: MockWorkout[] = [];
  const types = ['strength_training', 'running', 'cycling', 'yoga'];

  for (let i = 0; i < count; i++) {
    const startHour = randomBetween(6, 18);
    const durationMin = randomBetween(30, 75);
    const start = new Date();
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60000);
    const type = types[randomBetween(0, types.length - 1)];

    workouts.push({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      type,
      calories: randomBetween(150, 500),
      source: 'apple_health',
      external_id: generateExternalId(start.toISOString(), end.toISOString(), type, 'mock'),
    });
  }

  return workouts;
}
