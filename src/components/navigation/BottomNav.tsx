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
  Play,
  Settings,
  NotebookPen,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;

/** Navegação principal — mesmos rótulos e destinos do menu lateral. */
const primaryNav = [
  { icon: Flame, label: "Hoje", href: "/dashboard" },
  { icon: Dumbbell, label: "Treino", href: "/treino" },
  { icon: Apple, label: "Nutrição", href: "/nutricao" },
  { icon: Camera, label: "Evolução", href: "/evolucao" },
];

const moreItems = [
  { icon: NotebookPen, label: "Diário", href: "/nutricao-diario" },
  { icon: HeartPulse, label: "Aeróbico", href: "/cardio" },
  { icon: ChefHat, label: "Receitas", href: "/receitas" },
  { icon: Play, label: "Vídeos", href: "/videos" },
  { icon: Brain, label: "Mindset", href: "/mindset" },
  { icon: Activity, label: "Painel", href: "/renascer" },
  { icon: MessageCircle, label: "Suporte", href: "/suporte" },
  { icon: User, label: "Perfil", href: "/meu-perfil" },
  { icon: Settings, label: "Ajustes", href: "/configuracoes" },
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
          className="md:hidden fixed inset-0 z-40 bg-sidebar/45"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* "Mais" drawer — slides up from above the nav bar */}
      <div
        className={cn(
          "md:hidden fixed left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-xl transition-transform duration-200",
          moreOpen ? "translate-y-0" : "translate-y-full pointer-events-none",
        )}
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        aria-hidden={!moreOpen}
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
                    "flex min-h-[60px] flex-col items-center justify-center gap-1.5 rounded-xl py-3 transition-colors duration-200",
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar text-sidebar-foreground border-t border-sidebar-border pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {primaryNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => moreOpen && setMoreOpen(false)}
                className={cn(
                  "flex h-full min-h-11 flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200",
                  isActive ? "text-primary" : "text-sidebar-foreground/55",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Mais button */}
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            aria-expanded={moreOpen}
            aria-label={moreOpen ? "Fechar mais módulos" : "Abrir mais módulos"}
            className={cn(
              "flex h-full min-h-11 flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200",
              moreOpen || isMoreActive ? "text-primary" : "text-sidebar-foreground/55",
            )}
          >
            {moreOpen ? (
              <X className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
            ) : (
              <MoreHorizontal className="h-5 w-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
            )}
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
