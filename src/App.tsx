// Force deploy v2
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
import AdminExerciseGifs from "./pages/admin/AdminExerciseGifs";
import MeuPerfil from "./pages/MeuPerfil";
import Indicacoes from "./pages/Indicacoes";
import RedefinirSenha from "./pages/RedefinirSenha";
import Assinatura from "./pages/Assinatura";
import Configuracoes from "./pages/Configuracoes";
import AdminPlanosVenda from "./pages/admin/AdminPlanosVenda";
import AdminMetricas from "./pages/admin/AdminMetricas";
import AdminConvites from "./pages/admin/AdminConvites";
import AdminLeads from "./pages/admin/AdminLeads";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";
import AcessoBloqueado from "./pages/AcessoBloqueado";

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
            {/* ROTAS PÚBLICAS */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/entrar" element={<Auth />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/convite" element={<Convite />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/acesso-bloqueado" element={<AcessoBloqueado />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* ROTAS QUE REQUEREM APENAS AUTENTICAÇÃO (mostram planos se sem assinatura) */}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/anamnese" element={<AuthGuard><Anamnese /></AuthGuard>} />

            {/* ROTAS QUE REQUEREM ASSINATURA ATIVA */}
            <Route path="/treino" element={<SubscriptionGuard><Treino /></SubscriptionGuard>} />
            <Route path="/nutricao" element={<SubscriptionGuard><Nutricao /></SubscriptionGuard>} />
            <Route path="/mindset" element={<SubscriptionGuard><Mindset /></SubscriptionGuard>} />
            <Route path="/evolucao" element={<SubscriptionGuard><Evolucao /></SubscriptionGuard>} />
            <Route path="/receitas" element={<SubscriptionGuard><Receitas /></SubscriptionGuard>} />
            <Route path="/area-cliente" element={<SubscriptionGuard><AreaCliente /></SubscriptionGuard>} />
            <Route path="/protocolos" element={<SubscriptionGuard><Protocolos /></SubscriptionGuard>} />
            <Route path="/suporte" element={<SubscriptionGuard><Suporte /></SubscriptionGuard>} />
            <Route path="/meu-perfil" element={<SubscriptionGuard><MeuPerfil /></SubscriptionGuard>} />
            <Route path="/indicacoes" element={<SubscriptionGuard><Indicacoes /></SubscriptionGuard>} />
            <Route path="/assinatura" element={<SubscriptionGuard><Assinatura /></SubscriptionGuard>} />
            <Route path="/configuracoes" element={<SubscriptionGuard><Configuracoes /></SubscriptionGuard>} />

            {/* ROTAS ADMIN (verificação de admin é feita internamente) */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/clientes/:id" element={<AdminClienteDetalhes />} />
            <Route path="/admin/criar-cliente" element={<AdminCriarCliente />} />
            <Route path="/admin/planos" element={<AdminPlanos />} />
            <Route path="/admin/suporte" element={<AdminSuporteChats />} />
            <Route path="/admin/suporte-chats" element={<AdminSuporteChats />} />
            <Route path="/admin/mensagens" element={<AdminMensagens />} />
            <Route path="/admin/videos" element={<AdminVideos />} />
            <Route path="/admin/gifs" element={<AdminExerciseGifs />} />
            <Route path="/admin/planos-venda" element={<AdminPlanosVenda />} />
            <Route path="/admin/metricas" element={<AdminMetricas />} />
            <Route path="/admin/convites" element={<AdminConvites />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/blog/:id" element={<AdminBlogEditor />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
