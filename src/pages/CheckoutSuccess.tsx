import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, AlertCircle, Copy, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { checkSubscription, subscribed, loading: subLoading } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [checkoutFinalized, setCheckoutFinalized] = useState(false);
  const [guestCredentials, setGuestCredentials] = useState<{ email: string; password: string } | null>(null);
  const finalizeRetryCount = useRef(0);

  const sessionId = searchParams.get("session_id");

  // Finalize checkout directly with Stripe (doesn't depend on webhook)
  const finalizeCheckout = useCallback(async () => {
    if (!sessionId || checkoutFinalized) return false;

    try {
      console.log("[CheckoutSuccess] Finalizing checkout with session:", sessionId);
      
      const { data, error: fnError } = await supabase.functions.invoke(
        "finalize-checkout",
        { body: { session_id: sessionId } }
      );

      if (fnError) {
        console.error("[CheckoutSuccess] Finalize error:", fnError);
        return false;
      }

      if (data?.success) {
        console.log("[CheckoutSuccess] Checkout finalized successfully:", data);
        setCheckoutFinalized(true);
        return true;
      }

      console.log("[CheckoutSuccess] Finalize response:", data);
      return false;
    } catch (err) {
      console.error("[CheckoutSuccess] Finalize error:", err);
      return false;
    }
  }, [sessionId, checkoutFinalized]);

  // Retry finalize-checkout with backoff
  useEffect(() => {
    if (!sessionId || checkoutFinalized || !user) return;

    const retryInterval = setInterval(async () => {
      if (finalizeRetryCount.current >= 5 || checkoutFinalized) {
        clearInterval(retryInterval);
        return;
      }
      finalizeRetryCount.current += 1;
      console.log(`[CheckoutSuccess] Retry finalize attempt ${finalizeRetryCount.current}`);
      const success = await finalizeCheckout();
      if (success) {
        clearInterval(retryInterval);
        await checkSubscription();
      }
    }, 3000);

    return () => clearInterval(retryInterval);
  }, [sessionId, checkoutFinalized, user, finalizeCheckout, checkSubscription]);

  // Handle guest checkout auto-login
  useEffect(() => {
    const completeGuestCheckout = async () => {
      if (user || !sessionId || autoLoginAttempted || authLoading) return;

      setAutoLoginAttempted(true);

      try {
        // Wait for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const attemptLogin = async (): Promise<boolean> => {
          const { data, error: fnError } = await supabase.functions.invoke(
            "complete-guest-checkout",
            { body: { session_id: sessionId } }
          );

          if (fnError || data?.error) return false;

          if (data?.email && data?.temp_password) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.temp_password,
            });

            if (signInError) {
              console.error("Auto-login failed:", signInError);
              // Show credentials as fallback
              setGuestCredentials({ email: data.email, password: data.temp_password });
              setChecking(false);
              return false;
            }
            return true;
          }
          return false;
        };

        // First attempt
        let success = await attemptLogin();
        
        if (!success) {
          // Retry after delay
          await new Promise((resolve) => setTimeout(resolve, 3000));
          success = await attemptLogin();
        }

        if (!success && !guestCredentials) {
          // Last resort: try one more time
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const { data } = await supabase.functions.invoke(
            "complete-guest-checkout",
            { body: { session_id: sessionId } }
          );
          
          if (data?.email && data?.temp_password) {
            setGuestCredentials({ email: data.email, password: data.temp_password });
            setChecking(false);
          } else {
            setError("Não foi possível recuperar suas credenciais. Entre em contato com o suporte.");
            setChecking(false);
          }
        }
      } catch (err) {
        console.error("Guest checkout error:", err);
        setError("Erro ao processar checkout. Entre em contato com o suporte.");
        setChecking(false);
      }
    };

    completeGuestCheckout();
  }, [user, sessionId, autoLoginAttempted, authLoading]);

  // Verify subscription and finalize checkout when user is logged in
  useEffect(() => {
    if (authLoading) return;

    if (!user && !sessionId) {
      navigate("/auth");
      return;
    }

    if (user && sessionId) {
      const verifyAndFinalize = async () => {
        setChecking(true);
        await finalizeCheckout();
        await checkSubscription();
        setChecking(false);
      };
      verifyAndFinalize();
    } else if (user) {
      const verify = async () => {
        setChecking(true);
        await checkSubscription();
        setChecking(false);
      };
      verify();
    }
  }, [user, authLoading, sessionId, navigate, checkSubscription, finalizeCheckout]);

  // Redirect to anamnese when subscription is confirmed
  useEffect(() => {
    if (user && !checking && !subLoading && subscribed) {
      navigate("/anamnese");
    }
  }, [user, checking, subLoading, subscribed, navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Show guest credentials fallback
  if (guestCredentials && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center">
              Sua conta foi criada com sucesso. Use as credenciais abaixo para acessar a plataforma:
            </p>

            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">E-mail</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm break-all">{guestCredentials.email}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(guestCredentials.email, "E-mail")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Senha provisória</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm">{guestCredentials.password}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(guestCredentials.password, "Senha")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Recomendamos alterar sua senha após o primeiro acesso em Configurações.
            </p>

            <Button onClick={() => navigate("/auth")} className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || checking || subLoading || (!user && sessionId && !guestCredentials)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {!user && sessionId
              ? "Criando sua conta..."
              : "Verificando seu pagamento..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{error}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} variant="outline" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Ir para Login
            </Button>
          </CardContent>
        </Card>
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

          <Button onClick={() => navigate("/anamnese")} className="w-full" size="lg">
            Completar Cadastro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
