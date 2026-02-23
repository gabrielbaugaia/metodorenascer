import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

function detectPlatform(): Platform {
  try {
    if (typeof (window as any)?.Capacitor !== 'undefined') {
      const p = Capacitor.getPlatform();
      if (p === 'ios') return 'ios';
      if (p === 'android') return 'android';
    }
  } catch {
    // Capacitor not available
  }
  return 'web';
}

/** Current platform: 'ios' | 'android' | 'web' */
export const platform: Platform = detectPlatform();

/** True when running inside a native Capacitor shell (iOS or Android) */
export const isNative: boolean = platform === 'ios' || platform === 'android';
