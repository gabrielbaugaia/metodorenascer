import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente acessada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Erro 404</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço <span className="break-all font-medium text-foreground">{location.pathname}</span> não existe
          ou foi movido.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="min-h-11">
            <Link to="/dashboard">Ir para Hoje</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
