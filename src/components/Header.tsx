import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  const handleLogoClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md border-b border-border' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button onClick={handleLogoClick} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-lg md:text-xl text-foreground tracking-wider">RENASCER</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/#metodologia" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              Metodologia
            </a>
            <a href="/#preco" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              Planos
            </a>
            <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
              Blog
            </Link>
            {user && (
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                Dashboard
              </Link>
            )}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                size="sm"
                className="border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50"
              >
                Sair
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">ENTRAR</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a 
                href="/#metodologia" 
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Metodologia
              </a>
              <a 
                href="/#preco" 
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Planos
              </a>
              <Link 
                to="/blog" 
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                    size="sm" 
                    className="w-full border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" asChild className="w-full">
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>ENTRAR</Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
