import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { 
  ModuleName, 
  ModuleAccess, 
  ModulesAccessMap,
  isAlwaysAccessible,
  calculateTrialDaysLeft,
  getAccessFromPlan
} from '@/lib/moduleAccess';

interface UseModuleAccessReturn {
  access: ModuleAccess | null;
  loading: boolean;
  hasFullAccess: boolean;
  hasAnyAccess: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  incrementUsage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useModuleAccess(module: ModuleName): UseModuleAccessReturn {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [access, setAccess] = useState<ModuleAccess | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    // Always accessible modules
    if (isAlwaysAccessible(module)) {
      setAccess({ level: 'full', limits: {} });
      setLoading(false);
      return;
    }

    // No user = no access
    if (!user) {
      setAccess({ level: 'none', limits: {} });
      setLoading(false);
      return;
    }

    // Admins have full access to everything
    if (isAdmin) {
      setAccess({ level: 'full', limits: {} });
      setLoading(false);
      return;
    }

    try {
      // 1. Check if user has an active subscription with commercial plan
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, commercial_plan_id, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'free'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscription?.commercial_plan_id) {
        // Fetch the commercial plan details
        const { data: plan } = await supabase
          .from('commercial_plans')
          .select('modules_access')
          .eq('id', subscription.commercial_plan_id)
          .single();

        if (plan?.modules_access) {
          const modulesAccess = plan.modules_access as unknown as ModulesAccessMap;
          const accessLevel = getAccessFromPlan(modulesAccess, module);
          
          setAccess({
            level: accessLevel,
            limits: {},
            isTrialing: subscription.status === 'trialing'
          });
          setLoading(false);
          return;
        }
      }

      // 2. Check if user has a subscription without commercial plan (legacy)
      // Give full access for legacy active subscriptions
      if (subscription && ['active', 'free'].includes(subscription.status || '')) {
        const notExpired = !subscription.current_period_end || 
          new Date(subscription.current_period_end) > new Date();
        
        if (notExpired) {
          setAccess({ level: 'full', limits: {} });
          setLoading(false);
          return;
        }
      }

      // 3. Check if user is in a trial campaign
      const { data: trialAccess } = await supabase
        .from('user_module_access')
        .select('*, trial_campaigns(*)')
        .eq('user_id', user.id)
        .eq('module', module)
        .maybeSingle();

      if (trialAccess) {
        const trialDaysLeft = calculateTrialDaysLeft(trialAccess.expires_at);
        const isExpired = trialAccess.expires_at && new Date(trialAccess.expires_at) < new Date();
        
        if (isExpired) {
          setAccess({ level: 'none', limits: {}, isTrialing: false, trialDaysLeft: 0 });
        } else {
          setAccess({
            level: trialAccess.access_level as 'full' | 'limited' | 'none',
            limits: (trialAccess.limits as Record<string, unknown>) || {},
            usageCount: trialAccess.usage_count || 0,
            expiresAt: trialAccess.expires_at,
            isTrialing: !!trialAccess.trial_campaign_id,
            trialDaysLeft
          });
        }
        setLoading(false);
        return;
      }

      // No access found
      setAccess({ level: 'none', limits: {} });
    } catch (error) {
      console.error('Error checking module access:', error);
      setAccess({ level: 'none', limits: {} });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, module]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const incrementUsage = useCallback(async () => {
    if (!user || !access?.isTrialing) return;

    try {
      await supabase
        .from('user_module_access')
        .update({ 
          usage_count: (access.usageCount || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('module', module);

      // Refetch to update local state
      await checkAccess();
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }, [user, access, module, checkAccess]);

  return {
    access,
    loading,
    hasFullAccess: access?.level === 'full',
    hasAnyAccess: access?.level === 'full' || access?.level === 'limited',
    isTrialing: access?.isTrialing || false,
    trialDaysLeft: access?.trialDaysLeft || 0,
    incrementUsage,
    refetch: checkAccess
  };
}

/**
 * Hook to get all module access at once (for sidebar/navigation)
 */
export function useAllModulesAccess() {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [accessMap, setAccessMap] = useState<Record<ModuleName, ModuleAccess>>({} as Record<ModuleName, ModuleAccess>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAllAccess = async () => {
      const modules: ModuleName[] = ['treino', 'nutricao', 'mindset', 'receitas', 'dashboard', 'checkins', 'suporte', 'protocolos'];
      const newAccessMap: Record<ModuleName, ModuleAccess> = {} as Record<ModuleName, ModuleAccess>;

      // Default: always accessible modules
      for (const mod of modules) {
        if (isAlwaysAccessible(mod)) {
          newAccessMap[mod] = { level: 'full', limits: {} };
        } else {
          newAccessMap[mod] = { level: 'none', limits: {} };
        }
      }

      if (!user) {
        setAccessMap(newAccessMap);
        setLoading(false);
        return;
      }

      // Admins have full access
      if (isAdmin) {
        for (const mod of modules) {
          newAccessMap[mod] = { level: 'full', limits: {} };
        }
        setAccessMap(newAccessMap);
        setLoading(false);
        return;
      }

      try {
        // Check subscription with commercial plan
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, commercial_plan_id, current_period_end')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'free'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscription?.commercial_plan_id) {
          const { data: plan } = await supabase
            .from('commercial_plans')
            .select('modules_access')
            .eq('id', subscription.commercial_plan_id)
            .single();

          if (plan?.modules_access) {
            const modulesAccess = plan.modules_access as unknown as ModulesAccessMap;
            for (const mod of modules) {
              if (!isAlwaysAccessible(mod)) {
                newAccessMap[mod] = {
                  level: getAccessFromPlan(modulesAccess, mod),
                  limits: {},
                  isTrialing: subscription.status === 'trialing'
                };
              }
            }
          }
        } else if (subscription && ['active', 'free'].includes(subscription.status || '')) {
          // Legacy subscription - full access
          const notExpired = !subscription.current_period_end || 
            new Date(subscription.current_period_end) > new Date();
          
          if (notExpired) {
            for (const mod of modules) {
              newAccessMap[mod] = { level: 'full', limits: {} };
            }
          }
        } else {
          // Check trial access
          const { data: trialAccesses } = await supabase
            .from('user_module_access')
            .select('module, access_level, limits, usage_count, expires_at, trial_campaign_id')
            .eq('user_id', user.id);

          if (trialAccesses) {
            for (const ta of trialAccesses) {
              const mod = ta.module as ModuleName;
              const isExpired = ta.expires_at && new Date(ta.expires_at) < new Date();
              
              if (!isExpired) {
                newAccessMap[mod] = {
                  level: ta.access_level as 'full' | 'limited' | 'none',
                  limits: (ta.limits as Record<string, unknown>) || {},
                  usageCount: ta.usage_count || 0,
                  expiresAt: ta.expires_at,
                  isTrialing: !!ta.trial_campaign_id,
                  trialDaysLeft: calculateTrialDaysLeft(ta.expires_at)
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking all module access:', error);
      }

      setAccessMap(newAccessMap);
      setLoading(false);
    };

    checkAllAccess();
  }, [user, isAdmin]);

  return { accessMap, loading };
}
