import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";
import type { FoodItem } from "@/hooks/useNutritionTracking";

interface FoodSearchModalProps {
  open: boolean;
  onClose: () => void;
  mealType: string;
  onSelectFood: (food: FoodItem) => void;
}

export function FoodSearchModal({ open, onClose, mealType, onSelectFood }: FoodSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let builder = supabase.from("foods_database").select("*").order("food_name");
      if (q.trim()) {
        builder = builder.ilike("food_name", `%${q.trim()}%`);
      }
      const { data } = await builder.limit(20);
      setResults((data ?? []) as FoodItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      search(query);
    }
  }, [open, query, search]);

  const handleSelect = (food: FoodItem) => {
    onSelectFood(food);
    onClose();
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Buscar Alimento</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Digite o alimento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[50vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum alimento encontrado.
            </p>
          )}
          {!loading && results.map((food) => (
            <button
              key={food.id}
              onClick={() => handleSelect(food)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{food.food_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {food.portion_size} · P:{Math.round(food.protein_g)}g C:{Math.round(food.carbs_g)}g G:{Math.round(food.fat_g)}g
                </p>
              </div>
              <span className="text-xs font-semibold text-foreground">{Math.round(food.calories)} kcal</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
