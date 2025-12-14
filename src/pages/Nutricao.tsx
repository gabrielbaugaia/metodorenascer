import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, Flame, Droplets, Beef, Cookie, Loader2 } from "lucide-react";

interface Meal {
  time: string;
  meal: string;
  foods: string[];
  calories: number;
}

interface Macros {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  water: { current: number; target: number };
}

interface NutritionProtocol {
  id: string;
  conteudo: {
    refeicoes?: Meal[];
    macros?: Macros;
    dicas?: string[];
  };
}

export default function Nutricao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [protocol, setProtocol] = useState<NutritionProtocol | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtocol = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("protocolos")
          .select("id, conteudo")
          .eq("user_id", user.id)
          .eq("tipo", "nutricao")
          .eq("ativo", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching nutrition protocol:", error);
        } else if (data) {
          setProtocol(data as NutritionProtocol);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [user]);

  const meals = protocol?.conteudo?.refeicoes || [];
  const macros = protocol?.conteudo?.macros;

  const macroIcons = {
    calories: { icon: Flame, color: "text-orange-500", unit: "kcal", label: "Calorias" },
    protein: { icon: Beef, color: "text-red-500", unit: "g", label: "Proteína" },
    carbs: { icon: Cookie, color: "text-yellow-500", unit: "g", label: "Carboidratos" },
    water: { icon: Droplets, color: "text-blue-500", unit: "L", label: "Água" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-4xl text-foreground">
                Plano <span className="text-gradient">Nutricional</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              {meals.length > 0 
                ? "Seu cardápio estratégico para máxima performance"
                : "Seu protocolo nutricional será gerado em breve"}
            </p>
          </div>

          {meals.length === 0 ? (
            <Card className="p-8 text-center">
              <Utensils className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum plano nutricional disponível</h3>
              <p className="text-muted-foreground mb-4">
                Complete sua anamnese para receber seu protocolo nutricional personalizado.
              </p>
              <Button variant="fire" onClick={() => navigate("/anamnese")}>
                Completar Anamnese
              </Button>
            </Card>
          ) : (
            <>
              {/* Macros overview */}
              {macros && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {Object.entries(macros).map(([key, value]) => {
                    const macroInfo = macroIcons[key as keyof typeof macroIcons];
                    if (!macroInfo || !value) return null;
                    const Icon = macroInfo.icon;
                    return (
                      <Card key={key} variant="glass" className="p-4 text-center">
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${macroInfo.color}`} />
                        <p className="text-2xl font-bold text-foreground">
                          {value.current}
                          <span className="text-sm text-muted-foreground">{macroInfo.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          de {value.target}{macroInfo.unit}
                        </p>
                        <div className="progress-bar mt-2 h-1">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(100, (value.current / value.target) * 100)}%` }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Meals */}
              <div className="space-y-4">
                {meals.map((meal, index) => (
                  <Card
                    key={`${meal.meal}-${index}`}
                    variant="dashboard"
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <span className="text-sm text-primary font-mono">{meal.time}</span>
                          <span className="font-display">{meal.meal}</span>
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {meal.calories} kcal
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {meal.foods.map((food, foodIndex) => (
                          <li key={foodIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {food}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tips */}
              {protocol?.conteudo?.dicas && protocol.conteudo.dicas.length > 0 && (
                <Card variant="glass" className="mt-6 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Dica do dia:</strong> {protocol.conteudo.dicas[0]}
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
