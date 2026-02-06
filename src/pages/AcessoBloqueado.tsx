import { Lock, MessageCircle, CreditCard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";

const STRIPE_DIRECT_LINK = 'https://buy.stripe.com/fZu3cudIS3nqaYVf902B205';

export default function AcessoBloqueado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");
  const isFreeExpired = reason === "free_expired_30d";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleContactAdmin = () => {
    window.open(
      "https://wa.me/5511999999999?text=Olá! Meu acesso ao Método Renascer expirou e gostaria de reativar.",
      "_blank"
    );
  };

  const handlePurchasePlan = () => {
    if (isFreeExpired) {
      window.open(STRIPE_DIRECT_LINK, '_blank');
    } else {
      navigate("/#preco");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            {isFreeExpired ? "Período Gratuito Encerrado" : "Acesso Expirado"}
          </CardTitle>
          <CardDescription className="text-base">
            {isFreeExpired
              ? "Seu período gratuito de 30 dias expirou. Para continuar acessando o Método Renascer, escolha um plano."
              : "Seu período de acesso gratuito de 7 dias expirou devido à inatividade no sistema."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center">
            {isFreeExpired
              ? "Assine agora para desbloquear o acesso completo:"
              : "Para liberar seu acesso imediatamente, você pode:"}
          </div>

          <div className="space-y-3">
            {!isFreeExpired && (
              <Button 
                onClick={handleContactAdmin}
                className="w-full gap-2"
                variant="outline"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com Administrador
              </Button>
            )}

            <Button 
              onClick={handlePurchasePlan}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <CreditCard className="w-4 h-4" />
              {isFreeExpired ? "Assinar Agora" : "Adquirir um Plano"}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
