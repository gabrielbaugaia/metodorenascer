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
          <header className="md:hidden sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8">
                <Menu className="h-4 w-4" strokeWidth={1.5} />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="font-display text-sm text-foreground">RENASCER</span>
              </div>
            </div>
            {isAdmin && <AdminSupportNotifications />}
          </header>
          {/* Desktop admin notifications */}
          {isAdmin && (
            <div className="hidden md:flex absolute top-3 right-5 z-50">
              <AdminSupportNotifications />
            </div>
          )}
          <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-full">
            {children}
          </div>
        </main>
        {!isAdmin && <BottomNav />}
      </div>
    </SidebarProvider>
  );
}
