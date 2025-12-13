import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Calendar, Dumbbell, Clock, CheckCircle } from "lucide-react";

const weeklyWorkouts = [
  {
    day: "Segunda",
    focus: "Peito e Tríceps",
    exercises: ["Supino reto", "Supino inclinado", "Crucifixo", "Tríceps corda", "Tríceps francês"],
    duration: "45 min",
    completed: true,
  },
  {
    day: "Terça",
    focus: "Costas e Bíceps",
    exercises: ["Puxada frontal", "Remada curvada", "Remada unilateral", "Rosca direta", "Rosca martelo"],
    duration: "45 min",
    completed: true,
  },
  {
    day: "Quarta",
    focus: "Pernas",
    exercises: ["Agachamento livre", "Leg press", "Cadeira extensora", "Mesa flexora", "Panturrilha"],
    duration: "50 min",
    completed: false,
  },
  {
    day: "Quinta",
    focus: "Ombros e Abdômen",
    exercises: ["Desenvolvimento", "Elevação lateral", "Elevação frontal", "Prancha", "Abdominal infra"],
    duration: "40 min",
    completed: false,
  },
  {
    day: "Sexta",
    focus: "Full Body",
    exercises: ["Burpees", "Agachamento", "Flexões", "Remada", "Prancha"],
    duration: "35 min",
    completed: false,
  },
];

export default function Treino() {
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-4xl text-foreground">
                Seu <span className="text-gradient">Treino</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Plano de treino personalizado para esta semana
            </p>
          </div>

          {/* Week overview */}
          <Card variant="glass" className="mb-6 p-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Semana 3 - Fase de Hipertrofia</p>
                <p className="text-sm text-muted-foreground">2 treinos completados de 5</p>
              </div>
            </div>
          </Card>

          {/* Workouts grid */}
          <div className="space-y-4">
            {weeklyWorkouts.map((workout, index) => (
              <Card
                key={workout.day}
                variant="dashboard"
                className={`animate-fade-in ${workout.completed ? "border-primary/30" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-lg font-display">{workout.day}</span>
                      {workout.completed && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {workout.duration}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Dumbbell className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-2">{workout.focus}</p>
                      <div className="flex flex-wrap gap-2">
                        {workout.exercises.map((exercise) => (
                          <span
                            key={exercise}
                            className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                          >
                            {exercise}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {!workout.completed && (
                    <Button className="mt-4 w-full" variant="outline">
                      Iniciar Treino
                    </Button>
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
