import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Calendar, Trophy, Flame } from "lucide-react";
import { WorkoutCard } from "@/components/treino/WorkoutCard";

const weeklyWorkouts = [
  {
    day: "Segunda",
    focus: "Peito e Tríceps",
    duration: "45 min",
    calories: 380,
    completed: true,
    exercises: [
      {
        name: "Supino Reto com Barra",
        sets: 4,
        reps: "10-12",
        rest: "90s",
        videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
        tips: "Mantenha os pés firmes no chão e desça a barra até o peito.",
        completed: true,
      },
      {
        name: "Supino Inclinado com Halteres",
        sets: 3,
        reps: "12",
        rest: "60s",
        videoUrl: "https://www.youtube.com/embed/8iPEnn-ltC8",
        tips: "Incline o banco em 30-45 graus para focar na parte superior do peito.",
        completed: true,
      },
      {
        name: "Crucifixo na Máquina",
        sets: 3,
        reps: "15",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/Z57CtFmRMxA",
        completed: true,
      },
      {
        name: "Tríceps Corda",
        sets: 4,
        reps: "12-15",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/kiuVA0gs3EI",
        tips: "Abra as mãos no final do movimento para maior contração.",
        completed: true,
      },
      {
        name: "Tríceps Francês",
        sets: 3,
        reps: "12",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/ir5PsbniVSc",
        completed: true,
      },
    ],
  },
  {
    day: "Terça",
    focus: "Costas e Bíceps",
    duration: "50 min",
    calories: 420,
    completed: true,
    exercises: [
      {
        name: "Puxada Frontal",
        sets: 4,
        reps: "10-12",
        rest: "90s",
        videoUrl: "https://www.youtube.com/embed/CAwf7n6Luuc",
        tips: "Puxe a barra até o queixo, focando na contração das costas.",
        completed: true,
      },
      {
        name: "Remada Curvada",
        sets: 4,
        reps: "10",
        rest: "90s",
        videoUrl: "https://www.youtube.com/embed/kBWAon7ItDw",
        tips: "Mantenha as costas retas e puxe o peso em direção ao umbigo.",
        completed: true,
      },
      {
        name: "Remada Unilateral",
        sets: 3,
        reps: "12 cada",
        rest: "60s",
        videoUrl: "https://www.youtube.com/embed/pYcpY20QaE8",
        completed: true,
      },
      {
        name: "Rosca Direta com Barra",
        sets: 3,
        reps: "12",
        rest: "60s",
        videoUrl: "https://www.youtube.com/embed/kwG2ipFRgfo",
        tips: "Evite balançar o corpo. Mantenha os cotovelos fixos.",
        completed: true,
      },
      {
        name: "Rosca Martelo",
        sets: 3,
        reps: "12",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/zC3nLlEvin4",
        completed: true,
      },
    ],
  },
  {
    day: "Quarta",
    focus: "Pernas Completo",
    duration: "55 min",
    calories: 520,
    completed: false,
    exercises: [
      {
        name: "Agachamento Livre",
        sets: 4,
        reps: "8-10",
        rest: "120s",
        videoUrl: "https://www.youtube.com/embed/ultWZbUMPL8",
        tips: "Desça até as coxas ficarem paralelas ao chão. Joelhos alinhados.",
        completed: false,
      },
      {
        name: "Leg Press 45°",
        sets: 4,
        reps: "12",
        rest: "90s",
        videoUrl: "https://www.youtube.com/embed/IZxyjW7MPJQ",
        tips: "Não trave os joelhos no topo do movimento.",
        completed: false,
      },
      {
        name: "Cadeira Extensora",
        sets: 3,
        reps: "15",
        rest: "60s",
        videoUrl: "https://www.youtube.com/embed/YyvSfVjQeL0",
        completed: false,
      },
      {
        name: "Mesa Flexora",
        sets: 3,
        reps: "12",
        rest: "60s",
        videoUrl: "https://www.youtube.com/embed/1Tq3QdYUuHs",
        tips: "Contraia os glúteos no topo do movimento.",
        completed: false,
      },
      {
        name: "Panturrilha em Pé",
        sets: 4,
        reps: "15-20",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/-M4-G8p8fmc",
        completed: false,
      },
    ],
  },
  {
    day: "Quinta",
    focus: "Ombros e Abdômen",
    duration: "45 min",
    calories: 350,
    completed: false,
    exercises: [
      {
        name: "Desenvolvimento com Halteres",
        sets: 4,
        reps: "10-12",
        rest: "90s",
        videoUrl: "https://www.youtube.com/embed/qEwKCR5JCog",
        tips: "Mantenha o core ativado durante todo o movimento.",
        completed: false,
      },
      {
        name: "Elevação Lateral",
        sets: 4,
        reps: "15",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/3VcKaXpzqRo",
        tips: "Levante até a altura dos ombros, sem impulso.",
        completed: false,
      },
      {
        name: "Elevação Frontal",
        sets: 3,
        reps: "12",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/-t7fuZ0KhDA",
        completed: false,
      },
      {
        name: "Prancha Isométrica",
        sets: 3,
        reps: "45s",
        rest: "30s",
        videoUrl: "https://www.youtube.com/embed/ASdvN_XEl_c",
        tips: "Mantenha o corpo reto, sem levantar o quadril.",
        completed: false,
      },
      {
        name: "Abdominal Infra",
        sets: 3,
        reps: "20",
        rest: "30s",
        videoUrl: "https://www.youtube.com/embed/l4kQd9eWclE",
        completed: false,
      },
    ],
  },
  {
    day: "Sexta",
    focus: "Full Body HIIT",
    duration: "35 min",
    calories: 450,
    completed: false,
    exercises: [
      {
        name: "Burpees",
        sets: 4,
        reps: "10",
        rest: "60s",
        videoUrl: "https://www.youtube.com/embed/dZgVxmf6jkA",
        tips: "Mantenha um ritmo constante e controlado.",
        completed: false,
      },
      {
        name: "Agachamento com Salto",
        sets: 3,
        reps: "15",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/Azl5tkCzDcc",
        completed: false,
      },
      {
        name: "Flexões",
        sets: 3,
        reps: "12-15",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/IODxDxX7oi4",
        tips: "Desça até o peito quase tocar o chão.",
        completed: false,
      },
      {
        name: "Remada com Elástico",
        sets: 3,
        reps: "15",
        rest: "45s",
        videoUrl: "https://www.youtube.com/embed/xQNrFHEMhI4",
        completed: false,
      },
      {
        name: "Mountain Climbers",
        sets: 3,
        reps: "30s",
        rest: "30s",
        videoUrl: "https://www.youtube.com/embed/nmwgirgXLYM",
        completed: false,
      },
    ],
  },
];

export default function Treino() {
  const navigate = useNavigate();

  const completedWorkouts = weeklyWorkouts.filter((w) => w.completed).length;
  const totalCalories = weeklyWorkouts
    .filter((w) => w.completed)
    .reduce((acc, w) => acc + w.calories, 0);

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
              Clique em um exercício para ver o vídeo demonstrativo
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {completedWorkouts}/5
                  </p>
                  <p className="text-xs text-muted-foreground">Treinos</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {totalCalories}
                  </p>
                  <p className="text-xs text-muted-foreground">kcal queimadas</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">3</p>
                  <p className="text-xs text-muted-foreground">Semana atual</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Week phase */}
          <Card className="mb-6 p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Fase de Hipertrofia
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Foco em ganho de massa muscular
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">Semana 3 de 12</p>
                <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "25%" }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Workouts */}
          <div className="space-y-4">
            {weeklyWorkouts.map((workout, index) => (
              <WorkoutCard
                key={workout.day}
                day={workout.day}
                focus={workout.focus}
                exercises={workout.exercises}
                duration={workout.duration}
                calories={workout.calories}
                completed={workout.completed}
                index={index}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
