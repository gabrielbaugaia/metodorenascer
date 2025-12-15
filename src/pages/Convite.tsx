import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Flame, Mail, Lock, User, Gift, Percent } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

export default function Convite() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Verificar código de indicação usando a função do banco
  useEffect(() => {
    const checkReferralCode = async () => {
      if (!referralCode) return;

      // Validar código usando a função segura do banco
      const { data: isValid, error: validationError } = await supabase
        .rpc("validate_referral_code", { lookup_code: referralCode });

      if (validationError || !isValid) {
        toast.error("Código de indicação inválido");
        return;
      }

      // Buscar nome do referrer
      const { data: name } = await supabase
        .rpc("get_referrer_name_by_code", { lookup_code: referralCode });

      if (name) {
        setReferrerName(name.split(" ")[0]); // Primeiro nome
      }
    };

    checkReferralCode();
  }, [referralCode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = signupSchema.safeParse({ email, password, fullName });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Atualizar perfil com código de indicação
        if (referralCode) {
          await supabase
            .from("profiles")
            .update({ referred_by_code: referralCode })
            .eq("id", authData.user.id);

          // Buscar quem indicou
          const { data: referrerData } = await supabase
            .from("referral_codes")
            .select("user_id")
            .eq("code", referralCode)
            .maybeSingle();

          // Registrar a indicação
          if (referrerData) {
            await supabase
              .from("referrals")
              .insert({
                referrer_id: referrerData.user_id,
                referred_user_id: authData.user.id,
              });
          }
        }

        // Create free subscription for the user
        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const { error: subError } = await supabase.from("subscriptions").insert({
          user_id: authData.user.id,
          status: "active",
          plan_type: "free",
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          price_cents: 0,
        });

        if (subError) {
          console.error("Error creating subscription:", subError);
        }

        toast.success("Conta criada com sucesso! Bem-vindo ao Método Renascer!");
      }
    } catch (error: any) {
      const message = error.message === "User already registered" 
        ? "Este email já está cadastrado. Faça login." 
        : error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Flame className="w-8 h-8 text-primary" />
            <span className="font-display text-3xl text-gradient">MÉTODO RENASCER</span>
          </div>
          {referrerName ? (
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-4">
              <Percent className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-semibold">
                Indicado por {referrerName}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold">Convite Exclusivo</span>
            </div>
          )}
          <p className="text-muted-foreground">
            {referrerName 
              ? `${referrerName} te convidou para fazer parte do Método Renascer!`
              : "Você foi convidado para fazer parte do Método Renascer com acesso cortesia!"
            }
          </p>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-center">
              {referralCode ? "Cadastre-se com 10% OFF" : "Criar Conta Gratuita"}
            </CardTitle>
            <CardDescription className="text-center">
              {referralCode 
                ? "Cadastre-se e depois clique em 'COMPRAR PLANO' para ganhar 10% de desconto!" 
                : "Preencha seus dados para ativar seu acesso de 30 dias"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="fire" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : (referralCode ? "CADASTRAR COM 10% OFF" : "Ativar Meu Acesso Gratuito")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Já tem conta? Entre aqui
              </button>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Ao criar sua conta, você terá acesso gratuito por 30 dias a todos os recursos do Método Renascer, incluindo treinos, nutrição e mentalidade personalizados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
