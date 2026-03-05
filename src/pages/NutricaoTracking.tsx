import { useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { CalorieGauge } from "@/components/nutrition/CalorieGauge";
import { MacroDonutChart } from "@/components/nutrition/MacroDonutChart";
import { MealSection } from "@/components/nutrition/MealSection";
import { FoodSearchModal } from "@/components/nutrition/FoodSearchModal";
import { useNutritionTracking, type FoodItem } from "@/hooks/useNutritionTracking";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function NutricaoTracking() {
  const { byMeal, consumed, remaining, targets, isLoading, addFood, removeFood } = useNutritionTracking();
  const [modalMeal, setModalMeal] = useState<string | null>(null);

  const handleSelectFood = async (food: FoodItem) => {
    if (!modalMeal) return;
    await addFood({
      food_name: food.food_name,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      portion_size: food.portion_size,
      meal_type: modalMeal,
    });
  };

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
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24 md:pb-6">
        <PageHeader title="Diário Nutricional" subtitle="Registre suas refeições de hoje" />

        {/* Calorie Gauge */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <CalorieGauge
            consumed={consumed.calories}
            target={targets.calories_target}
            remaining={remaining.calories}
          />
        </div>

        {/* Macro Donuts */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex justify-around">
            <MacroDonutChart label="Proteína" consumed={consumed.protein} target={targets.protein_target_g} color="hsl(var(--primary))" />
            <MacroDonutChart label="Carboidratos" consumed={consumed.carbs} target={targets.carbs_target_g} color="hsl(45, 93%, 47%)" />
            <MacroDonutChart label="Gordura" consumed={consumed.fat} target={targets.fat_target_g} color="hsl(0, 84%, 60%)" />
          </div>
        </div>

        {/* Meal Sections */}
        {MEAL_TYPES.map((meal) => (
          <MealSection
            key={meal}
            mealType={meal}
            foods={byMeal[meal]}
            onAddFood={() => setModalMeal(meal)}
            onRemoveFood={(id) => removeFood(id)}
          />
        ))}

        {/* Food Search Modal */}
        <FoodSearchModal
          open={!!modalMeal}
          onClose={() => setModalMeal(null)}
          mealType={modalMeal ?? "snack"}
          onSelectFood={handleSelectFood}
        />
      </div>
    </ClientLayout>
  );
}
