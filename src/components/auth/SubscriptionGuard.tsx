import { ReactNode, useEffect, useRef, useState } from "react";
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
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);
  const [checkingLocal, setCheckingLocal] = useState(true);
  const accessVerified = useRef(false);
  const verifiedUserId = useRef<string | null>(null);

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
          .select("status, access_blocked, blocked_reason")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.access_blocked === true) {
          setLocalBlocked(true);
          setBlockedReason(data.blocked_reason ?? null);
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
      const isFreeExpired = blockedReason?.toLowerCase().includes("30 dias");
      const reason = isFreeExpired ? "free_expired_30d" : "inactivity";
      navigate(`/acesso-bloqueado?reason=${reason}`);
      return;
    }

    if (localPending && !subscribed) {
      navigate("/dashboard");
      return;
    }
  }, [isLoading, user, isAdmin, localBlocked, blockedReason, localPending, subscribed, navigate]);

  // Redirect: no access at all
  useEffect(() => {
    if (isLoading || !user || isAdmin || localBlocked) return;

    if (!hasAccess) {
      navigate("/dashboard");
    }
  }, [isLoading, user, isAdmin, localBlocked, hasAccess, navigate]);

  // Reset verified cache if user changes
  if (user?.id !== verifiedUserId.current) {
    accessVerified.current = false;
    verifiedUserId.current = user?.id ?? null;
  }

  // Cache: if already verified for this user, skip loader on re-renders
  if (accessVerified.current && user) {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return <FullPageLoader />;
  }

  if (isAdmin) {
    accessVerified.current = true;
    return <>{children}</>;
  }

  if (!hasAccess) {
    return <FullPageLoader />;
  }

  // Mark as verified so subsequent re-renders skip the loader
  accessVerified.current = true;
  return <>{children}</>;
}
