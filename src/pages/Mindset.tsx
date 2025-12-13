import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Play, Clock, Lock, CheckCircle, BookOpen, Target, Flame } from "lucide-react";

const modules = [
  {
    id: 1,
    title: "Fundamentos da Disciplina",
    description: "Aprenda a construir hábitos que duram para sempre",
    duration: "25 min",
    completed: true,
    icon: Target,
  },
  {
    id: 2,
    title: "Mentalidade de Vencedor",
    description: "Como pensar como atletas de elite",
    duration: "30 min",
    completed: true,
    icon: Flame,
  },
  {
    id: 3,
    title: "Controlando a Ansiedade",
    description: "Técnicas para manter o foco e a calma",
    duration: "20 min",
    completed: false,
    icon: Brain,
  },
  {
    id: 4,
    title: "Visualização e Performance",
    description: "Use o poder da mente para alcançar resultados",
    duration: "35 min",
    completed: false,
    locked: true,
    icon: BookOpen,
  },
  {
    id: 5,
    title: "Superando Platôs",
    description: "Estratégias para quebrar barreiras mentais",
    duration: "28 min",
    completed: false,
    locked: true,
    icon: Target,
  },
];

const dailyQuote = {
  text: "O corpo alcança o que a mente acredita.",
  author: "Napoleon Hill",
};

export default function Mindset() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-4xl text-foreground">
                Programa de <span className="text-gradient">Mindset</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Desenvolva a mentalidade de um campeão
            </p>
          </div>

          {/* Daily quote */}
          <Card variant="glass" className="mb-8 p-6 border-primary/20">
            <div className="text-center">
              <p className="text-xl italic text-foreground mb-2">"{dailyQuote.text}"</p>
              <p className="text-sm text-primary">— {dailyQuote.author}</p>
            </div>
          </Card>

          {/* Progress */}
          <Card variant="dashboard" className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Seu progresso</span>
                <span className="text-sm font-medium text-foreground">2 de 5 módulos</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: "40%" }} />
              </div>
            </CardContent>
          </Card>

          {/* Modules */}
          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card
                key={module.id}
                variant="dashboard"
                className={`animate-fade-in ${module.locked ? "opacity-60" : ""} ${module.completed ? "border-primary/30" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        module.completed 
                          ? "bg-primary/20" 
                          : module.locked 
                            ? "bg-muted" 
                            : "bg-muted"
                      }`}>
                        {module.completed ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : module.locked ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <module.icon className="w-5 h-5 text-foreground" />
                        )}
                      </div>
                      <span className="font-display">{module.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {module.duration}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                  {!module.locked && !module.completed && (
                    <Button className="w-full" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Assistir Aula
                    </Button>
                  )}
                  {module.completed && (
                    <Button className="w-full" variant="ghost">
                      <Play className="w-4 h-4 mr-2" />
                      Assistir Novamente
                    </Button>
                  )}
                  {module.locked && (
                    <p className="text-xs text-center text-muted-foreground">
                      Complete o módulo anterior para desbloquear
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
