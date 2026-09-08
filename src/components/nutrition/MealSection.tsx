import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodLogEntry } from "@/hooks/useNutritionTracking";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanches",
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
    <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold">{MEAL_LABELS[mealType] ?? mealType}</h4>
        <span className="text-xs text-muted-foreground">{Math.round(totalCals)} kcal</span>
      </div>

      {foods.length > 0 && (
        <div className="space-y-1">
          {foods.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm py-2.5 border-b border-border/50 last:border-0">
              <div className="flex-1 min-w-0">
                <span className="text-foreground truncate block">{f.food_name}</span>
                <span className="text-muted-foreground">{f.portion_size}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{Math.round(Number(f.calories))} kcal</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFood(f.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${f.food_name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full mt-2" onClick={onAddFood}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Adicionar alimento
      </Button>
    </div>
  );
}
