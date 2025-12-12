import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { checkSubscription, subscribed, loading: subLoading } = useSubscription();
  const [checking, setChecking] = useState(true);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Check subscription status after successful checkout
    const verifySubscription = async () => {
      setChecking(true);
      await checkSubscription();
      setChecking(false);
    };

    if (user && sessionId) {
      // Wait a moment for Stripe webhook to process
      const timer = setTimeout(verifySubscription, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, sessionId, navigate, checkSubscription]);

  if (authLoading || checking || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando seu pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Bem-vindo ao Método Renascer! Sua assinatura foi ativada com sucesso.
          </p>
          
          {subscribed ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-primary font-medium">
                Sua assinatura está ativa
              </p>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600">
                Aguarde alguns segundos para ativação...
              </p>
            </div>
          )}

          <Button 
            onClick={() => navigate("/anamnese")} 
            className="w-full"
            size="lg"
          >
            Completar Cadastro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
