import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { checkSubscription, subscribed, loading: subLoading } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [checkoutFinalized, setCheckoutFinalized] = useState(false);

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

  // Handle guest checkout auto-login
  useEffect(() => {
    const completeGuestCheckout = async () => {
      // Skip if already logged in, no session_id, or already attempted
      if (user || !sessionId || autoLoginAttempted || authLoading) {
        return;
      }

      setAutoLoginAttempted(true);

      try {
        // Wait a bit for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { data, error: fnError } = await supabase.functions.invoke(
          "complete-guest-checkout",
          { body: { session_id: sessionId } }
        );

        if (fnError) {
          console.error("Guest checkout error:", fnError);
          navigate("/auth");
          return;
        }

        if (data?.error) {
          if (data.error === "not_found") {
            // Webhook might not have processed yet, wait and retry once
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const { data: retryData } = await supabase.functions.invoke(
              "complete-guest-checkout",
              { body: { session_id: sessionId } }
            );

            if (retryData?.email && retryData?.temp_password) {
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: retryData.email,
                password: retryData.temp_password,
              });

              if (signInError) {
                console.error("Auto-login failed:", signInError);
                setError("Erro ao fazer login automático. Redirecionando...");
                setTimeout(() => navigate("/auth"), 2000);
              }
              return;
            }
          }

          navigate("/auth");
          return;
        }

        if (data?.email && data?.temp_password) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.temp_password,
          });

          if (signInError) {
            console.error("Auto-login failed:", signInError);
            setError("Erro ao fazer login automático. Redirecionando...");
            setTimeout(() => navigate("/auth"), 2000);
          }
        }
      } catch (err) {
        console.error("Guest checkout error:", err);
        navigate("/auth");
      }
    };

    completeGuestCheckout();
  }, [user, sessionId, autoLoginAttempted, authLoading, navigate]);

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
        
        // First, try to finalize checkout directly (doesn't depend on webhook)
        await finalizeCheckout();
        
        // Then check subscription status
        await checkSubscription();
        
        setChecking(false);
      };

      verifyAndFinalize();
    } else if (user) {
      // User logged in but no session_id - just check subscription
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

  if (authLoading || checking || subLoading || (!user && sessionId)) {
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
