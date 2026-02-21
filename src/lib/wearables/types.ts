export type WearableProvider = 'none' | 'android_health_connect' | 'apple_healthkit';

export interface WearableData {
  steps?: number;
  sleepHours?: number;
  restingHr?: number;
  hrv?: number;
  source?: WearableProvider;
  lastSyncAt?: string;
}

export interface WearableStatus {
  provider: WearableProvider;
  connected: boolean;
  lastSyncAt: string | null;
}
