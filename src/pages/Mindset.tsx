import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Target, 
  Clock, 
  Coffee, 
  Moon, 
  Sun, 
  Utensils,
  Dumbbell,
  Heart,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  full_name: string;
  goals?: string;
  availability?: string;
  nivel_experiencia?: string;
  injuries?: string;
  restricoes_medicas?: string;
  objetivos_detalhados?: any;
}

interface Orientation {
  icon: typeof Brain;
  title: string;
  description: string;
  tips: string[];
  color: string;
}

export default function Mindset() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, goals, availability, nivel_experiencia, injuries, restricoes_medicas, objetivos_detalhados")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate personalized orientations based on profile
  const generateOrientations = (): Orientation[] => {
    const orientations: Orientation[] = [];

    // Base orientations for everyone
    orientations.push({
      icon: Sun,
      title: "Rotina Matinal",
      description: "Comece o dia com energia e foco para maximizar seus resultados.",
      tips: [
        "Acorde no mesmo horário todos os dias, inclusive fins de semana",
        "Tome água logo ao acordar para hidratar o corpo",
        "Reserve 5-10 minutos para alongamento ou meditação",
        "Evite celular nos primeiros 30 minutos do dia"
      ],
      color: "text-yellow-500"
    });

    orientations.push({
      icon: Moon,
      title: "Qualidade do Sono",
      description: "O sono é fundamental para recuperação muscular e saúde mental.",
      tips: [
        "Durma de 7 a 9 horas por noite",
        "Evite telas 1 hora antes de dormir",
        "Mantenha o quarto escuro e fresco",
        "Evite cafeína após 14h"
      ],
      color: "text-indigo-500"
    });

    // Based on availability
    if (profile?.availability?.toLowerCase().includes("pouco") || 
        profile?.availability?.toLowerCase().includes("limitad")) {
      orientations.push({
        icon: Clock,
        title: "Otimização do Tempo",
        description: "Estratégias para quem tem pouco tempo disponível.",
        tips: [
          "Prepare refeições em batch no domingo",
          "Treinos de 20-30 minutos são efetivos se intensos",
          "Use deslocamentos para exercícios leves",
          "Priorize exercícios compostos que trabalham mais músculos"
        ],
        color: "text-blue-500"
      });
    }

    // Based on injuries
    if (profile?.injuries) {
      orientations.push({
        icon: AlertCircle,
        title: "Cuidados com Lesões",
        description: "Orientações específicas considerando suas limitações físicas.",
        tips: [
          "Sempre faça aquecimento adequado antes dos treinos",
          "Comunique qualquer desconforto imediatamente",
          "Priorize exercícios de baixo impacto quando necessário",
          "Fortaleça músculos estabilizadores",
          "Não force movimentos que causam dor"
        ],
        color: "text-orange-500"
      });
    }

    // Based on experience level
    if (profile?.nivel_experiencia?.toLowerCase().includes("inici")) {
      orientations.push({
        icon: Target,
        title: "Mentalidade de Iniciante",
        description: "Construa uma base sólida para resultados duradouros.",
        tips: [
          "Foque em aprender a técnica correta dos exercícios",
          "Não compare seu início com o meio de jornada de outros",
          "Consistência vale mais que intensidade no começo",
          "Celebre pequenas vitórias ao longo do caminho",
          "Resultados reais levam semanas, seja paciente"
        ],
        color: "text-green-500"
      });
    } else if (profile?.nivel_experiencia?.toLowerCase().includes("inter") ||
               profile?.nivel_experiencia?.toLowerCase().includes("avanc")) {
      orientations.push({
        icon: Dumbbell,
        title: "Superando Platôs",
        description: "Estratégias para continuar evoluindo.",
        tips: [
          "Varie exercícios a cada 4-6 semanas",
          "Periodize intensidade e volume",
          "Foque em pontos fracos específicos",
          "Considere técnicas avançadas como drop sets",
          "Reavalie sua dieta periodicamente"
        ],
        color: "text-purple-500"
      });
    }

    // Nutrition mindset
    orientations.push({
      icon: Utensils,
      title: "Mentalidade Alimentar",
      description: "Desenvolva uma relação saudável com a alimentação.",
      tips: [
        "Coma devagar, mastigue bem os alimentos",
        "Não pule refeições, isso atrapalha o metabolismo",
        "Permita-se flexibilidade ocasional sem culpa",
        "Hidrate-se adequadamente ao longo do dia",
        "Prepare lanches saudáveis com antecedência"
      ],
      color: "text-green-500"
    });

    // Medical restrictions
    if (profile?.restricoes_medicas) {
      orientations.push({
        icon: Heart,
        title: "Saúde em Primeiro Lugar",
        description: "Orientações considerando suas restrições médicas.",
        tips: [
          "Mantenha acompanhamento médico regular",
          "Respeite os limites do seu corpo",
          "Monitore sinais de alerta durante exercícios",
          "Adapte exercícios conforme necessário",
          "Priorize bem-estar sobre performance"
        ],
        color: "text-red-500"
      });
    }

    // Motivation
    orientations.push({
      icon: Lightbulb,
      title: "Mantendo a Motivação",
      description: "Estratégias para não desistir nos dias difíceis.",
      tips: [
        "Defina metas pequenas e alcançáveis",
        "Tire fotos de progresso mensalmente",
        "Encontre um parceiro de treino ou grupo de apoio",
        "Lembre-se do seu 'porquê' quando a motivação faltar",
        "Trate falhas como aprendizado, não como fracasso"
      ],
      color: "text-primary"
    });

    return orientations;
  };

  const orientations = generateOrientations();

  // Daily quote based on goals
  const getQuote = () => {
    const quotes = [
      { text: "O corpo alcança o que a mente acredita.", author: "Napoleon Hill" },
      { text: "Disciplina é a ponte entre metas e conquistas.", author: "Jim Rohn" },
      { text: "Não é sobre ter tempo, é sobre fazer tempo.", author: "Desconhecido" },
      { text: "A dor que você sente hoje será a força que você sentirá amanhã.", author: "Desconhecido" },
      { text: "Consistência é mais importante que perfeição.", author: "Desconhecido" }
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const dailyQuote = getQuote();

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-4xl text-foreground">
              Orientações de <span className="text-gradient">Mindset</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Orientações personalizadas baseadas no seu perfil e objetivos
          </p>
        </div>

        {/* Daily quote */}
        <Card variant="glass" className="p-6 border-primary/20">
          <div className="text-center">
            <Coffee className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-xl italic text-foreground mb-2">"{dailyQuote.text}"</p>
            <p className="text-sm text-primary">— {dailyQuote.author}</p>
          </div>
        </Card>

        {/* Profile Goals Summary */}
        {profile?.goals && (
          <Card variant="dashboard">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-medium">Seus Objetivos</span>
              </div>
              <p className="text-muted-foreground">{profile.goals}</p>
              {profile.nivel_experiencia && (
                <Badge variant="secondary" className="mt-2">
                  {profile.nivel_experiencia}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Orientations Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {orientations.map((orientation, index) => (
            <Card
              key={index}
              variant="dashboard"
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center`}>
                    <orientation.icon className={`w-5 h-5 ${orientation.color}`} />
                  </div>
                  {orientation.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{orientation.description}</p>
                <ul className="space-y-2">
                  {orientation.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notes */}
        {(profile?.injuries || profile?.restricoes_medicas) && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-orange-500">Atenção Especial</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lembre-se de sempre respeitar suas limitações físicas. Suas orientações foram adaptadas 
                considerando suas condições específicas. Em caso de dúvidas, consulte seu profissional de saúde.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}
