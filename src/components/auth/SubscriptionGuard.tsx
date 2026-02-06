import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionGuardProps {
  children: ReactNode;
}

interface LocalSubscriptionState {
  hasSubscription: boolean;
  isBlocked: boolean;
  isPendingPayment: boolean;
  pendingPlanType?: string;
}

/**
 * Protege rotas que requerem assinatura ativa.
 * Usuários sem assinatura são redirecionados para o Dashboard (que mostra planos).
 * Admins têm acesso livre.
 * Usuários com plano free (criado pelo admin) têm acesso.
 * Usuários com acesso bloqueado são redirecionados para página de bloqueio.
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [localState, setLocalState] = useState<LocalSubscriptionState | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(true);

  // Check local subscription in database (for admin-created free plans and trial users)
  useEffect(() => {
    const checkLocalSubscription = async () => {
      if (!user) {
        setCheckingLocal(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status, current_period_end, access_blocked, plan_type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error checking local subscription:", error);
          // Don't give up yet — check trial access below
        } else if (data) {
          // Check if access is blocked (for expired free plans)
          const isBlocked = data.access_blocked === true;
          
          // Check if pending payment (invited but not paid yet)
          const isPendingPayment = data.status === "pending_payment";
          
          if (isBlocked) {
            setLocalState({ hasSubscription: false, isBlocked: true, isPendingPayment: false });
            setCheckingLocal(false);
            return;
          } else if (isPendingPayment) {
            setLocalState({ 
              hasSubscription: false, 
              isBlocked: false, 
              isPendingPayment: true,
              pendingPlanType: data.plan_type || undefined
            });
            setCheckingLocal(false);
            return;
          } else {
            // Check if subscription is still valid
            const isActive = data.status === "active" || data.status === "trialing" || data.status === "free";
            const notExpired = !data.current_period_end || new Date(data.current_period_end) > new Date();
            if (isActive && notExpired) {
              setLocalState({ hasSubscription: true, isBlocked: false, isPendingPayment: false });
              setCheckingLocal(false);
              return;
            }
          }
        }

        // 3. Check if user has trial access (user_module_access) — allows trial users through
        const { data: trialAccess } = await supabase
          .from("user_module_access")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (trialAccess) {
          setLocalState({ hasSubscription: true, isBlocked: false, isPendingPayment: false });
        } else {
          setLocalState({ hasSubscription: false, isBlocked: false, isPendingPayment: false });
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
        setLocalState({ hasSubscription: false, isBlocked: false, isPendingPayment: false });
      } finally {
        setCheckingLocal(false);
      }
    };

    checkLocalSubscription();
  }, [user]);

  // Derive values from state
  const hasLocalSubscription = localState?.hasSubscription ?? false;
  const isBlocked = localState?.isBlocked ?? false;
  const isPendingPayment = localState?.isPendingPayment ?? false;
  const pendingPlanType = localState?.pendingPlanType;

  const isLoading = authLoading || subLoading || adminLoading || checkingLocal;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect admins to admin panel
  useEffect(() => {
    if (!authLoading && !adminLoading && isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, authLoading, adminLoading, navigate]);

  // Redirect to blocked page if access is blocked
  useEffect(() => {
    if (isLoading || !user || isAdmin) return;

    if (isBlocked) {
      navigate("/acesso-bloqueado");
      return;
    }

    // Redirect to payment if pending payment
    // BUT: if Stripe says subscribed, don't redirect (local DB might be outdated)
    if (isPendingPayment && !subscribed) {
      // Navigate to dashboard which will show the payment required message
      navigate("/dashboard");
      return;
    }
  }, [isLoading, user, isAdmin, isBlocked, isPendingPayment, subscribed, navigate]);

  // Redirect to dashboard (plan selection) if no subscription
  useEffect(() => {
    if (isLoading || !user || isAdmin || isBlocked) return;

    const hasAccess = subscribed || hasLocalSubscription;
    
    if (!hasAccess) {
      navigate("/dashboard");
    }
  }, [isLoading, user, isAdmin, isBlocked, subscribed, hasLocalSubscription, navigate]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Don't render children if no access
  if (!user) {
    return <FullPageLoader />;
  }

  // Admins always have access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check subscription access
  const hasAccess = subscribed || hasLocalSubscription;
  
  if (!hasAccess) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
