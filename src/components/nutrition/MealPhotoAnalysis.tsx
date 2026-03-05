import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X } from "lucide-react";

export interface DetectedFood {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_size: string;
  selected?: boolean;
}

interface MealPhotoAnalysisProps {
  foods: DetectedFood[];
  isLoading: boolean;
  onConfirm: (foods: DetectedFood[]) => void;
  onCancel: () => void;
}

export function MealPhotoAnalysis({ foods, isLoading, onConfirm, onCancel }: MealPhotoAnalysisProps) {
  const [selected, setSelected] = useState<boolean[]>(foods.map(() => true));

  const toggle = (i: number) => {
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const selectedFoods = foods.filter((_, i) => selected[i]);
  const totalCal = selectedFoods.reduce((s, f) => s + f.calories, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analisando sua refeição...</p>
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Nenhum alimento identificado na foto.</p>
        <Button variant="outline" size="sm" onClick={onCancel} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Alimentos detectados</p>
        <button onClick={onCancel} className="p-1 rounded hover:bg-muted">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-1 max-h-[40vh] overflow-y-auto">
        {foods.map((food, i) => (
          <label
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Checkbox checked={selected[i]} onCheckedChange={() => toggle(i)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{food.food_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {food.portion_size} · P:{Math.round(food.protein_g)}g C:{Math.round(food.carbs_g)}g G:{Math.round(food.fat_g)}g
              </p>
            </div>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {Math.round(food.calories)} kcal
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{Math.round(totalCal)} kcal</span>
        </p>
        <Button
          size="sm"
          onClick={() => onConfirm(selectedFoods)}
          disabled={selectedFoods.length === 0}
        >
          Confirmar ({selectedFoods.length})
        </Button>
      </div>
    </div>
  );
}
