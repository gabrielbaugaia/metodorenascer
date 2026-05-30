import { Health } from '@capgo/capacitor-health';
import { isNative } from '@/services/platform';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HealthData {
  steps?: number;
  calories?: number;
  heartRate?: number;
  sleep?: number;
  // Adicione outros tipos de dados de saúde conforme necessário
}

export const HealthService = {
  async isAvailable(): Promise<boolean> {
    if (!isNative) return false;
    try {
      const { available } = await Health.isAvailable();
      return available;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do Health:', error);
      return false;
    }
  },

  async requestPermissions(): Promise<boolean> {
    if (!isNative) return false;
    try {
      const { success } = await Health.requestAuthorization({
        read: ['steps', 'calories', 'heartRate', 'sleep'],
        write: [], // Por enquanto, apenas leitura
      });
      if (success) {
        toast.success('Permissões de saúde concedidas!');
      } else {
        toast.error('Permissões de saúde negadas.');
      }
      return success;
    } catch (error) {
      console.error('Erro ao solicitar permissões de saúde:', error);
      toast.error('Erro ao solicitar permissões de saúde.');
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    if (!isNative) return false;
    try {
      const { success } = await Health.checkAuthorization({
        read: ['steps', 'calories', 'heartRate', 'sleep'],
        write: [],
      });
      return success;
    } catch (error) {
      console.error('Erro ao verificar permissões de saúde:', error);
      return false;
    }
  },

  async readAndSyncDailyData(): Promise<void> {
    if (!isNative) {
      console.warn('HealthService: Não é uma plataforma nativa.');
      return;
    }

    const hasPermissions = await this.checkPermissions();
    if (!hasPermissions) {
      toast.info('Autorização de saúde necessária para sincronizar dados.');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const readOptions = {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        bucket: 'day',
      };

      const stepsData = await Health.queryAggregated({
        dataType: 'steps',
        ...readOptions,
      });
      const caloriesData = await Health.queryAggregated({
        dataType: 'calories',
        ...readOptions,
      });
      const heartRateData = await Health.queryAggregated({
        dataType: 'heartRate',
        ...readOptions,
      });
      const sleepData = await Health.queryAggregated({
        dataType: 'sleep',
        ...readOptions,
      });

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        console.error('Usuário não autenticado para sincronizar dados de saúde.');
        return;
      }

      const healthEntry = {
        user_id: userId,
        date: today.toISOString().split('T')[0],
        steps: stepsData.value[0]?.value || 0,
        calories: caloriesData.value[0]?.value || 0,
        heart_rate: heartRateData.value[0]?.value || 0,
        sleep: sleepData.value[0]?.value || 0,
        // Adicione outros campos conforme o schema do seu banco de dados
      };

      const { error } = await supabase.from('user_health_data').upsert(healthEntry, { onConflict: 'user_id,date' });

      if (error) {
        console.error('Erro ao sincronizar dados de saúde com o Supabase:', error);
        toast.error('Erro ao sincronizar dados de saúde.');
      } else {
        toast.success('Dados de saúde sincronizados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao ler e sincronizar dados de saúde:', error);
      toast.error('Erro ao ler e sincronizar dados de saúde.');
    }
  },
};
