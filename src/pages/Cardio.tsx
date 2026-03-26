import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { CardioStatsHeader } from "@/components/cardio/CardioStatsHeader";
import { CardioLogForm } from "@/components/cardio/CardioLogForm";
import { CardioHistoryList } from "@/components/cardio/CardioHistoryList";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HeartPulse } from "lucide-react";
import { startOfMonth, format } from "date-fns";

export default function Cardio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["cardio-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cardio_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .order("session_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const thisMonth = sessions.filter((s: any) => s.session_date >= monthStart);
    return {
      totalSessions: thisMonth.length,
      totalMinutes: thisMonth.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0),
      totalKm: thisMonth.reduce((acc: number, s: any) => acc + (Number(s.distance_km) || 0), 0),
      totalCalories: thisMonth.reduce((acc: number, s: any) => acc + (s.calories_burned || 0), 0),
    };
  }, [sessions, monthStart]);

  const createMutation = useMutation({
    mutationFn: async ({ formData, screenshotUrl }: { formData: any; screenshotUrl: string | null }) => {
      const row = {
        user_id: user!.id,
        session_date: formData.session_date,
        cardio_type: formData.cardio_type,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
        distance_km: formData.distance_km ? Number(formData.distance_km) : null,
        calories_burned: formData.calories_burned ? Number(formData.calories_burned) : null,
        avg_hr_bpm: formData.avg_hr_bpm ? Number(formData.avg_hr_bpm) : null,
        max_hr_bpm: formData.max_hr_bpm ? Number(formData.max_hr_bpm) : null,
        fasting: formData.fasting,
        notes: formData.notes || null,
        fitness_screenshot_url: screenshotUrl,
      };

      const { error } = await supabase.from("cardio_sessions").insert(row);
      if (error) throw error;

      // Sync to health_daily
      if (row.duration_minutes || row.calories_burned) {
        const { data: existing } = await supabase
          .from("health_daily")
          .select("id, exercise_minutes, active_calories")
          .eq("user_id", user!.id)
          .eq("date", row.session_date)
          .maybeSingle();

        const newMinutes = (existing?.exercise_minutes || 0) + (row.duration_minutes || 0);
        const newCalories = (existing?.active_calories || 0) + (row.calories_burned || 0);

        if (existing) {
          await supabase.from("health_daily").update({
            exercise_minutes: newMinutes,
            active_calories: newCalories,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await supabase.from("health_daily").insert({
            user_id: user!.id,
            date: row.session_date,
            exercise_minutes: row.duration_minutes || 0,
            active_calories: row.calories_burned || 0,
            source: "manual",
          });
        }
      }

      // Register workout completion for streak
      await supabase.from("workout_completions").insert({
        user_id: user!.id,
        workout_date: row.session_date,
        workout_name: `Aeróbico - ${row.cardio_type}`,
        duration_minutes: row.duration_minutes || null,
        calories_burned: row.calories_burned || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardio-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["health-daily"] });
      queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
      toast.success("Sessão de aeróbico registrada!");
    },
    onError: () => toast.error("Erro ao salvar sessão"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cardio_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardio-sessions"] });
      toast.success("Sessão removida");
    },
  });

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-3xl mx-auto pb-24">
        <PageHeader
          title="Aeróbico"
          description="Registre e acompanhe seus treinos de cardio"
          icon={<HeartPulse className="h-5 w-5" />}
        />

        <CardioStatsHeader stats={stats} />

        <CardioLogForm
          userId={user!.id}
          onSubmit={(formData, screenshotUrl) => createMutation.mutate({ formData, screenshotUrl })}
          isSubmitting={createMutation.isPending}
        />

        <div>
          <h3 className="font-semibold text-foreground mb-3">Histórico</h3>
          <CardioHistoryList
            sessions={sessions as any}
            onDelete={(id) => deleteMutation.mutate(id)}
            isDeleting={deleteMutation.isPending}
          />
        </div>
      </div>
    </ClientLayout>
  );
}
