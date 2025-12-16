import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Menu, Flame } from "lucide-react";

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading } = useAuth();
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
          <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4">
            <SidebarTrigger className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="font-display text-lg text-gradient">RENASCER</span>
            </div>
          </header>
          <div className="p-4 md:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
