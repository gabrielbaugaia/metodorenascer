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

/**
 * Protege rotas que requerem assinatura ativa.
 * Usuários sem assinatura são redirecionados para o Dashboard (que mostra planos).
 * Admins têm acesso livre.
 * Usuários com plano free (criado pelo admin) têm acesso.
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [hasLocalSubscription, setHasLocalSubscription] = useState<boolean | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(true);

  // Check local subscription in database (for admin-created free plans)
  useEffect(() => {
    const checkLocalSubscription = async () => {
      if (!user) {
        setCheckingLocal(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing", "free"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error checking local subscription:", error);
          setHasLocalSubscription(false);
        } else if (data) {
          // Check if subscription is still valid
          const isActive = data.status === "active" || data.status === "trialing" || data.status === "free";
          const notExpired = !data.current_period_end || new Date(data.current_period_end) > new Date();
          setHasLocalSubscription(isActive && notExpired);
        } else {
          setHasLocalSubscription(false);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
        setHasLocalSubscription(false);
      } finally {
        setCheckingLocal(false);
      }
    };

    checkLocalSubscription();
  }, [user]);

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

  // Redirect to dashboard (plan selection) if no subscription
  useEffect(() => {
    if (isLoading || !user || isAdmin) return;

    const hasAccess = subscribed || hasLocalSubscription;
    
    if (!hasAccess) {
      navigate("/dashboard");
    }
  }, [isLoading, user, isAdmin, subscribed, hasLocalSubscription, navigate]);

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
