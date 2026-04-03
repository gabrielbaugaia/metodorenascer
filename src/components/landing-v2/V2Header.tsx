import { useEffect, useState } from "react";

const navLinks = [
  { label: "Sistema", href: "#v2-sistema" },
  { label: "Planos", href: "#v2-preco" },
  { label: "Prevenção", href: "#v2-deteccao" },
  { label: "FAQ", href: "#v2-faq" },
];

export function V2Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between bg-background/[.88] backdrop-blur-[24px] border-b border-border transition-all duration-300 ${scrolled ? "px-7 md:px-[60px] py-3.5" : "px-7 md:px-[60px] py-5"}`}>
      <div className="font-display-v2 text-[22px] tracking-[4px] text-foreground">
        RENASCER<span className="text-primary">.</span>
      </div>

      <div className="hidden md:flex gap-9">
        {navLinks.map((l) => (
          <a key={l.label} href={l.href} className="font-mono-v2 text-[10px] tracking-[2.5px] uppercase text-muted-foreground hover:text-primary transition-colors">
            {l.label}
          </a>
        ))}
      </div>

      <a href="#v2-preco" className="font-mono-v2 text-[10px] tracking-[2px] uppercase bg-primary text-primary-foreground px-6 py-2.5 hover:bg-primary/80 transition-colors">
        Ver Planos
      </a>
    </nav>
  );
}
