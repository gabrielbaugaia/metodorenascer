import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAnalytics } from "./useAnalytics";

const routeToPageName: Record<string, string> = {
  "/": "landing",
  "/oferta": "oferta_vendas",
  "/auth": "auth",
  "/assinatura": "planos",
  "/pagamento": "checkout",
  "/checkout-success": "checkout_success",
  "/anamnese": "anamnese",
  "/dashboard": "dashboard",
  "/treino": "treino",
  "/nutricao": "nutricao",
  "/mindset": "mindset",
  "/receitas": "receitas",
  "/suporte": "suporte",
  "/meu-perfil": "perfil",
  "/indicacoes": "indicacoes",
  "/area-cliente": "area_cliente",
  "/protocolos": "protocolos",
  "/convite": "convite",
  "/redefinir-senha": "redefinir_senha",
  "/admin": "admin_dashboard",
  "/admin/dashboard": "admin_dashboard",
  "/admin/clientes": "admin_clientes",
  "/admin/planos": "admin_planos",
  "/admin/planos-venda": "admin_planos_venda",
  "/admin/videos": "admin_videos",
  "/admin/mensagens": "admin_mensagens",
  "/admin/suporte-chats": "admin_suporte",
  "/admin/criar-cliente": "admin_criar_cliente",
};

export function usePageTracking() {
  const location = useLocation();
  const { trackPageView, trackAppOpen } = useAnalytics();

  useEffect(() => {
    // Track app open on first load
    trackAppOpen();
  }, [trackAppOpen]);

  useEffect(() => {
    const pageName = routeToPageName[location.pathname] || location.pathname.replace(/\//g, "_").slice(1) || "unknown";
    trackPageView(pageName);
  }, [location.pathname, trackPageView]);
}
