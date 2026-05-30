import { Health } from '@capgo/capacitor-health';
import { isNative } from '@/services/platform';
import { supabase } from '@/integrations/supabase/client';
import { syncHealthData } from '@/services/healthSync';
import { toast } from 'sonner';

/**
 * HealthService — wrapper unificado iOS (HealthKit) + Android (Health Connect)
 * via @capgo/capacitor-health, mas a PERSISTÊNCIA é delegada ao pipeline
 * existente (`syncHealthData` → edge `health-sync` → tabela `health_daily`),
 * mantendo SIS, Renascer Score e dashboards alimentados pelos mesmos dados.
 */

const SYNC_THROTTLE_KEY = 'health_last_sync_ts';
const SYNC_THROTTLE_MS = 15 * 60 * 1000; // 15 min

const READ_TYPES = ['steps', 'calories', 'heartRate', 'sleep'] as const;

export const HealthService = {
  async isAvailable(): Promise<boolean> {
    if (!isNative) return false;
    try {
      const { available } = await Health.isAvailable();
      return available;
    } catch (error) {
      console.error('[HealthService] isAvailable error:', error);
      return false;
    }
  },

  async requestPermissions(): Promise<boolean> {
    if (!isNative) {
      toast.info('Conexão com relógios só funciona no app instalado (iOS/Android).');
      return false;
    }
    try {
      const status = await Health.requestAuthorization({
        read: [...READ_TYPES],
        write: [],
      });
      const success = (status.readAuthorized?.length ?? 0) > 0;
      if (success) {
        toast.success('Permissões de saúde concedidas!');
      } else {
        toast.error('Permissões de saúde negadas.');
      }
      return success;
    } catch (error: any) {
      console.error('[HealthService] requestPermissions error:', error);
      toast.error('Erro ao solicitar permissões de saúde.');
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    if (!isNative) return false;
    try {
      const { success } = await Health.checkAuthorization({
        read: [...READ_TYPES],
        write: [],
      });
      return success;
    } catch (error) {
      console.error('[HealthService] checkPermissions error:', error);
      return false;
    }
  },

  /**
   * Lê dados de hoje (passos, calorias, sono, FC, HRV) e sincroniza
   * no `health_daily` via edge function. Throttle de 15 min para evitar
   * chamadas redundantes durante navegação.
   */
  async readAndSyncDailyData(options: { silent?: boolean; force?: boolean } = {}): Promise<void> {
    const { silent = false, force = false } = options;

    if (!isNative) {
      if (!silent) toast.info('Sincronização disponível apenas no app instalado.');
      return;
    }

    // Throttle
    if (!force) {
      try {
        const last = localStorage.getItem(SYNC_THROTTLE_KEY);
        if (last && Date.now() - parseInt(last, 10) < SYNC_THROTTLE_MS) {
          return;
        }
      } catch { /* ignore */ }
    }

    const hasPermissions = await this.checkPermissions();
    if (!hasPermissions) {
      if (!silent) toast.info('Autorize o acesso à saúde em Configurações > Conectar Dispositivos.');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        if (!silent) toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const result = await syncHealthData(token);

      if (result.success) {
        try { localStorage.setItem(SYNC_THROTTLE_KEY, String(Date.now())); } catch { /* ignore */ }
        if (!silent) toast.success(result.message);
      } else if (!silent) {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('[HealthService] sync error:', error);
      if (!silent) toast.error('Erro ao sincronizar dados de saúde.');
    }
  },
};
