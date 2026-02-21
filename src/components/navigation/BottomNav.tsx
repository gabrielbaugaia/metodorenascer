import { NavLink, useLocation } from "react-router-dom";
import { Flame, Dumbbell, Apple, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Flame, label: "Renascer", href: "/renascer" },
  { icon: Dumbbell, label: "Treino", href: "/treino" },
  { icon: Apple, label: "Nutrição", href: "/nutricao" },
  { icon: MessageCircle, label: "Suporte", href: "/suporte" },
  { icon: User, label: "Perfil", href: "/meu-perfil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}