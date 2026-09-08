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
  MessageSquare,
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
  Play,
  NotebookPen,
  Activity,
} from "lucide-react";
import { ENABLE_HEALTH_METRICS } from "@/lib/healthConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.4;

const navItemClass =
  "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200";
const navActive = "bg-sidebar-accent text-sidebar-foreground";
const navIdle = "text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground";


const clientPrimaryItems = [
  { title: "Hoje", url: "/dashboard", icon: Flame },
  { title: "Treino", url: "/treino", icon: Dumbbell },
  { title: "Nutrição", url: "/nutricao", icon: Apple },
  { title: "Evolução", url: "/evolucao", icon: Camera },
  { title: "Aeróbico", url: "/cardio", icon: HeartPulse },
];

const clientContentItems = [
  { title: "Receitas", url: "/receitas", icon: ChefHat },
  { title: "Vídeos", url: "/videos", icon: Play },
  { title: "Mindset", url: "/mindset", icon: Brain },
];

const clientMoreItems = [
  { title: "Diário nutricional", url: "/nutricao-diario", icon: NotebookPen },
  { title: "Painel de dados", url: "/renascer", icon: Activity },
  { title: "Meu Perfil", url: "/meu-perfil", icon: User },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Suporte", url: "/suporte", icon: MessageCircle },
  { title: "Assinatura", url: "/assinatura", icon: CreditCard },
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
      { title: "Leads do Quiz", url: "/admin/leads-quiz", icon: Target },
    ],
  },
  {
    label: "CONTEÚDO",
    items: [
      { title: "Biblioteca de Vídeos", url: "/admin/videos", icon: Video },
      { title: "Biblioteca de GIFs", url: "/admin/gifs", icon: ImageIcon },
      { title: "Reels", url: "/admin/reels", icon: Play },
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
      { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageSquare },
      { title: "Documentação", url: "/admin/docs/conector-mobile", icon: BookOpen },
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
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-[264px]"
      )}
      collapsible="icon"
    >
      {/* Desktop header */}
      <div className="hidden md:flex h-24 items-center justify-between border-b border-sidebar-border px-5">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img src="/favicon.png" alt="Gabriel Baú" className="h-7 w-7 object-contain shrink-0" />
            <span className="flex flex-col min-w-0">
              <span className="text-[15px] font-bold tracking-[0.08em] leading-tight text-sidebar-foreground truncate">
                {isAdmin ? "PAINEL" : "GABRIEL BAÚ"}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
                {isAdmin ? "ADMINISTRAÇÃO" : "CONSULTORIA"}
              </span>
            </span>
          </div>
        )}
        <SidebarTrigger className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
      </div>

      {/* Mobile header inside sheet */}
      <div className="md:hidden flex h-16 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="Gabriel Baú" className="h-6 w-6 object-contain" />
          <span className="text-sm font-bold tracking-[0.08em] text-sidebar-foreground">{isAdmin ? "PAINEL" : "GABRIEL BAÚ"}</span>
        </div>
      </div>

      <SidebarContent className="px-3 py-5">
        {/* Client menu */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={cn("px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40", collapsed && "sr-only")}>
              Acompanhamento
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {clientMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink to={item.url} className={cn(navItemClass, isActive(item.url) ? navActive : navIdle)}>
                        {isActive(item.url) && (
                          <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-primary" />
                        )}
                        <item.icon
                          className={cn("h-[17px] w-[17px] shrink-0", isActive(item.url) ? "text-primary" : "text-current opacity-70")}
                          strokeWidth={ICON_STROKE}
                        />
                        {!collapsed && <span className="truncate">{item.title}</span>}
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
            <SidebarGroupLabel className={cn("px-2 mb-2 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40", collapsed && "sr-only")}>
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink to={item.url} className={cn(navItemClass, isActive(item.url) ? navActive : navIdle)}>
                        {isActive(item.url) && (
                          <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-primary" />
                        )}
                        <item.icon
                          className={cn("h-[17px] w-[17px] shrink-0", isActive(item.url) ? "text-primary" : "text-current opacity-70")}
                          strokeWidth={ICON_STROKE}
                        />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Logout */}
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Sair"
                className="min-h-11 px-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
              >
                <LogOut className="h-[17px] w-[17px] shrink-0 opacity-70" strokeWidth={ICON_STROKE} />
                {!collapsed && <span className="text-[13px]">Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

