import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Utensils, Brain, BookOpen, MessageCircle, TrendingUp } from "lucide-react";

const dashboardCards = [
  {
    icon: Target,
    title: "Treino",
    description: "Seu plano de treino personalizado da semana",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Utensils,
    title: "Nutricao",
    description: "Cardapio e orientacoes nutricionais",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Brain,
    title: "Mindset",
    description: "Materiais de desenvolvimento mental",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: BookOpen,
    title: "Receitas",
    description: "Biblioteca completa de receitas fitness",
    color: "from-blue-500 to-cyan-500",
  },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
              BEM-VINDO, <span className="text-gradient">GUERREIRO</span>
            </h1>
            <p className="text-muted-foreground">Sua jornada de transformacao continua hoje</p>
          </div>

          {/* Progress bar */}
          <Card variant="glass" className="mb-8 p-6">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Progresso do Mes</h3>
                <p className="text-sm text-muted-foreground">15 dias de treino completados</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: "50%" }} />
            </div>
          </Card>

          {/* Main cards grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {dashboardCards.map((card, index) => (
              <Card
                key={card.title}
                variant="dashboard"
                className="group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-7 h-7 text-foreground" />
                  </div>
                  <CardTitle className="text-3xl">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* WhatsApp support card */}
          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Suporte 24h via WhatsApp</h3>
                <p className="text-sm text-muted-foreground">Tire suas duvidas a qualquer momento</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
