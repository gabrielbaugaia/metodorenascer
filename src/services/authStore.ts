import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'renascer_access_token';
const LAST_SYNC_KEY = 'renascer_last_sync';

// Detecta se está rodando em ambiente nativo (Capacitor)
function isNative(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined';
}

export async function saveToken(token: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key: TOKEN_KEY });
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function saveLastSync(timestamp: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key: LAST_SYNC_KEY, value: timestamp });
  } else {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  }
}

export async function getLastSync(): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key: LAST_SYNC_KEY });
    return value;
  }
  return localStorage.getItem(LAST_SYNC_KEY);
}
