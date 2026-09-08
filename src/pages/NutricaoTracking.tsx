import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CalorieGauge } from "@/components/nutrition/CalorieGauge";
import { MacroDonutChart } from "@/components/nutrition/MacroDonutChart";
import { MealSection } from "@/components/nutrition/MealSection";
import { FoodSearchModal } from "@/components/nutrition/FoodSearchModal";
import { useNutritionTracking, type FoodItem } from "@/hooks/useNutritionTracking";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PageLoadingState } from "@/components/ui/page-states";
import { Apple } from "lucide-react";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function NutricaoTracking() {
  const { byMeal, consumed, remaining, targets, isLoading, addFood, addMultipleFoods, removeFood, logs } =
    useNutritionTracking();
  const { trackMealRegistrationStarted, trackMealRegistered } = useAnalytics();
  const navigate = useNavigate();
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
    trackMealRegistered("diario", 1);
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <PageLoadingState message="Carregando seu diário de hoje..." />
      </ClientLayout>
    );
  }

  const isEmptyDay = logs.length === 0;

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-6">
        <PageHeader
          eyebrow="Continuação do plano nutricional"
          title="Diário de hoje"
          subtitle="O que você já comeu hoje e o que ainda falta para fechar o plano."
          actions={
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => navigate("/nutricao")}>
              <Apple className="mr-2 h-4 w-4" strokeWidth={1.6} />
              Ver plano
            </Button>
          }
        />

        {isEmptyDay && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 text-sm leading-relaxed text-muted-foreground md:p-6">
            Nenhuma refeição registrada hoje. Você pode registrar direto pelo seu plano nutricional ou
            adicionar um alimento abaixo.
          </div>
        )}

        {/* Calorie Gauge */}
        <div className="premium-card p-6 md:p-8">
          <CalorieGauge
            consumed={consumed.calories}
            target={targets.calories_target}
            remaining={remaining.calories}
          />
        </div>

        {/* Macro Donuts */}
        <div className="premium-card p-5 md:p-6">
          <p className="eyebrow-label mb-5">Macronutrientes</p>
          <div className="grid gap-5 sm:grid-cols-3">
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
            onAddFood={() => {
              trackMealRegistrationStarted("diario");
              setModalMeal(meal);
            }}
            onRemoveFood={(id) => removeFood(id)}
          />
        ))}

        {/* Food Search Modal */}
        <FoodSearchModal
          open={!!modalMeal}
          onClose={() => setModalMeal(null)}
          mealType={modalMeal ?? "snack"}
          onSelectFood={handleSelectFood}
          onAddMultipleFoods={async (foods) => {
            await addMultipleFoods(foods);
            trackMealRegistered("diario", foods.length);
          }}
        />
      </div>
    </ClientLayout>
  );
}
