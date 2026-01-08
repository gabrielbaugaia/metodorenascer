import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protege rotas que requerem apenas autenticação (sem verificar assinatura).
 * Usado para páginas como Dashboard e Anamnese.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
