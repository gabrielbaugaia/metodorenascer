import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Flame, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  // Redirecionar usuário logado: admin -> /admin, cliente -> /dashboard
  useEffect(() => {
    if (user && !adminLoading) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      const message = error.message === "Invalid login credentials" 
        ? "Email ou senha incorretos" 
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
          <p className="text-muted-foreground">
            Entre na sua conta
          </p>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-center">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="fire" className="w-full" disabled={loading}>
                {loading ? "Carregando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error("Digite seu email primeiro");
                    return;
                  }
                  
                  toast.loading("Enviando email de recuperação...", { id: "reset-password" });
                  
                  try {
                    const { data, error } = await supabase.functions.invoke('send-password-reset', {
                      body: { email }
                    });
                    
                    if (error) throw error;
                    
                    if (data?.success) {
                      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.", { id: "reset-password" });
                    } else if (data?.error) {
                      throw new Error(data.error);
                    }
                  } catch (err: any) {
                    console.error("Password reset error:", err);
                    const { error: nativeError } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/redefinir-senha`,
                    });
                    
                    if (nativeError) {
                      toast.error("Erro ao enviar email de recuperação", { id: "reset-password" });
                    } else {
                      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.", { id: "reset-password" });
                    }
                  }
                }}
                className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu sua senha?
              </button>
              
              <p className="text-xs text-muted-foreground mt-4">
                Ainda não é cliente?{" "}
                <a href="/#preco" className="text-primary hover:underline">
                  Conheça nossos planos
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
