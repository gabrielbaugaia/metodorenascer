// Force deploy v3 - Error Boundary + Diet Fix
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Critical routes loaded immediately
import Index from "./pages/Index";

// Lazy-loaded routes for better code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Convite = lazy(() => import("./pages/Convite"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Anamnese = lazy(() => import("./pages/Anamnese"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Treino = lazy(() => import("./pages/Treino"));
const Nutricao = lazy(() => import("./pages/Nutricao"));
const Mindset = lazy(() => import("./pages/Mindset"));
const Receitas = lazy(() => import("./pages/Receitas"));
const Evolucao = lazy(() => import("./pages/Evolucao"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AreaCliente = lazy(() => import("./pages/AreaCliente"));
const Protocolos = lazy(() => import("./pages/Protocolos"));
const Suporte = lazy(() => import("./pages/Suporte"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminClientes = lazy(() => import("./pages/admin/AdminClientes"));
const AdminClienteDetalhes = lazy(() => import("./pages/admin/AdminClienteDetalhes"));
const AdminCriarCliente = lazy(() => import("./pages/admin/AdminCriarCliente"));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos"));
const AdminSuporteChats = lazy(() => import("./pages/admin/AdminSuporteChats"));
const AdminMensagens = lazy(() => import("./pages/admin/AdminMensagens"));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos"));
const AdminExerciseGifs = lazy(() => import("./pages/admin/AdminExerciseGifs"));
const MeuPerfil = lazy(() => import("./pages/MeuPerfil"));
const Indicacoes = lazy(() => import("./pages/Indicacoes"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Assinatura = lazy(() => import("./pages/Assinatura"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const AdminPlanosVenda = lazy(() => import("./pages/admin/AdminPlanosVenda"));
const AdminMetricas = lazy(() => import("./pages/admin/AdminMetricas"));
const AdminConvites = lazy(() => import("./pages/admin/AdminConvites"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminBlogEditor = lazy(() => import("./pages/admin/AdminBlogEditor"));
const AcessoBloqueado = lazy(() => import("./pages/AcessoBloqueado"));
const Oferta = lazy(() => import("./pages/Oferta"));
const AdminCommercialPlans = lazy(() => import("./pages/admin/AdminCommercialPlans"));
const AdminTrialCampaigns = lazy(() => import("./pages/admin/AdminTrialCampaigns"));
const Mqo = lazy(() => import("./pages/Mqo"));
const DadosCorpo = lazy(() => import("./pages/DadosCorpo"));
const AdminConectorMobileDocs = lazy(() => import("./pages/admin/AdminConectorMobileDocs"));
const ConnectLogin = lazy(() => import("./pages/connect/ConnectLogin"));
const ConnectDashboard = lazy(() => import("./pages/connect/ConnectDashboard"));
const ConnectSync = lazy(() => import("./pages/connect/ConnectSync"));
const Renascer = lazy(() => import("./pages/Renascer"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsProvider>
            <Suspense fallback={<PageLoader />}>
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
            <Route path="/oferta" element={<Oferta />} />

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
            <Route path="/dados-corpo" element={<SubscriptionGuard><DadosCorpo /></SubscriptionGuard>} />
            <Route path="/renascer" element={<SubscriptionGuard><Renascer /></SubscriptionGuard>} />

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
              <Route path="/admin/commercial-plans" element={<AdminCommercialPlans />} />
              <Route path="/admin/trial-campaigns" element={<AdminTrialCampaigns />} />
              <Route path="/mqo" element={<Mqo />} />
              <Route path="/admin/docs/conector-mobile" element={<AdminConectorMobileDocs />} />

              {/* ROTAS RENASCER CONNECT (mobile) */}
              <Route path="/connect/login" element={<ConnectLogin />} />
              <Route path="/connect/dashboard" element={<ConnectDashboard />} />
              <Route path="/connect/sync" element={<ConnectSync />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </AnalyticsProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
