// TODO: substituir por HealthKit nativo (iOS) / Health Connect (Android)
// Atualmente retorna dados simulados para validação do fluxo auth + sync

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function requestPermissions(): Promise<boolean> {
  // TODO: substituir por HealthKit nativo
  console.log('[HealthKit Mock] Permissions granted (mock)');
  return true;
}

export async function getTodaySteps(): Promise<number> {
  // TODO: substituir por HealthKit nativo
  return randomBetween(4000, 12000);
}

export async function getTodayActiveCalories(): Promise<number> {
  // TODO: substituir por HealthKit nativo
  return randomBetween(200, 700);
}

export async function getTodaySleepMinutes(): Promise<number> {
  // TODO: substituir por HealthKit nativo
  return randomBetween(300, 480);
}

export async function getTodayRestingHR(): Promise<number> {
  // TODO: substituir por HealthKit nativo
  return randomBetween(55, 70);
}

export async function getTodayHRV(): Promise<number> {
  // TODO: substituir por HealthKit nativo
  return randomBetween(40, 80);
}

export interface MockWorkout {
  start_time: string;
  end_time: string;
  type: string;
  calories: number;
  source: string;
}

export async function getWorkoutsLast24h(): Promise<MockWorkout[]> {
  // TODO: substituir por HealthKit nativo
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
