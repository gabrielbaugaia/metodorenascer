import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodLogEntry } from "@/hooks/useNutritionTracking";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "☀️ Café da Manhã",
  lunch: "🍽️ Almoço",
  dinner: "🌙 Jantar",
  snack: "🥜 Lanches",
};

interface MealSectionProps {
  mealType: string;
  foods: FoodLogEntry[];
  onAddFood: () => void;
  onRemoveFood: (id: string) => void;
}

export function MealSection({ mealType, foods, onAddFood, onRemoveFood }: MealSectionProps) {
  const totalCals = foods.reduce((s, f) => s + Number(f.calories), 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{MEAL_LABELS[mealType] ?? mealType}</h4>
        <span className="text-xs text-muted-foreground">{Math.round(totalCals)} kcal</span>
      </div>

      {foods.length > 0 && (
        <div className="space-y-1">
          {foods.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
              <div className="flex-1 min-w-0">
                <span className="text-foreground truncate block">{f.food_name}</span>
                <span className="text-muted-foreground">{f.portion_size}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{Math.round(Number(f.calories))} kcal</span>
                <button
                  onClick={() => onRemoveFood(f.id)}
                  className="text-muted-foreground/50 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={onAddFood}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Adicionar alimento
      </Button>
    </div>
  );
}
