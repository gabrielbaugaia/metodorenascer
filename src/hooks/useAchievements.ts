import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  points: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch achievement types
      const { data: types } = await supabase
        .from("achievement_types")
        .select("*")
        .order("category", { ascending: true });

      // Fetch user achievements
      const { data: userAch } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at, notified")
        .eq("user_id", user.id);

      // Fetch user streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", user.id)
        .single();

      if (types) setAchievements(types);
      if (userAch) {
        setUserAchievements(userAch);
        // Calculate total points
        const points = userAch.reduce((sum, ua) => {
          const ach = types?.find(a => a.id === ua.achievement_id);
          return sum + (ach?.points || 0);
        }, 0);
        setTotalPoints(points);
      }
      if (streakData) setStreak(streakData);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Record activity and update streak
  const recordActivity = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    try {
      const { data: existing } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        // Create new streak record
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });
        setStreak({ current_streak: 1, longest_streak: 1, last_activity_date: today });
      } else {
        const lastDate = existing.last_activity_date;
        
        if (lastDate === today) {
          // Already recorded today
          return;
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

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        setStreak({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
        });

        // Check for streak achievements
        await checkStreakAchievements(newStreak);
      }
    } catch (error) {
      console.error("Error recording activity:", error);
    }
  }, [user]);

  // Check and unlock streak achievements
  const checkStreakAchievements = async (currentStreak: number) => {
    if (!user) return;

    const streakMilestones = [3, 7, 14, 30];
    
    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone) {
        await unlockAchievement(`streak_${milestone}`);
      }
    }
  };

  // Check workout count achievements
  const checkWorkoutAchievements = async (workoutCount: number) => {
    if (!user) return;

    const workoutMilestones = [1, 10, 25, 50, 100];
    
    for (const milestone of workoutMilestones) {
      if (workoutCount >= milestone) {
        const achievementId = milestone === 1 ? "first_workout" : `workout_${milestone}`;
        await unlockAchievement(achievementId);
      }
    }
  };

  // Unlock an achievement
  const unlockAchievement = async (achievementId: string) => {
    if (!user) return;

    // Check if already unlocked
    const alreadyUnlocked = userAchievements.some(ua => ua.achievement_id === achievementId);
    if (alreadyUnlocked) return;

    try {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievementId,
        notified: false,
      });

      if (!error) {
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
          toast.success(`Nova conquista desbloqueada: ${achievement.name}!`, {
            description: achievement.description,
            duration: 5000,
          });
        }
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error unlocking achievement:", error);
    }
  };

  return {
    achievements,
    userAchievements,
    streak,
    totalPoints,
    loading,
    recordActivity,
    checkWorkoutAchievements,
    unlockAchievement,
    refresh: fetchData,
  };
}