import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';

export type EffectiveAccessLevel = 'none' | 'trial_limited' | 'full';

export interface TrialUsage {
  used_workout: boolean;
  used_diet: boolean;
  used_mindset: boolean;
  used_recipe_count: number;
  used_support_count: number;
}

const DEFAULT_TRIAL_USAGE: TrialUsage = {
  used_workout: false,
  used_diet: false,
  used_mindset: false,
  used_recipe_count: 0,
  used_support_count: 0,
};

interface EntitlementRow {
  access_level: string;
  override_level: string | null;
  override_expires_at: string | null;
}

function computeEffectiveLevel(row: EntitlementRow | null): EffectiveAccessLevel {
  if (!row) return 'none';

  // Check override first
  if (row.override_level && row.override_expires_at) {
    const overrideExpires = new Date(row.override_expires_at);
    if (overrideExpires > new Date()) {
      return row.override_level as EffectiveAccessLevel;
    }
  }

  return (row.access_level as EffectiveAccessLevel) || 'none';
}

export interface UseEntitlementsReturn {
  effectiveLevel: EffectiveAccessLevel;
  isTrialing: boolean;
  isFull: boolean;
  isBlocked: boolean;
  trialUsage: TrialUsage;
  loading: boolean;
  markUsed: (field: keyof TrialUsage, increment?: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useEntitlements(): UseEntitlementsReturn {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [effectiveLevel, setEffectiveLevel] = useState<EffectiveAccessLevel>('none');
  const [trialUsage, setTrialUsage] = useState<TrialUsage>(DEFAULT_TRIAL_USAGE);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async () => {
    if (!user) {
      setEffectiveLevel('none');
      setTrialUsage(DEFAULT_TRIAL_USAGE);
      setLoading(false);
      return;
    }

    // Admins always have full access
    if (isAdmin) {
      setEffectiveLevel('full');
      setLoading(false);
      return;
    }

    try {
      // Fetch entitlement
      const { data: entitlement, error: entError } = await supabase
        .from('entitlements')
        .select('access_level, override_level, override_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (entError) {
        console.error('[useEntitlements] Error fetching entitlement:', entError);
      }

      const level = computeEffectiveLevel(entitlement);
      setEffectiveLevel(level);

      // If trialing, fetch trial usage
      if (level === 'trial_limited') {
        const { data: usage, error: usageError } = await supabase
          .from('trial_usage')
          .select('used_workout, used_diet, used_mindset, used_recipe_count, used_support_count')
          .eq('user_id', user.id)
          .maybeSingle();

        if (usageError) {
          console.error('[useEntitlements] Error fetching trial_usage:', usageError);
        }

        setTrialUsage(usage ? {
          used_workout: usage.used_workout ?? false,
          used_diet: usage.used_diet ?? false,
          used_mindset: usage.used_mindset ?? false,
          used_recipe_count: usage.used_recipe_count ?? 0,
          used_support_count: usage.used_support_count ?? 0,
        } : DEFAULT_TRIAL_USAGE);
      } else {
        setTrialUsage(DEFAULT_TRIAL_USAGE);
      }
    } catch (err) {
      console.error('[useEntitlements] Unexpected error:', err);
      setEffectiveLevel('none');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  const markUsed = useCallback(async (field: keyof TrialUsage, increment = false) => {
    if (!user || effectiveLevel !== 'trial_limited') return;

    try {
      const updateData: Record<string, unknown> = {};

      if (increment && (field === 'used_recipe_count' || field === 'used_support_count')) {
        updateData[field] = (trialUsage[field] as number) + 1;
      } else {
        updateData[field] = true;
      }

      const { error } = await supabase
        .from('trial_usage')
        .upsert({
          user_id: user.id,
          ...updateData,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('[useEntitlements] Error marking usage:', error);
        return;
      }

      // Update local state
      setTrialUsage(prev => ({
        ...prev,
        [field]: increment ? (prev[field] as number) + 1 : true,
      }));
    } catch (err) {
      console.error('[useEntitlements] Error in markUsed:', err);
    }
  }, [user, effectiveLevel, trialUsage]);

  return {
    effectiveLevel,
    isTrialing: effectiveLevel === 'trial_limited',
    isFull: effectiveLevel === 'full',
    isBlocked: effectiveLevel === 'none',
    trialUsage,
    loading,
    markUsed,
    refetch: fetchEntitlements,
  };
}
