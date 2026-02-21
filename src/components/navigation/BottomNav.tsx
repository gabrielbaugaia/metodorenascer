import { NavLink, useLocation } from "react-router-dom";
import { Flame, Dumbbell, Apple, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;

const navItems = [
  { icon: Flame, label: "Hoje", href: "/renascer" },
  { icon: Dumbbell, label: "Treino", href: "/treino" },
  { icon: Apple, label: "Nutrição", href: "/nutricao" },
  { icon: MessageCircle, label: "Suporte", href: "/suporte" },
  { icon: User, label: "Perfil", href: "/meu-perfil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={ICON_STROKE} />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
