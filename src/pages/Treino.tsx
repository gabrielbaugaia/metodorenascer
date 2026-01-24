import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutTracking } from "@/hooks/useWorkoutTracking";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Calendar, Trophy, Flame, Loader2, CheckCircle, Download } from "lucide-react";
import { WorkoutCard } from "@/components/treino/WorkoutCard";
import { SuccessAnimation } from "@/components/feedback/SuccessAnimation";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { generateProtocolPdf } from "@/lib/generateProtocolPdf";
import { toast } from "sonner";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl?: string;
  tips?: string;
  completed?: boolean;
}

interface Workout {
  day: string;
  focus: string;
  duration: string;
  calories: number;
  completed: boolean;
  exercises: Exercise[];
}

interface Protocol {
  id: string;
  conteudo: {
    fase?: string;
    descricao?: string;
    semana_atual?: number;
    total_semanas?: number;
    treinos?: Workout[];
  };
}

export default function Treino() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
const { 
    getTotalCount, 
    getTotalCalories, 
    getWeeklyCount, 
    todayCompleted, 
    completeWorkout,
    getCurrentStreak 
  } = useWorkoutTracking();

  const currentStreak = getCurrentStreak();
  useEffect(() => {
    const fetchProtocol = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("protocolos")
          .select("id, conteudo")
          .eq("user_id", user.id)
          .eq("tipo", "treino")
          .eq("ativo", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching protocol:", error);
        } else if (data) {
          setProtocol(data as Protocol);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [user]);

  const workouts = useMemo<Workout[]>(() => {
    if (!protocol?.conteudo) return [];

    const conteudo: any = protocol.conteudo;

    // Novo formato: treinos com letras (A, B, C, D) - PREFERIDO
    if (Array.isArray(conteudo.treinos) && conteudo.treinos.length > 0) {
      return conteudo.treinos.map((treino: any): Workout => ({
        day: `Treino ${treino.letra || treino.nome || ""}`, // "Treino A", "Treino B"
        focus: treino.foco || treino.nome || "",
        duration: String(treino.duracao_minutos || 45),
        calories: treino.calorias_estimadas || 0,
        completed: false,
        exercises: (treino.exercicios || []).map(
          (ex: any): Exercise => ({
            name: ex.nome,
            sets: ex.series,
            reps: ex.repeticoes,
            rest: ex.descanso,
            videoUrl: ex.video_url,
            tips: ex.dicas,
            completed: false,
          }),
        ),
      }));
    }

    // Formato legado: semanas com dias
    const semanas = conteudo.semanas;
    if (!Array.isArray(semanas) || semanas.length === 0) return [];

    const currentWeekNumber = conteudo.semana_atual || semanas[0].semana;
    const currentWeek =
      semanas.find((s: any) => s.semana === currentWeekNumber) || semanas[0];

    if (!Array.isArray(currentWeek.dias)) return [];

    return currentWeek.dias.map((dia: any): Workout => ({
      day: dia.dia,
      focus: dia.foco,
      duration: String(dia.duracao_minutos || dia.duracao || 45),
      calories: dia.calorias || 0,
      completed: false,
      exercises: (dia.exercicios || []).map(
        (ex: any): Exercise => ({
          name: ex.nome,
          sets: ex.series,
          reps: ex.repeticoes,
          rest: ex.descanso,
          videoUrl: ex.video_url,
          tips: ex.dicas,
          completed: false,
        }),
      ),
    }));
  }, [protocol]);

  const completedWorkoutsToday = todayCompleted ? 1 : 0;
  const totalCaloriesFromTracking = getTotalCalories();
  const weeklyCount = getWeeklyCount();
  const totalCount = getTotalCount();

  const handleCompleteWorkout = async (workout: Workout) => {
    const success = await completeWorkout(
      workout.focus,
      workout.exercises.length,
      parseInt(workout.duration) || 45,
      workout.calories
    );
    if (success) {
      setShowSuccess(true);
    }
  };
  if (loading) {
    return (
      <ClientLayout>
        <SuccessAnimation 
          show={showSuccess} 
          onComplete={() => setShowSuccess(false)}
          type="trophy"
          message="Treino Concluído!"
          subMessage="Você está cada vez mais perto do seu objetivo!"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <SuccessAnimation 
        show={showSuccess} 
        onComplete={() => setShowSuccess(false)}
        type="trophy"
        message="Treino Concluído!"
        subMessage="Você está cada vez mais perto do seu objetivo!"
      />
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold uppercase text-foreground">
                Seu <span className="text-primary">Treino</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {workouts.length > 0 
                  ? "Clique em um exercício para ver o vídeo"
                  : "Seu protocolo será gerado em breve"}
              </p>
            </div>
          </div>
          {protocol && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                generateProtocolPdf({
                  id: protocol.id,
                  tipo: "treino",
                  titulo: "Protocolo de Treino",
                  conteudo: protocol.conteudo,
                  data_geracao: new Date().toISOString()
                });
                toast.success("PDF baixado!");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>

        {workouts.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum treino disponível</h3>
            <p className="text-muted-foreground mb-4">
              Seu protocolo de treino será gerado em breve. Fale com seu mentor para mais informações.
            </p>
            <Button variant="fire" onClick={() => navigate("/suporte")}>
              Falar com Mentor
            </Button>
          </Card>
        ) : (
          <>
            {/* Streak Display */}
            <StreakDisplay 
              currentStreak={currentStreak} 
              longestStreak={currentStreak}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Card className="p-2.5 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{weeklyCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Esta semana</p>
                  </div>
                </div>
              </Card>
              <Card className="p-2.5 sm:p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{currentStreak}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Dias seguidos</p>
                  </div>
                </div>
              </Card>
              <Card className="p-2.5 sm:p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{totalCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Treinos feitos</p>
                  </div>
                </div>
              </Card>
              <Card className="p-2.5 sm:p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  {todayCompleted ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  ) : (
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{todayCompleted ? "Feito!" : "Pendente"}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Treino hoje</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Week phase */}
            {protocol?.conteudo?.fase && (
              <Card className="p-3 sm:p-4 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-foreground truncate">{protocol.conteudo.fase}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{protocol.conteudo.descricao || "Fase do seu protocolo"}</p>
                    </div>
                  </div>
                  {protocol.conteudo.total_semanas && (
                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
                        Sem. {protocol.conteudo.semana_atual || 1}/{protocol.conteudo.total_semanas}
                      </p>
                      <div className="w-16 sm:w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${((protocol.conteudo.semana_atual || 1) / protocol.conteudo.total_semanas) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Workouts */}
            <div className="space-y-3 sm:space-y-4">
              {workouts.map((workout, index) => (
                <WorkoutCard
                  key={workout.day || index}
                  day={workout.day}
                  focus={workout.focus}
                  exercises={workout.exercises}
                  duration={workout.duration}
                  calories={workout.calories}
                  completed={workout.completed}
                  index={index}
                  onComplete={() => handleCompleteWorkout(workout)}
                  todayCompleted={todayCompleted}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </ClientLayout>
  );
}
