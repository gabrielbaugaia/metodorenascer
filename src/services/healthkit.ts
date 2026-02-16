import { registerPlugin } from '@capacitor/core';

// ============================================================
// HealthKit Plugin Bridge (Capacitor) + Mock Fallback
// ============================================================

export type TodayMetrics = {
  date: string;
  steps: number;
  activeCalories: number;
  sleepMinutes: number;
};

interface HealthKitPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ granted: boolean }>;
  getTodayMetrics(): Promise<TodayMetrics>;
}

// ---------- helpers ----------

function isNative(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined';
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------- plugin registration (lazy) ----------

let _plugin: HealthKitPluginInterface | null = null;

function getPlugin(): HealthKitPluginInterface | null {
  if (!isNative()) return null;
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
    return true; // fallback mock
  }
}

/**
 * Fetch all three metrics in a single native call.
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

// Not implemented in this phase — always mock
export async function getTodayRestingHR(): Promise<number> {
  return randomBetween(55, 70);
}

export async function getTodayHRV(): Promise<number> {
  return randomBetween(40, 80);
}

// ---------- workouts (mock — not in this phase) ----------

export interface MockWorkout {
  start_time: string;
  end_time: string;
  type: string;
  calories: number;
  source: string;
}

export async function getWorkoutsLast24h(): Promise<MockWorkout[]> {
  const count = randomBetween(0, 2);
  const workouts: MockWorkout[] = [];
  const types = ['strength_training', 'running', 'cycling', 'yoga'];

  for (let i = 0; i < count; i++) {
    const startHour = randomBetween(6, 18);
    const durationMin = randomBetween(30, 75);
    const start = new Date();
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60000);

    workouts.push({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      type: types[randomBetween(0, types.length - 1)],
      calories: randomBetween(150, 500),
      source: 'apple_health',
    });
  }

  return workouts;
}
