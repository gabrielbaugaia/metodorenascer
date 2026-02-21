import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Dumbbell, 
  Apple, 
  Brain, 
  ChefHat, 
  MessageCircle, 
  User, 
  CreditCard,
  LogOut,
  Shield,
  Flame,
  FileText,
  HelpCircle,
  Bell,
  Gift,
  Video,
  ImageIcon,
  Mail,
  BarChart3,
  Target,
  Camera,
  Settings,
  PenSquare,
  HeartPulse
} from "lucide-react";
import { ENABLE_HEALTH_METRICS } from "@/lib/healthConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { cn } from "@/lib/utils";

const clientMenuItems = [
  { title: "Renascer", url: "/renascer", icon: Flame },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Meu Perfil", url: "/meu-perfil", icon: User },
  { title: "Evolução", url: "/evolucao", icon: Camera },
  { title: "Treino", url: "/treino", icon: Dumbbell },
  { title: "Nutrição", url: "/nutricao", icon: Apple },
  { title: "Mindset", url: "/mindset", icon: Brain },
  { title: "Receitas", url: "/receitas", icon: ChefHat },
  { title: "Suporte", url: "/suporte", icon: MessageCircle },
  { title: "Assinatura", url: "/assinatura", icon: CreditCard },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  ...(ENABLE_HEALTH_METRICS ? [{ title: "Dados do Corpo", url: "/dados-corpo", icon: HeartPulse }] : []),
];

const adminMenuItems = [
  { title: "Dashboard Admin", url: "/admin", icon: Shield },
  { title: "Clientes", url: "/admin/clientes", icon: User },
  { title: "Criar Cliente", url: "/admin/criar-cliente", icon: User },
  { title: "Enviar Convite", url: "/admin/convites", icon: Mail },
  { title: "Leads", url: "/admin/leads", icon: Target },
  { title: "Protocolos", url: "/admin/planos", icon: FileText },
  { title: "Planos de Venda", url: "/admin/planos-venda", icon: CreditCard },
  { title: "Blog", url: "/admin/blog", icon: PenSquare },
  { title: "Banco de Vídeos", url: "/admin/videos", icon: Video },
  { title: "Banco de GIFs", url: "/admin/gifs", icon: ImageIcon },
  { title: "Métricas", url: "/admin/metricas", icon: BarChart3 },
  { title: "Mensagens Auto", url: "/admin/mensagens", icon: Bell },
  { title: "Suporte Chats", url: "/admin/suporte", icon: MessageCircle },
  { title: "Planos Comerciais", url: "/admin/commercial-plans", icon: CreditCard },
  { title: "Campanhas Trial", url: "/admin/trial-campaigns", icon: Gift },
];

export function ClientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      className={cn(
        "border-r border-border/50 bg-background/95 backdrop-blur-sm transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Header only visible on desktop */}
      <div className="hidden md:flex h-16 items-center justify-between border-b border-border/50 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-display text-lg text-gradient">RENASCER</span>
          </div>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>
      {/* Mobile header inside sheet */}
      <div className="md:hidden flex h-14 items-center border-b border-border/50 px-4">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" />
          <span className="font-display text-lg text-gradient">RENASCER</span>
        </div>
      </div>

      <SidebarContent className="px-2 py-4">
        {/* Menu do Cliente - apenas para não-admins */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          isActive(item.url) 
                            ? "bg-primary/20 text-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menu Admin - apenas para admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
              Painel Administrativo
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          isActive(item.url) 
                            ? "bg-primary/20 text-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto pt-4 border-t border-border/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Sair"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
