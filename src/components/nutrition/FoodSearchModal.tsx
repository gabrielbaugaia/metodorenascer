import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Camera, PenLine } from "lucide-react";
import { MealPhotoAnalysis, type DetectedFood } from "./MealPhotoAnalysis";
import { toast } from "sonner";
import type { FoodItem } from "@/hooks/useNutritionTracking";

interface FoodSearchModalProps {
  open: boolean;
  onClose: () => void;
  mealType: string;
  onSelectFood: (food: FoodItem) => void;
  onAddMultipleFoods?: (foods: Array<{ food_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; portion_size: string; meal_type: string }>) => void;
}

type ModalView = "search" | "manual" | "photo-result";

export function FoodSearchModal({ open, onClose, mealType, onSelectFood, onAddMultipleFoods }: FoodSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ModalView>("search");

  // Manual form
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualPortion, setManualPortion] = useState("1 porção");

  // Photo analysis
  const [photoFoods, setPhotoFoods] = useState<DetectedFood[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setView("search");
    setQuery("");
    setManualName("");
    setManualCal("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setManualPortion("1 porção");
    setPhotoFoods([]);
  };

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
    if (open && view === "search") {
      search(query);
    }
  }, [open, query, search, view]);

  const handleSelect = (food: FoodItem) => {
    onSelectFood(food);
    onClose();
    resetState();
  };

  const handleManualSubmit = () => {
    const cal = Number(manualCal);
    if (!manualName.trim() || !cal || cal <= 0) {
      toast.error("Preencha ao menos nome e calorias.");
      return;
    }
    onSelectFood({
      id: crypto.randomUUID(),
      food_name: manualName.trim(),
      calories: cal,
      protein_g: Number(manualProtein) || 0,
      carbs_g: Number(manualCarbs) || 0,
      fat_g: Number(manualFat) || 0,
      portion_size: manualPortion || "1 porção",
      category: "custom",
    });
    onClose();
    resetState();
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    setView("photo-result");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-meal-photo", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setPhotoFoods([]);
      } else {
        setPhotoFoods(data?.foods ?? []);
      }
    } catch (err) {
      console.error("Photo analysis error:", err);
      toast.error("Erro ao analisar foto. Tente novamente.");
      setPhotoFoods([]);
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePhotoConfirm = (foods: DetectedFood[]) => {
    if (onAddMultipleFoods) {
      onAddMultipleFoods(
        foods.map((f) => ({
          food_name: f.food_name,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
          portion_size: f.portion_size,
          meal_type: mealType,
        }))
      );
    } else {
      // Fallback: add one by one
      foods.forEach((f) => {
        onSelectFood({
          id: crypto.randomUUID(),
          food_name: f.food_name,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
          portion_size: f.portion_size,
          category: "ai_detected",
        });
      });
    }
    onClose();
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetState(); } }}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {view === "search" && "Buscar Alimento"}
            {view === "manual" && "Adicionar Manualmente"}
            {view === "photo-result" && "Scan de Refeição"}
          </DialogTitle>
        </DialogHeader>

        {view === "photo-result" && (
          <MealPhotoAnalysis
            foods={photoFoods}
            isLoading={photoLoading}
            onConfirm={handlePhotoConfirm}
            onCancel={() => setView("search")}
          />
        )}

        {view === "manual" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do alimento *</Label>
              <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Ex: Frango milanesa" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Calorias *</Label>
                <Input type="number" value={manualCal} onChange={(e) => setManualCal(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Porção</Label>
                <Input value={manualPortion} onChange={(e) => setManualPortion(e.target.value)} placeholder="1 porção" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Proteína (g)</Label>
                <Input type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Carboidrato (g)</Label>
                <Input type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Gordura (g)</Label>
                <Input type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setView("search")} className="flex-1">Voltar</Button>
              <Button size="sm" onClick={handleManualSubmit} className="flex-1">Adicionar</Button>
            </div>
          </div>
        )}

        {view === "search" && (
          <>
            {/* Photo scan button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              📸 Escanear prato com IA
            </Button>

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

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[40vh]">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-3">Nenhum alimento encontrado.</p>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => { setView("manual"); setManualName(query); }}>
                    <PenLine className="h-3.5 w-3.5" />
                    Adicionar manualmente
                  </Button>
                </div>
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
              {!loading && results.length > 0 && (
                <div className="text-center pt-2 pb-1">
                  <button
                    onClick={() => setView("manual")}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <PenLine className="h-3 w-3" />
                    Não encontrou? Adicionar manualmente
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
