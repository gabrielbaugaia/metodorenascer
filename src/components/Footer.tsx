import { forwardRef } from "react";
import { Flame } from "lucide-react";
import { APP_VERSION, getSWVersion } from "@/lib/appVersion";
export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return <footer ref={ref} className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-xl text-foreground tracking-wider">RENASCER</span>
          </div>

          {/* Creator */}
          <div className="text-center md:text-left">
            <p className="text-foreground font-semibold text-right">SISTEM INTELIGENCE PERFORMAN</p>
            <p className="text-muted-foreground text-sm">Corpo & Mente.</p>
          </div>

          {/* WhatsApp Icon */}
          
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center space-y-2">
          <p className="text-muted-foreground text-sm">2026 Metodo Renascer. Todos os direitos reservados.

        </p>
          <p className="text-muted-foreground/60 text-xs">
            v{APP_VERSION} • SW {getSWVersion()}
          </p>
        </div>
      </div>
    </footer>;
});
Footer.displayName = "Footer";