import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutTracking } from "@/hooks/useWorkoutTracking";
import { useEntitlements } from "@/hooks/useEntitlements";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Trophy, Flame, Loader2, CheckCircle, Download, AlertTriangle, RefreshCw, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCardMini } from "@/components/ui/stat-card-mini";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkoutCard } from "@/components/treino/WorkoutCard";
import { SuccessAnimation } from "@/components/feedback/SuccessAnimation";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFull, isTrialing, isBlocked, trialUsage, markUsed, loading: entLoading } = useEntitlements();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { 
    getTotalCount, 
    getTotalCalories, 
    getWeeklyCount, 
    todayCompleted, 
    completeWorkout,
    getCurrentStreak 
  } = useWorkoutTracking();

  const currentStreak = getCurrentStreak();

  const logTrace = async (outcome: string, details: Record<string, unknown> = {}) => {
    if (!user) return;
    try {
      await supabase.from("events").insert({
        user_id: user.id,
        event_name: "treino_page_trace",
        page_name: "/treino",
        metadata: { outcome, ...details, timestamp: new Date().toISOString() },
      });
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    const fetchProtocol = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setError(null);
      setLoading(true);
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
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
        if (fetchError) {
          setError("Erro ao carregar treino. Tente novamente.");
          logTrace("fetch_error", { error: fetchError.message, elapsed_ms: elapsed });
        } else if (data) {
          const conteudo = data.conteudo as Record<string, unknown>;
          const treinosLen = Array.isArray(conteudo?.treinos) ? conteudo.treinos.length : 0;
          const semanasLen = Array.isArray(conteudo?.semanas) ? conteudo.semanas.length : 0;
          logTrace("fetch_success", { elapsed_ms: elapsed, protocol_id: data.id, treinos_len: treinosLen, semanas_len: semanasLen });
          setProtocol(data as Protocol);
        } else {
          logTrace("no_protocol", { elapsed_ms: elapsed });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError("Tempo esgotado. Verifique sua conexão.");
          logTrace("timeout", {});
        } else {
          setError("Erro ao carregar treino. Tente novamente.");
          logTrace("exception", { error: err.message });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProtocol();
  }, [user, retryCount]);

  const workouts = useMemo<Workout[]>(() => {
    if (!protocol?.conteudo) return [];
    const conteudo: any = protocol.conteudo;
    const normalizeExercise = (ex: any): Exercise => ({
      name: ex.nome || ex.name || "Exercício",
      sets: ex.series ?? ex.sets ?? 3,
      reps: ex.repeticoes || ex.reps || "12",
      rest: ex.descanso || ex.rest || "60s",
      videoUrl: ex.video_url || ex.videoUrl || undefined,
      tips: ex.dicas || ex.tips || undefined,
      completed: false,
    });
    if (Array.isArray(conteudo.treinos) && conteudo.treinos.length > 0) {
      return conteudo.treinos.map((treino: any): Workout => {
        const exercicios = Array.isArray(treino.exercicios) ? treino.exercicios : [];
        return {
          day: `Treino ${treino.letra || treino.nome || ""}`,
          focus: treino.foco || treino.nome || "",
          duration: String(treino.duracao_minutos || 45),
          calories: treino.calorias_estimadas || 0,
          completed: false,
          exercises: exercicios.map(normalizeExercise),
        };
      });
    }
    const semanas = conteudo.semanas;
    if (!Array.isArray(semanas) || semanas.length === 0) return [];
    const currentWeekNumber = conteudo.semana_atual || semanas[0].semana;
    const currentWeek = semanas.find((s: any) => s.semana === currentWeekNumber) || semanas[0];
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

  const weeklyCount = loading ? 0 : getWeeklyCount();
  const totalCount = loading ? 0 : getTotalCount();

  const handleCompleteWorkout = async (workout: Workout, durationSeconds?: number, sessionId?: string) => {
    const durationMinutes = durationSeconds ? Math.round(durationSeconds / 60) : (parseInt(workout.duration) || 45);
    const success = await completeWorkout(
      workout.focus, workout.exercises.length, durationMinutes, workout.calories, undefined, durationSeconds, sessionId
    );
    if (success) setShowSuccess(true);
  };

  if (loading) {
    return (
      <ClientLayout>
        <SuccessAnimation show={showSuccess} onComplete={() => setShowSuccess(false)} type="trophy" message="Treino Concluído!" subMessage="Você está cada vez mais perto do seu objetivo!" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando seu treino...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center border-destructive/50">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" strokeWidth={1.5} />
            <h3 className="text-base font-semibold mb-1">Erro ao carregar</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setRetryCount(c => c + 1)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
              <Button size="sm" onClick={() => navigate("/suporte")}>
                Falar com Suporte
              </Button>
            </div>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <SuccessAnimation show={showSuccess} onComplete={() => setShowSuccess(false)} type="trophy" message="Treino Concluído!" subMessage="Você está cada vez mais perto do seu objetivo!" />
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header — flat, sem gradiente */}
        <PageHeader
          title="Treino"
          subtitle={workouts.length > 0 ? "Clique em um exercício para ver o vídeo" : "Seu protocolo será gerado em breve"}
          actions={
            protocol && isFull ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  generateProtocolPdf({ id: protocol.id, tipo: "treino", titulo: "Protocolo de Treino", conteudo: protocol.conteudo, data_geracao: new Date().toISOString() });
                  toast.success("PDF baixado!");
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            ) : undefined
          }
        />

        {!entLoading && isBlocked && (
          <UpgradeModal open={true} onClose={() => setShowUpgradeModal(false)} />
        )}

        {isTrialing && (
          <TrialBanner isTrialing={isTrialing} onUpgradeClick={() => setShowUpgradeModal(true)} />
        )}

        {workouts.length === 0 && !isBlocked ? (
          <EmptyState
            icon={Target}
            title="Nenhum treino disponível"
            description="Seu protocolo de treino será gerado em breve. Fale com seu mentor para mais informações."
            ctaLabel="Falar com Mentor"
            ctaAction={() => navigate("/suporte")}
          />
        ) : !isBlocked ? (
          <>
            {/* Stats — flat, sem gradientes coloridos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <StatCardMini icon={Calendar} label="Esta semana" value={weeklyCount} />
              <StatCardMini icon={Flame} label="Dias seguidos" value={currentStreak} />
              <StatCardMini icon={Trophy} label="Treinos feitos" value={totalCount} />
              <StatCardMini
                icon={todayCompleted ? CheckCircle : Target}
                label="Treino hoje"
                value={todayCompleted ? "Feito" : "Pendente"}
              />
            </div>

            {/* Week phase */}
            {protocol?.conteudo?.fase && (
              <Card className="p-3 sm:p-4 border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Trophy className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{protocol.conteudo.fase}</p>
                      <p className="text-xs text-muted-foreground truncate">{protocol.conteudo.descricao || "Fase do seu protocolo"}</p>
                    </div>
                  </div>
                  {protocol.conteudo.total_semanas && (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-primary whitespace-nowrap">
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
            {(() => {
              const maxVisible = isTrialing ? 1 : workouts.length;
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
                      onComplete={(durationSeconds?: number, sessionId?: string) => handleCompleteWorkout(workout, durationSeconds, sessionId)}
                      todayCompleted={todayCompleted}
                    />
                  ))}
                  {lockedWorkouts.length > 0 && (
                    <>
                      {lockedWorkouts.map((workout, index) => (
                        <Card key={`locked-${index}`} className="p-4 relative overflow-hidden cursor-pointer opacity-60 blur-[2px] hover:opacity-80 transition-all" onClick={() => setShowUpgradeModal(true)}>
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
                        <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(true)}>
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
      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </ClientLayout>
  );
}
