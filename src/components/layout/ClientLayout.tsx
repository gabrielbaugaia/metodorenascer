import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminSupportNotifications } from "@/components/admin/AdminSupportNotifications";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Loader2, Menu, Flame } from "lucide-react";

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          {/* Mobile Header with menu trigger */}
          <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <span className="font-display text-lg text-gradient">RENASCER</span>
              </div>
            </div>
            {isAdmin && <AdminSupportNotifications />}
          </header>
          {/* Desktop admin notifications */}
          {isAdmin && (
            <div className="hidden md:flex absolute top-4 right-6 z-50">
              <AdminSupportNotifications />
            </div>
          )}
          <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-full">
            {children}
          </div>
        </main>
        {/* Bottom navigation for mobile - only for clients */}
        {!isAdmin && <BottomNav />}
      </div>
    </SidebarProvider>
  );
}
