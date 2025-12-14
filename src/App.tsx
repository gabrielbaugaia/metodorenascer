import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Anamnese from "./pages/Anamnese";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Treino from "./pages/Treino";
import Nutricao from "./pages/Nutricao";
import Mindset from "./pages/Mindset";
import Receitas from "./pages/Receitas";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/anamnese" element={<Anamnese />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/treino" element={<Treino />} />
            <Route path="/nutricao" element={<Nutricao />} />
            <Route path="/mindset" element={<Mindset />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/area-cliente" element={<AreaCliente />} />
            <Route path="/protocolos" element={<Protocolos />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/clientes/:id" element={<AdminClienteDetalhes />} />
            <Route path="/admin/criar-cliente" element={<AdminCriarCliente />} />
            <Route path="/admin/planos" element={<AdminPlanos />} />
            <Route path="/admin/suporte" element={<AdminSuporteChats />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
