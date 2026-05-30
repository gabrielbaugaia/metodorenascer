import { supabase } from '@/integrations/supabase/client';
import { capacitorStorage } from '@/lib/capacitor-storage';

const TOKEN_KEY = 'renascer_access_token';
const LAST_SYNC_KEY = 'renascer_last_sync';

export async function getToken(): Promise<string | null> {
  // Fonte primária: sessão Supabase ativa
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // Supabase client indisponível — seguir para fallback
  }

  return capacitorStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await capacitorStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await capacitorStorage.removeItem(TOKEN_KEY);
}

export async function saveLastSync(timestamp: string): Promise<void> {
  await capacitorStorage.setItem(LAST_SYNC_KEY, timestamp);
}

export async function getLastSync(): Promise<string | null> {
  return capacitorStorage.getItem(LAST_SYNC_KEY);
}
