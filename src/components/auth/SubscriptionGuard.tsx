import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useEntitlements } from "@/hooks/useEntitlements";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionGuardProps {
  children: ReactNode;
}

/**
 * Protege rotas que requerem algum nível de acesso (trial ou full).
 * - Admins: acesso livre
 * - Full: acesso total
 * - Trial: acesso parcial (páginas controlam limites individualmente)
 * - None/bloqueado: redireciona para dashboard ou acesso-bloqueado
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { effectiveLevel, loading: entLoading } = useEntitlements();
  const [localBlocked, setLocalBlocked] = useState(false);
  const [localPending, setLocalPending] = useState(false);
  const [checkingLocal, setCheckingLocal] = useState(true);

  // Check for blocked/pending_payment in subscriptions table
  useEffect(() => {
    const checkLocal = async () => {
      if (!user) {
        setCheckingLocal(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("status, access_blocked")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.access_blocked === true) {
          setLocalBlocked(true);
        }
        if (data?.status === "pending_payment") {
          setLocalPending(true);
        }
      } catch (err) {
        console.error("Error checking local subscription:", err);
      } finally {
        setCheckingLocal(false);
      }
    };

    checkLocal();
  }, [user]);

  const isLoading = authLoading || subLoading || adminLoading || entLoading || checkingLocal;

  // Derived access states
  const hasAccess = effectiveLevel !== 'none' || subscribed;
  const hasFullAccess = effectiveLevel === 'full' || subscribed;
  const isTrial = effectiveLevel === 'trial_limited' && !subscribed;

  // Redirect: not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect: admin to admin panel
  useEffect(() => {
    if (!authLoading && !adminLoading && isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, authLoading, adminLoading, navigate]);

  // Redirect: blocked access
  useEffect(() => {
    if (isLoading || !user || isAdmin) return;

    if (localBlocked) {
      navigate("/acesso-bloqueado");
      return;
    }

    if (localPending && !subscribed) {
      navigate("/dashboard");
      return;
    }
  }, [isLoading, user, isAdmin, localBlocked, localPending, subscribed, navigate]);

  // Redirect: no access at all
  useEffect(() => {
    if (isLoading || !user || isAdmin || localBlocked) return;

    if (!hasAccess) {
      navigate("/dashboard");
    }
  }, [isLoading, user, isAdmin, localBlocked, hasAccess, navigate]);

  if (isLoading || !user) {
    return <FullPageLoader />;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  if (!hasAccess) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
