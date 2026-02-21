import type { WearableProvider, WearableData, WearableStatus } from './types';

export function getWearableStatus(_userId: string): WearableStatus {
  return { provider: 'none', connected: false, lastSyncAt: null };
}

export function requestPermissions(_provider: WearableProvider): Promise<boolean> {
  throw new Error('not_implemented');
}

export function fetchLatestData(_provider: WearableProvider): Promise<WearableData | null> {
  return Promise.resolve(null);
}

export function syncNow(_provider: WearableProvider): Promise<{ ok: boolean; reason?: string }> {
  return Promise.resolve({ ok: false, reason: 'not_implemented' });
}
