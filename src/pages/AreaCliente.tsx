import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Dumbbell, 
  Apple, 
  MessageCircle,
  Trophy,
  Clock,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { AnamneseSection } from "@/components/client/AnamneseSection";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  full_name: string;
  weight: number | null;
  goals: string | null;
  age: number | null;
  anamnese_completa?: boolean | null;
  updated_at?: string | null;
}

export default function AreaCliente() {
  const { user } = useAuth();
  const { subscribed, subscriptionEnd } = useSubscription();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [protocolCount, setProtocolCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, weight, goals, age, anamnese_completa, updated_at")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch protocol count
      const { count } = await supabase
        .from("protocolos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("ativo", true);

      setProtocolCount(count || 0);
    };

    fetchData();
  }, [user]);

  // Calculate subscription progress
  const calculateProgress = () => {
    if (!subscriptionEnd) return 0;
    const endDate = parseISO(subscriptionEnd);
    const today = new Date();
    const totalDays = 30; // Assuming 30-day subscription
    const daysRemaining = differenceInDays(endDate, today);
    const daysUsed = totalDays - daysRemaining;
    return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
  };

  const daysRemaining = subscriptionEnd 
    ? Math.max(0, differenceInDays(parseISO(subscriptionEnd), new Date()))
    : 0;

  const quickActions = [
    { title: "Ver Treino do Dia", icon: Dumbbell, url: "/treino", color: "from-orange-500 to-red-600" },
    { title: "Plano Alimentar", icon: Apple, url: "/nutricao", color: "from-green-500 to-emerald-600" },
    { title: "Falar com Mentor", icon: MessageCircle, url: "/suporte", color: "from-blue-500 to-purple-600" },
  ];

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold uppercase">
            Olá, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "Guerreiro"}</span>!
          </h1>
          <p className="text-muted-foreground">
            Continue sua jornada de transformação. Você está no caminho certo!
          </p>
        </div>

        {/* Subscription Status + Anamnese Badge */}
        <Card variant="glass" className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            {profile?.anamnese_completa && (
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 text-primary flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    Anamnese em dia
                  </Badge>
                  {profile.updated_at && (
                    <span className="text-muted-foreground">
                      Última atualização: {format(parseISO(profile.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Envie novas fotos a cada 30 dias para manter seu plano atualizado.
                </span>
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {subscribed ? "Plano Ativo" : "Sem Plano"}
                  </Badge>
                  {subscriptionEnd && (
                    <span className="text-sm text-muted-foreground">
                      Vence em {format(parseISO(subscriptionEnd), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{daysRemaining} dias restantes</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64">
                <Progress value={calculateProgress()} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {Math.round(calculateProgress())}% do plano utilizado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.title}
              className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden"
              onClick={() => navigate(action.url)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <CardContent className="p-6 flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-semibold">{action.title}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{profile?.weight || "--"}</p>
              <p className="text-xs text-muted-foreground">Peso Atual (kg)</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Dias Restantes</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{protocolCount}</p>
              <p className="text-xs text-muted-foreground">Protocolos Ativos</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">--</p>
              <p className="text-xs text-muted-foreground">Treinos Feitos</p>
            </CardContent>
          </Card>
        </div>

        {/* Goals Section */}
        {profile?.goals && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Seus Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profile.goals}</p>
            </CardContent>
          </Card>
        )}

        {/* CTA for protocols */}
        {protocolCount === 0 && (
          <Card className="bg-gradient-to-r from-primary/20 to-orange-500/20 border-primary/30">
            <CardContent className="p-6 text-center space-y-4">
              <h3 className="text-xl font-semibold">Ainda sem protocolos?</h3>
              <p className="text-muted-foreground">
                Vá até a página de protocolos e gere seu primeiro plano de treino e nutrição personalizado pela IA!
              </p>
              <Button variant="fire" onClick={() => navigate("/protocolos")}>
                Gerar Meu Protocolo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Anamnese Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold uppercase">Minha Anamnese</h2>
          </div>
          <AnamneseSection />
        </div>
      </div>
    </ClientLayout>
  );
}
