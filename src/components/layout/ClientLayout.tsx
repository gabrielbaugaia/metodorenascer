import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ClientSidebar />
        <main className="flex-1 overflow-auto">
          <div className="md:hidden fixed top-4 left-4 z-50">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
