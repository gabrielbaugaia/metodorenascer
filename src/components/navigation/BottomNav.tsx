import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Flame,
  Dumbbell,
  Apple,
  MessageCircle,
  MoreHorizontal,
  X,
  Camera,
  Brain,
  ChefHat,
  HeartPulse,
  User,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;

const primaryNav = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: Dumbbell, label: "Treino", href: "/treino" },
  { icon: Apple, label: "Nutrição", href: "/nutricao" },
  { icon: Flame, label: "Hoje", href: "/renascer" },
];

const moreItems = [
  { icon: Camera, label: "Evolução", href: "/evolucao" },
  { icon: Brain, label: "Mindset", href: "/mindset" },
  { icon: ChefHat, label: "Receitas", href: "/receitas" },
  { icon: HeartPulse, label: "Aeróbico", href: "/cardio" },
  { icon: MessageCircle, label: "Suporte", href: "/suporte" },
  { icon: User, label: "Perfil", href: "/meu-perfil" },
];

export function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some((i) => location.pathname === i.href);

  return (
    <>
      {/* Overlay */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* "Mais" drawer — slides up from above the nav bar */}
      <div
        className={cn(
          "md:hidden fixed left-0 right-0 z-50 bg-background border-t border-border rounded-t-2xl shadow-xl transition-transform duration-200",
          moreOpen ? "translate-y-0" : "translate-y-full pointer-events-none",
        )}
        style={{ bottom: "3.5rem" }} // h-14 = 56px = 3.5rem
      >
        <div className="px-4 pt-3 pb-4">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground mb-3 uppercase">
            Mais módulos
          </p>
          <div className="grid grid-cols-3 gap-2">
            {moreItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={ICON_STROKE} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {primaryNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => moreOpen && setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={ICON_STROKE} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Mais button */}
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
              moreOpen || isMoreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {moreOpen ? (
              <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
            ) : (
              <MoreHorizontal className="h-5 w-5" strokeWidth={ICON_STROKE} />
            )}
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
