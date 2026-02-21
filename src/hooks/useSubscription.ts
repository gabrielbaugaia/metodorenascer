import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStoredUtmData } from "@/hooks/useAnalytics";

interface SubscriptionStatus {
  subscribed: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    subscriptionEnd: null,
    productId: null,
    loading: true,
    error: null,
  });

  const deriveSubscribedFromLocal = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, access_blocked, plan_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const isBlocked = data?.access_blocked === true;
      const isActive =
        data?.status === "active" || data?.status === "trialing" || data?.status === "free";
      const notExpired = !data?.current_period_end || new Date(data.current_period_end) > new Date();

      return {
        subscribed: !!data && !isBlocked && isActive && notExpired,
        subscriptionEnd: data?.current_period_end ?? null,
        productId: null,
        planType: data?.plan_type ?? null,
      };
    },
    [],
  );

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      console.warn("[useSubscription] Missing access token; skipping check-subscription");
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      console.log("[useSubscription] Invoking check-subscription", { userId: user?.id });

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      console.log("[useSubscription] check-subscription response", data);

      setStatus({
        subscribed: data.subscribed || false,
        subscriptionEnd: data.subscription_end || null,
        productId: data.product_id || null,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("[useSubscription] Error invoking check-subscription:", err);

      // Fallback: rely on local DB state (covers free/manual plans and reduces impact of function/network issues)
      try {
        if (user?.id) {
          const fallback = await deriveSubscribedFromLocal(user.id);
          console.log("[useSubscription] Fallback local subscription result", fallback);
          setStatus({
            subscribed: fallback.subscribed,
            subscriptionEnd: fallback.subscriptionEnd,
            productId: null,
            loading: false,
            error: null,
          });
          return;
        }
      } catch (fallbackErr) {
        console.error("[useSubscription] Local fallback also failed:", fallbackErr);
      }

      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to check subscription",
      }));
    }
  }, [session?.access_token, user?.id, deriveSubscribedFromLocal]);

  const createCheckout = useCallback(async (priceId?: string, applyReferralDiscount?: boolean) => {
    // Allow checkout for both authenticated and guest users
    const headers: Record<string, string> = {};
    
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Get UTM data to pass to checkout for attribution
    const utmData = getStoredUtmData();

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers,
      body: { 
        price_id: priceId,
        apply_referral_discount: applyReferralDiscount ?? false,
        utm_data: utmData || {}
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
    
    return data;
  }, [session?.access_token]);

  const openCustomerPortal = useCallback(async () => {
    if (!session?.access_token) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
    
    return data;
  }, [session?.access_token]);

  const checkedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (user && session?.access_token) {
      // Only call check-subscription once per user (skip token refreshes)
      if (checkedForUser.current !== user.id) {
        checkedForUser.current = user.id;
        checkSubscription();
      }
    } else if (!user) {
      checkedForUser.current = null;
      setStatus({
        subscribed: false,
        subscriptionEnd: null,
        productId: null,
        loading: false,
        error: null,
      });
    }
  }, [user?.id, session?.access_token, checkSubscription]);

  // Removed 60s polling - subscription status is checked on mount and on user action

  return {
    ...status,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
