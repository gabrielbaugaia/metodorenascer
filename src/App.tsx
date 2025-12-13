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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
