import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Copy, Share2, Users, Gift, Percent, CheckCircle, Clock, Loader2, Coins } from "lucide-react";

interface Referral {
  id: string;
  referred_user_id: string;
  discount_applied: boolean;
  discount_applied_at: string | null;
  created_at: string;
  referred_name?: string;
}

export default function Indicacoes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Buscar código de indicação e saldo de cashback
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("cashback_balance")
        .eq("id", user!.id)
        .maybeSingle();

      if (!profileError && profileData) {
        setCashbackBalance(profileData.cashback_balance || 0);
      }

      const { data: codeData, error: codeError } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (codeError) throw codeError;
      
      if (codeData) {
        setReferralCode(codeData.code);
      } else {
        // Gerar código se não existir (para usuários antigos)
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { error: insertError } = await supabase
          .from("referral_codes")
          .insert({ user_id: user!.id, code: newCode });
        
        if (!insertError) {
          setReferralCode(newCode);
        }
      }

      // Buscar indicações feitas
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });

      if (referralsError) throw referralsError;

      // Buscar nomes dos indicados
      if (referralsData && referralsData.length > 0) {
        const userIds = referralsData.map(r => r.referred_user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const enrichedReferrals = referralsData.map(r => ({
          ...r,
          referred_name: profilesData?.find(p => p.id === r.referred_user_id)?.full_name || "Usuário",
        }));

        setReferrals(enrichedReferrals);
      } else {
        setReferrals([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados de indicação");
    } finally {
      setLoading(false);
    }
  };

  const referralLink = referralCode 
    ? `${window.location.origin}/convite?ref=${referralCode}`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Método Renascer",
          text: "Junte-se a mim no Método Renascer e ganhe desconto!",
          url: referralLink,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          copyLink();
        }
      }
    } else {
      copyLink();
    }
  };

  const pendingDiscounts = referrals.filter(r => !r.discount_applied).length;
  const appliedDiscounts = referrals.filter(r => r.discount_applied).length;

  if (authLoading || loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/area-cliente")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Programa de Indicação</h1>
            <p className="text-muted-foreground">Indique amigos e ganhe 10% de desconto</p>
          </div>
        </div>

        {/* Saldo de Cashback */}
        {cashbackBalance > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{cashbackBalance}x 10%</p>
                    <p className="text-sm text-muted-foreground">Descontos disponíveis para usar</p>
                  </div>
                </div>
                <Badge variant="default" className="text-sm">
                  Próxima renovação: -10%
                </Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Seu desconto de 10% será aplicado automaticamente na sua próxima renovação de assinatura.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Como funciona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Compartilhe seu link</p>
                  <p className="text-sm text-muted-foreground">Envie seu link único para amigos</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Amigo assina</p>
                  <p className="text-sm text-muted-foreground">Quando ele comprar um plano com seu link</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Você ganha 10%</p>
                  <p className="text-sm text-muted-foreground">Desconto automático na renovação</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seu link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Seu Link de Indicação
            </CardTitle>
            <CardDescription>
              Compartilhe este link com seus amigos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyLink} variant="outline">
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={shareLink} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar Link
              </Button>
              <Button onClick={copyLink} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Seu código:</span>{" "}
                <span className="font-mono text-primary">{referralCode}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{referrals.length}</p>
                  <p className="text-sm text-muted-foreground">Indicações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingDiscounts}</p>
                  <p className="text-sm text-muted-foreground">Aguardando assinatura</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Percent className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appliedDiscounts}</p>
                  <p className="text-sm text-muted-foreground">Descontos usados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de indicações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Suas Indicações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Você ainda não indicou ninguém.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Compartilhe seu link e comece a ganhar descontos!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{referral.referred_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Indicado em {new Date(referral.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={referral.discount_applied ? "default" : "secondary"}>
                      {referral.discount_applied ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Desconto creditado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Aguardando assinatura
                        </span>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
