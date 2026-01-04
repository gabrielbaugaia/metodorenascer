import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface WorkoutCompletion {
  id: string;
  workout_date: string;
  workout_name: string | null;
  exercises_completed: number | null;
  duration_minutes: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
}

export function useWorkoutTracking() {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCompleted, setTodayCompleted] = useState(false);

  const fetchCompletions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("workout_completions")
        .select("*")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false });

      if (error) throw error;

      setCompletions(data || []);

      // Check if today's workout is completed
      const today = new Date().toISOString().split("T")[0];
      const todayWorkout = data?.find((c) => c.workout_date === today);
      setTodayCompleted(!!todayWorkout);
    } catch (error) {
      console.error("Error fetching workout completions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const completeWorkout = async (
    workoutName: string,
    exercisesCompleted: number,
    durationMinutes?: number,
    caloriesBurned?: number,
    notes?: string
  ) => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split("T")[0];

      // Check if already completed today
      const existing = completions.find((c) => c.workout_date === today);
      if (existing) {
        toast({
          title: "Treino já registrado",
          description: "Você já registrou um treino hoje!",
          variant: "default",
        });
        return false;
      }

      const { error } = await supabase.from("workout_completions").insert({
        user_id: user.id,
        workout_date: today,
        workout_name: workoutName,
        exercises_completed: exercisesCompleted,
        duration_minutes: durationMinutes,
        calories_burned: caloriesBurned,
        notes: notes,
      });

      if (error) throw error;

      toast({
        title: "Treino concluído!",
        description: "Parabéns! Continue assim, guerreiro!",
      });

      // Enviar push notification de parabéns (fire and forget)
      supabase.functions.invoke("send-push", {
        body: {
          user_id: user.id,
          notification_type: "workout_completed",
        },
      }).catch(console.error);

      await fetchCompletions();
      return true;
    } catch (error) {
      console.error("Error completing workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o treino",
        variant: "destructive",
      });
      return false;
    }
  };

  const getWeeklyCount = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return completions.filter((c) => new Date(c.workout_date) >= oneWeekAgo).length;
  };

  const getMonthlyCount = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return completions.filter((c) => new Date(c.workout_date) >= oneMonthAgo).length;
  };

  const getTotalCount = () => completions.length;

  const getTotalCalories = () => {
    return completions.reduce((acc, c) => acc + (c.calories_burned || 0), 0);
  };

  return {
    completions,
    loading,
    todayCompleted,
    completeWorkout,
    getWeeklyCount,
    getMonthlyCount,
    getTotalCount,
    getTotalCalories,
    refetch: fetchCompletions,
  };
}
