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
  Video,
  ImageIcon,
  Mail,
  BarChart3,
  Target,
  Camera,
  Settings,
  PenSquare,
  HeartPulse,
  Gift,
  Bell,
  BookOpen,
} from "lucide-react";
import { ENABLE_HEALTH_METRICS } from "@/lib/healthConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;

const clientMenuItems = [
  { title: "Hoje", url: "/renascer", icon: Flame },
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
];

interface AdminSection {
  label: string;
  items: { title: string; url: string; icon: typeof Home }[];
}

const adminSections: AdminSection[] = [
  {
    label: "CLIENTES",
    items: [
      { title: "Dashboard", url: "/admin", icon: Shield },
      { title: "Clientes", url: "/admin/clientes", icon: User },
      { title: "Leads", url: "/admin/leads", icon: Target },
    ],
  },
  {
    label: "CONTEÚDO",
    items: [
      { title: "Biblioteca de Vídeos", url: "/admin/videos", icon: Video },
      { title: "Biblioteca de GIFs", url: "/admin/gifs", icon: ImageIcon },
      { title: "Blog", url: "/admin/blog", icon: PenSquare },
    ],
  },
  {
    label: "VENDAS",
    items: [
      { title: "Planos", url: "/admin/commercial-plans", icon: CreditCard },
      { title: "Campanhas Trial", url: "/admin/trial-campaigns", icon: Gift },
      { title: "Métricas", url: "/admin/metricas", icon: BarChart3 },
    ],
  },
  {
    label: "AUTOMAÇÕES",
    items: [
      { title: "Mensagens Automáticas", url: "/admin/mensagens", icon: Bell },
    ],
  },
  {
    label: "SUPORTE",
    items: [
      { title: "Chats", url: "/admin/suporte", icon: MessageCircle },
      { title: "Documentação", url: "/admin/conector-mobile", icon: BookOpen },
    ],
  },
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
        "border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-[260px]"
      )}
      collapsible="icon"
    >
      {/* Desktop header */}
      <div className="hidden md:flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <Flame className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
            <span className="font-display text-sm tracking-wide text-foreground">
              {isAdmin ? "Painel Admin" : "RENASCER"}
            </span>
          </div>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      {/* Mobile header inside sheet */}
      <div className="md:hidden flex h-14 items-center border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <Flame className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
          <span className="font-display text-sm tracking-wide text-foreground">
            {isAdmin ? "Painel Admin" : "RENASCER"}
          </span>
        </div>
      </div>

      <SidebarContent className="px-2 py-3">
        {/* Client menu */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={cn("text-[10px] tracking-widest text-muted-foreground font-medium", collapsed && "sr-only")}>
              MENU
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive(item.url)
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {isActive(item.url) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={ICON_STROKE} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin menu with sections */}
        {isAdmin && adminSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className={cn("text-[10px] tracking-widest text-muted-foreground font-medium mt-2", collapsed && "sr-only")}>
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive(item.url)
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {isActive(item.url) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={ICON_STROKE} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Logout */}
        <div className="mt-auto pt-3 border-t border-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Sair"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={ICON_STROKE} />
                {!collapsed && <span className="text-sm">Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
