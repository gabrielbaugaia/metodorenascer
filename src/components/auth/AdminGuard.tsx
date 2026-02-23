import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Protege rotas administrativas (/admin/*, /mqo).
 * Verifica autenticação + role admin via user_roles.
 * Redireciona para /acesso-bloqueado se não autorizado.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  const loading = authLoading || adminLoading;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/acesso-bloqueado");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user || !isAdmin) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
