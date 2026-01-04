import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Convite from "./pages/Convite";
import Dashboard from "./pages/Dashboard";
import Anamnese from "./pages/Anamnese";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Treino from "./pages/Treino";
import Nutricao from "./pages/Nutricao";
import Mindset from "./pages/Mindset";
import Receitas from "./pages/Receitas";
import Evolucao from "./pages/Evolucao";
import NotFound from "./pages/NotFound";
import AreaCliente from "./pages/AreaCliente";
import Protocolos from "./pages/Protocolos";
import Suporte from "./pages/Suporte";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminClienteDetalhes from "./pages/admin/AdminClienteDetalhes";
import AdminCriarCliente from "./pages/admin/AdminCriarCliente";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminSuporteChats from "./pages/admin/AdminSuporteChats";
import AdminMensagens from "./pages/admin/AdminMensagens";
import AdminVideos from "./pages/admin/AdminVideos";
import MeuPerfil from "./pages/MeuPerfil";
import Indicacoes from "./pages/Indicacoes";
import RedefinirSenha from "./pages/RedefinirSenha";
import Assinatura from "./pages/Assinatura";
import AdminPlanosVenda from "./pages/admin/AdminPlanosVenda";
import AdminMetricas from "./pages/admin/AdminMetricas";
import AdminConvites from "./pages/admin/AdminConvites";
import AdminLeads from "./pages/admin/AdminLeads";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsProvider>
          <Routes>
            {/* LANÇAMENTO OFICIAL ATIVO */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/entrar" element={<Auth />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/convite" element={<Convite />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/anamnese" element={<Anamnese />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/treino" element={<Treino />} />
            <Route path="/nutricao" element={<Nutricao />} />
            <Route path="/mindset" element={<Mindset />} />
            <Route path="/evolucao" element={<Evolucao />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/area-cliente" element={<AreaCliente />} />
            <Route path="/protocolos" element={<Protocolos />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/meu-perfil" element={<MeuPerfil />} />
            <Route path="/indicacoes" element={<Indicacoes />} />
            <Route path="/assinatura" element={<Assinatura />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/clientes/:id" element={<AdminClienteDetalhes />} />
            <Route path="/admin/criar-cliente" element={<AdminCriarCliente />} />
            <Route path="/admin/planos" element={<AdminPlanos />} />
            <Route path="/admin/suporte" element={<AdminSuporteChats />} />
            <Route path="/admin/mensagens" element={<AdminMensagens />} />
            <Route path="/admin/videos" element={<AdminVideos />} />
            <Route path="/admin/planos-venda" element={<AdminPlanosVenda />} />
            <Route path="/admin/metricas" element={<AdminMetricas />} />
            <Route path="/admin/convites" element={<AdminConvites />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
