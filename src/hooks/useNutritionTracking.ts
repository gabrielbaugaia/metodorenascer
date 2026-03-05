import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

const MOTIVATIONAL_MESSAGES = [
  "Refeição registrada. Sua consistência nutricional está se fortalecendo.",
  "Registro alimentar concluído.",
  "Disciplina nutricional registrada.",
  "Progresso registrado. Continue no controle.",
  "Consistência fortalece a disciplina.",
];

export interface FoodLogEntry {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_size: string;
  meal_type: string;
}

export interface NutritionTargets {
  calories_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

export interface FoodItem {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_size: string;
  category: string;
}

export function useNutritionTracking(date?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = date ?? format(new Date(), "yyyy-MM-dd");

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["food-logs", user?.id, today],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("food_logs")
        .select("id, food_name, calories, protein_g, carbs_g, fat_g, portion_size, meal_type")
        .eq("user_id", user!.id)
        .eq("date", today)
        .order("created_at", { ascending: true });
      return (data ?? []) as FoodLogEntry[];
    },
  });

  const { data: targets } = useQuery({
    queryKey: ["nutrition-targets", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_nutrition_targets")
        .select("calories_target, protein_target_g, carbs_target_g, fat_target_g")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data ?? { calories_target: 2000, protein_target_g: 120, carbs_target_g: 200, fat_target_g: 65 }) as NutritionTargets;
    },
    staleTime: 10 * 60 * 1000,
  });

  const addFoodMutation = useMutation({
    mutationFn: async (food: { food_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; portion_size: string; meal_type: string }) => {
      const { error } = await supabase.from("food_logs").insert({
        user_id: user!.id,
        date: today,
        ...food,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ["micro-wins-today"] });
      const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      toast.success(msg);
    },
  });

  const removeFoodMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", user?.id, today] });
    },
  });

  const allLogs = logs ?? [];
  const byMeal = {
    breakfast: allLogs.filter(l => l.meal_type === "breakfast"),
    lunch: allLogs.filter(l => l.meal_type === "lunch"),
    dinner: allLogs.filter(l => l.meal_type === "dinner"),
    snack: allLogs.filter(l => l.meal_type === "snack"),
  };

  const consumed = {
    calories: allLogs.reduce((s, l) => s + Number(l.calories), 0),
    protein: allLogs.reduce((s, l) => s + Number(l.protein_g), 0),
    carbs: allLogs.reduce((s, l) => s + Number(l.carbs_g), 0),
    fat: allLogs.reduce((s, l) => s + Number(l.fat_g), 0),
  };

  const t = targets ?? { calories_target: 2000, protein_target_g: 120, carbs_target_g: 200, fat_target_g: 65 };
  const remaining = {
    calories: Math.max(0, t.calories_target - consumed.calories),
    protein: Math.max(0, t.protein_target_g - consumed.protein),
    carbs: Math.max(0, t.carbs_target_g - consumed.carbs),
    fat: Math.max(0, t.fat_target_g - consumed.fat),
  };

  const addMultipleFoods = async (foods: Array<{ food_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; portion_size: string; meal_type: string }>) => {
    const rows = foods.map((f) => ({ user_id: user!.id, date: today, ...f }));
    const { error } = await supabase.from("food_logs").insert(rows);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["food-logs", user?.id, today] });
    queryClient.invalidateQueries({ queryKey: ["micro-wins-today"] });
    toast.success(`${foods.length} alimentos registrados.`);
  };

  return {
    logs: allLogs,
    byMeal,
    consumed,
    remaining,
    targets: t,
    isLoading: logsLoading,
    addFood: addFoodMutation.mutateAsync,
    addMultipleFoods,
    removeFood: removeFoodMutation.mutateAsync,
    isAdding: addFoodMutation.isPending,
  };
}
