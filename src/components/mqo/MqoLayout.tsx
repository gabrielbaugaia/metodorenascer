import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MqoLayoutProps {
  children: ReactNode;
}

export function MqoLayout({ children }: MqoLayoutProps) {
  return (
    <div className="min-h-dvh bg-white text-black">
      {/* Header */}
      <header className="border-b-2 border-[#FFC400] bg-black px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Link to="/admin" aria-label="Voltar ao painel"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="w-2 h-8 bg-[#FFC400] rounded-sm" />
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">MQO</h1>
            <p className="text-[#FFC400] text-xs font-medium tracking-widest uppercase">
              Laboratório de Prescrição
            </p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="app-content min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center">
        <p className="text-xs text-gray-400">
          MQO — Metodologia de Qualificação Operacional · Uso profissional
        </p>
      </footer>
    </div>
  );
}
