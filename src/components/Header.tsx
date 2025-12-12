import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl text-gradient">METODO RENASCER</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Button variant="ghost" onClick={handleLogout} size="sm">
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Button variant="fire" size="sm" asChild>
                <Link to="/auth?mode=signup">Comecar Agora</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <Button variant="ghost" onClick={handleLogout} size="sm">
              Sair
            </Button>
          ) : (
            <Button variant="fire" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
