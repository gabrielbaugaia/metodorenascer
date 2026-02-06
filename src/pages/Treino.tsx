import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutTracking } from "@/hooks/useWorkoutTracking";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Calendar, Trophy, Flame, Loader2, CheckCircle, Download, AlertTriangle, RefreshCw, Lock } from "lucide-react";
import { WorkoutCard } from "@/components/treino/WorkoutCard";
import { SuccessAnimation } from "@/components/feedback/SuccessAnimation";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { LockedContent } from "@/components/access/LockedContent";
import { TrialBanner } from "@/components/access/TrialBadge";
import { UpgradeModal } from "@/components/access/UpgradeModal";
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
  console.log("[Treino] Component mounted");
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log("[Treino] User:", user?.id);
  const { access, loading: accessLoading, hasFullAccess, hasAnyAccess, isTrialing, trialDaysLeft } = useModuleAccess('treino');
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  console.log("[Treino] Initializing workout tracking");
  const { 
    getTotalCount, 
    getTotalCalories, 
    getWeeklyCount, 
    todayCompleted, 
    completeWorkout,
    getCurrentStreak 
  } = useWorkoutTracking();
  console.log("[Treino] Workout tracking initialized");

  const currentStreak = getCurrentStreak();
  console.log("[Treino] Current streak:", currentStreak);
  
  // Telemetry helper
  const logTrace = async (outcome: string, details: Record<string, unknown> = {}) => {
    if (!user) return;
    try {
      await supabase.from("events").insert({
        user_id: user.id,
        event_name: "treino_page_trace",
        page_name: "/treino",
        metadata: {
          outcome,
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error("[Treino] Trace log failed:", e);
    }
  };

  useEffect(() => {
    console.log("[Treino] fetchProtocol useEffect triggered");
    const fetchProtocol = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setError(null);
      setLoading(true);
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        console.log("[Treino] Fetching protocol for user:", user.id);
        const { data, error: fetchError } = await supabase
          .from("protocolos")
          .select("id, conteudo")
          .eq("user_id", user.id)
          .eq("tipo", "treino")
          .eq("ativo", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .abortSignal(controller.signal)
          .maybeSingle();
        
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[Treino] Protocol fetch completed in ${elapsed}ms`);
        
        if (fetchError) {
          console.error("[Treino] Error fetching protocol:", fetchError);
          setError("Erro ao carregar treino. Tente novamente.");
          logTrace("fetch_error", { error: fetchError.message, elapsed_ms: elapsed });
        } else if (data) {
          console.log("[Treino] Protocol fetched successfully");
          const conteudo = data.conteudo as Record<string, unknown>;
          const treinosLen = Array.isArray(conteudo?.treinos) ? conteudo.treinos.length : 0;
          const semanasLen = Array.isArray(conteudo?.semanas) ? conteudo.semanas.length : 0;
          logTrace("fetch_success", { 
            elapsed_ms: elapsed, 
            protocol_id: data.id,
            treinos_len: treinosLen,
            semanas_len: semanasLen,
          });
          setProtocol(data as Protocol);
        } else {
          console.log("[Treino] No protocol found for user");
          logTrace("no_protocol", { elapsed_ms: elapsed });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error("[Treino] Error:", err);
        
        if (err.name === 'AbortError') {
          setError("Tempo esgotado. Verifique sua conexão.");
          logTrace("timeout", {});
        } else {
          setError("Erro ao carregar treino. Tente novamente.");
          logTrace("exception", { error: err.message });
        }
      } finally {
        console.log("[Treino] Setting loading to false");
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [user, retryCount]);

  const workouts = useMemo<Workout[]>(() => {
    if (!protocol?.conteudo) return [];

    const conteudo: any = protocol.conteudo;

    // Helper: normalize exercise fields (accept multiple field names)
    const normalizeExercise = (ex: any): Exercise => ({
      name: ex.nome || ex.name || "Exercício",
      sets: ex.series ?? ex.sets ?? 3,
      reps: ex.repeticoes || ex.reps || "12",
      rest: ex.descanso || ex.rest || "60s",
      videoUrl: ex.video_url || ex.videoUrl || undefined,
      tips: ex.dicas || ex.tips || undefined,
      completed: false,
    });

    // Novo formato: treinos com letras (A, B, C, D) - PREFERIDO
    if (Array.isArray(conteudo.treinos) && conteudo.treinos.length > 0) {
      console.log("[Treino] Usando formato A/B/C/D, treinos:", conteudo.treinos.length);
      return conteudo.treinos.map((treino: any): Workout => {
        const exercicios = Array.isArray(treino.exercicios) ? treino.exercicios : [];
        return {
          day: `Treino ${treino.letra || treino.nome || ""}`, // "Treino A", "Treino B"
          focus: treino.foco || treino.nome || "",
          duration: String(treino.duracao_minutos || 45),
          calories: treino.calorias_estimadas || 0,
          completed: false,
          exercises: exercicios.map(normalizeExercise),
        };
      });
    }

    // Formato legado: semanas com dias
    const semanas = conteudo.semanas;
    if (!Array.isArray(semanas) || semanas.length === 0) {
      console.log("[Treino] Nenhum formato válido encontrado");
      return [];
    }

    console.log("[Treino] Usando formato legado (semanas)");
    const currentWeekNumber = conteudo.semana_atual || semanas[0].semana;
    const currentWeek =
      semanas.find((s: any) => s.semana === currentWeekNumber) || semanas[0];

    if (!Array.isArray(currentWeek.dias)) return [];

    return currentWeek.dias.map((dia: any): Workout => {
      const exercicios = Array.isArray(dia.exercicios) ? dia.exercicios : [];
      return {
        day: dia.dia,
        focus: dia.foco,
        duration: String(dia.duracao_minutos || dia.duracao || 45),
        calories: dia.calorias || 0,
        completed: false,
        exercises: exercicios.map(normalizeExercise),
      };
    });
  }, [protocol]);

  const completedWorkoutsToday = todayCompleted ? 1 : 0;
  const totalCaloriesFromTracking = loading ? 0 : getTotalCalories();
  const weeklyCount = loading ? 0 : getWeeklyCount();
  const totalCount = loading ? 0 : getTotalCount();

  const handleCompleteWorkout = async (workout: Workout) => {
    console.log("[Treino] Completing workout:", workout.focus);
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
    console.log("[Treino] Rendering loading state");
    return (
      <ClientLayout>
        <SuccessAnimation 
          show={showSuccess} 
          onComplete={() => setShowSuccess(false)}
          type="trophy"
          message="Treino Concluído!"
          subMessage="Você está cada vez mais perto do seu objetivo!"
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando seu treino...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    console.log("[Treino] Rendering error state:", error);
    return (
      <ClientLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center border-destructive/50">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Erro ao carregar</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="outline" onClick={() => setRetryCount(c => c + 1)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
              <Button variant="fire" onClick={() => navigate("/suporte")}>
                Falar com Suporte
              </Button>
            </div>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  console.log("[Treino] Rendering main content, workouts count:", workouts.length);
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
          {protocol && hasFullAccess && (
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

        {/* Access blocked overlay */}
        {!accessLoading && !hasAnyAccess && (
          <LockedContent module="treino">
            <div />
          </LockedContent>
        )}

        {/* Trial banner */}
        {isTrialing && (
          <TrialBanner 
            trialDaysLeft={trialDaysLeft} 
            onUpgradeClick={() => setShowUpgradeModal(true)} 
          />
        )}

        {workouts.length === 0 && hasAnyAccess ? (
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
        ) : hasAnyAccess ? (
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

            {/* Workouts - limited by access */}
            {(() => {
              const maxVisible = access?.level === 'limited'
                ? (access.limits?.max_workouts_visible as number || 1)
                : workouts.length;
              const visibleWorkouts = workouts.slice(0, maxVisible);
              const lockedWorkouts = workouts.slice(maxVisible);

              return (
                <div className="space-y-3 sm:space-y-4">
                  {visibleWorkouts.map((workout, index) => (
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
                  {lockedWorkouts.length > 0 && (
                    <>
                      {lockedWorkouts.map((workout, index) => (
                        <Card 
                          key={`locked-${index}`} 
                          className="p-4 relative overflow-hidden cursor-pointer opacity-60 blur-[2px] hover:opacity-80 transition-all"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">{workout.day}</p>
                              <p className="text-sm text-muted-foreground">{workout.focus}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                      <div className="text-center py-2">
                        <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
                          Desbloquear todos os treinos
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </>
        ) : null}
      </div>
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        currentModule="treino"
        trialDaysLeft={trialDaysLeft}
      />
    </ClientLayout>
  );
}
