import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminSupportNotifications } from "@/components/admin/AdminSupportNotifications";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Loader2, Menu } from "lucide-react";
import logoGb from "@/assets/logo-gb.png.asset.json";


interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-40 flex h-[calc(3.75rem+env(safe-area-inset-top))] items-center justify-between border-b border-sidebar-border bg-sidebar text-sidebar-foreground px-4 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                <Menu className="h-4 w-4" strokeWidth={1.4} />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <img src={logoGb.url} alt="Gabriel Baú" className="h-5 w-5 object-contain" />
                <span className="text-sm font-bold tracking-[0.08em] text-sidebar-foreground">GABRIEL BAÚ</span>
              </div>
            </div>
            {isAdmin && <AdminSupportNotifications />}
          </header>
          {/* Desktop admin notifications */}
          {isAdmin && (
            <div className="hidden md:flex absolute top-5 right-8 z-50">
              <AdminSupportNotifications />
            </div>
          )}
          <div className="px-5 py-7 md:px-12 md:py-12 lg:px-16 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-16 max-w-[1280px] mx-auto w-full">
            {children}
          </div>

        </main>
        {!isAdmin && <BottomNav />}
      </div>
    </SidebarProvider>
  );
}
