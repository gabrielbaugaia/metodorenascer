import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Sistema", href: "#v2-sistema" },
  { label: "Planos", href: "#v2-preco" },
  { label: "Prevenção", href: "#v2-deteccao" },
  { label: "FAQ", href: "#v2-faq" },
  { label: "Blog", href: "/blog", isRoute: true },
];

export function V2Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    navigate("/");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between bg-background/[.88] backdrop-blur-[24px] border-b border-border transition-all duration-300 ${
          scrolled ? "px-5 md:px-[60px] py-3" : "px-5 md:px-[60px] py-4"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" onClick={closeMobile}>
          <div className="w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display-v2 text-[20px] tracking-[3px] text-foreground">
            RENASCER<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-9">
          {navLinks.map((l) =>
            l.isRoute ? (
              <Link key={l.label} to={l.href} className="font-mono-v2 text-[10px] tracking-[2.5px] uppercase text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="font-mono-v2 text-[10px] tracking-[2.5px] uppercase text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </a>
            )
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="font-mono-v2 text-[10px] tracking-[2px] uppercase text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="font-mono-v2 text-[10px] tracking-[2px] uppercase bg-primary text-primary-foreground px-6 py-2.5 hover:bg-primary/80 transition-colors">
                Sair
              </button>
            </>
          ) : (
            <Link to="/auth" className="font-mono-v2 text-[10px] tracking-[2px] uppercase bg-primary text-primary-foreground px-6 py-2.5 hover:bg-primary/80 transition-colors">
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-foreground p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99] bg-background/95 backdrop-blur-md pt-20 px-7 flex flex-col gap-6 animate-fade-in">
          {[
            { label: "Metodologia", href: "#v2-sistema" },
            { label: "Planos", href: "#v2-preco" },
            { label: "Blog", href: "/blog", isRoute: true },
          ].map((l) =>
            l.isRoute ? (
              <Link key={l.label} to={l.href} onClick={closeMobile} className="font-mono-v2 text-[12px] tracking-[3px] uppercase text-muted-foreground hover:text-primary transition-colors py-3 border-b border-border">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} onClick={closeMobile} className="font-mono-v2 text-[12px] tracking-[3px] uppercase text-muted-foreground hover:text-primary transition-colors py-3 border-b border-border">
                {l.label}
              </a>
            )
          )}

          <div className="mt-4">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link to="/dashboard" onClick={closeMobile} className="font-mono-v2 text-[12px] tracking-[2px] uppercase text-center bg-primary text-primary-foreground py-4 hover:bg-primary/80 transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="font-mono-v2 text-[12px] tracking-[2px] uppercase text-center border border-border text-muted-foreground py-4 hover:text-primary transition-colors">
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/auth" onClick={closeMobile} className="block font-mono-v2 text-[12px] tracking-[2px] uppercase text-center bg-primary text-primary-foreground py-4 hover:bg-primary/80 transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
