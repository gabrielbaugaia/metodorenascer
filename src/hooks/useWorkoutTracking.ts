import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

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
  const { trackFirstWorkoutCompleted, trackStreak3Days, trackWorkoutCompleted } = useAnalytics();

  const fetchCompletions = useCallback(async () => {
    if (!user) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      console.log("[WorkoutTracking] Fetching completions for user:", user.id);
      const { data, error } = await supabase
        .from("workout_completions")
        .select("*")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      console.log(`[WorkoutTracking] Fetch completed in ${elapsed}ms, records: ${data?.length || 0}`);

      if (error) throw error;

      setCompletions(data || []);

      // Check if today's workout is completed
      const today = new Date().toISOString().split("T")[0];
      const todayWorkout = data?.find((c) => c.workout_date === today);
      setTodayCompleted(!!todayWorkout);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error("[WorkoutTracking] Timeout exceeded");
      } else {
        console.error("[WorkoutTracking] Error fetching completions:", error);
      }
      setCompletions([]); // Fallback seguro
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  // Update streak when workout is completed
  const updateStreak = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    try {
      const { data: existing } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        // Create new streak record
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });
        return { newStreak: 1, isNewRecord: true };
      } else {
        const lastDate = existing.last_activity_date;
        
        if (lastDate === today) {
          // Already recorded today
          return { newStreak: existing.current_streak, isNewRecord: false };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = 1;
        if (lastDate === yesterdayStr) {
          // Consecutive day
          newStreak = existing.current_streak + 1;
        }

        const newLongest = Math.max(newStreak, existing.longest_streak);
        const isNewRecord = newStreak > existing.longest_streak;

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        return { newStreak, isNewRecord };
      }
    } catch (error) {
      console.error("Error updating streak:", error);
      return null;
    }
  };

  // Check and unlock achievements
  const checkAchievements = async (workoutCount: number, streakCount: number) => {
    if (!user) return;

    try {
      // Get user's current achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      // Get all achievement types
      const { data: achievementTypes } = await supabase
        .from("achievement_types")
        .select("*");

      if (!achievementTypes) return;

      const newAchievements: string[] = [];

      // Check workout-based achievements
      const workoutMilestones: Record<number, string> = {
        1: "first_workout",
        10: "workout_10",
        25: "workout_25",
        50: "workout_50",
        100: "workout_100",
      };

      for (const [milestone, achievementId] of Object.entries(workoutMilestones)) {
        if (workoutCount >= parseInt(milestone) && !unlockedIds.has(achievementId)) {
          newAchievements.push(achievementId);
        }
      }

      // Check streak-based achievements
      const streakMilestones: Record<number, string> = {
        3: "streak_3",
        7: "streak_7",
        14: "streak_14",
        30: "streak_30",
      };

      for (const [milestone, achievementId] of Object.entries(streakMilestones)) {
        if (streakCount >= parseInt(milestone) && !unlockedIds.has(achievementId)) {
          newAchievements.push(achievementId);
        }
      }

      // Unlock new achievements
      for (const achievementId of newAchievements) {
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievementId,
          notified: false,
        });

        if (!error) {
          const achievement = achievementTypes.find(a => a.id === achievementId);
          if (achievement) {
            sonnerToast.success(`Nova conquista: ${achievement.name}!`, {
              description: achievement.description,
              duration: 5000,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

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

      // Update streak
      const streakResult = await updateStreak();
      
      // Get total workout count for achievements
      const newTotalCount = completions.length + 1;
      
      // Track activation events
      trackWorkoutCompleted(workoutName, exercisesCompleted);
      
      // Track first workout completed (activation event)
      if (newTotalCount === 1) {
        trackFirstWorkoutCompleted();
      }
      
      // Track streak_3_days activation event
      if (streakResult && streakResult.newStreak === 3) {
        trackStreak3Days();
      }
      
      // Check for achievements
      if (streakResult) {
        await checkAchievements(newTotalCount, streakResult.newStreak);
        
        // Show streak notification
        if (streakResult.newStreak > 1) {
          const streakMessage = streakResult.isNewRecord 
            ? `Novo recorde! ${streakResult.newStreak} dias seguidos!`
            : `${streakResult.newStreak} dias de sequência!`;
          
          sonnerToast.success(streakMessage, {
            icon: "🔥",
            duration: 4000,
          });
        }
      }

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
    if (!completions || !Array.isArray(completions)) return 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return completions.filter((c) => new Date(c.workout_date) >= oneWeekAgo).length;
  };

  const getMonthlyCount = () => {
    if (!completions || !Array.isArray(completions)) return 0;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return completions.filter((c) => new Date(c.workout_date) >= oneMonthAgo).length;
  };

  const getTotalCount = () => completions?.length ?? 0;

  const getTotalCalories = () => {
    if (!completions || !Array.isArray(completions)) return 0;
    return completions.reduce((acc, c) => acc + (c.calories_burned || 0), 0);
  };

  // Calculate current streak from completions
  const getCurrentStreak = useCallback(() => {
    if (!completions || !Array.isArray(completions) || completions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort completions by date descending
    const sortedCompletions = [...completions].sort(
      (a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()
    );
    
    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i].workout_date);
      completionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);
      
      // Allow for today or yesterday as starting point
      if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        if (completionDate.getTime() === today.getTime() || 
            completionDate.getTime() === yesterday.getTime()) {
          streak = 1;
          continue;
        } else {
          break;
        }
      }
      
      expectedDate.setDate(today.getDate() - streak);
      
      if (completionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [completions]);

  return {
    completions,
    loading,
    todayCompleted,
    completeWorkout,
    getWeeklyCount,
    getMonthlyCount,
    getTotalCount,
    getTotalCalories,
    getCurrentStreak,
    refetch: fetchCompletions,
  };
}
