import { ReactNode } from "react";

interface MqoLayoutProps {
  children: ReactNode;
}

export function MqoLayout({ children }: MqoLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b-2 border-[#FFC400] bg-black px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
